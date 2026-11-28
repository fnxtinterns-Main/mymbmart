import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shopPartnerStore } from '@/lib/shopPartnerStore';
import { getCatalogProducts, syncCatalogFromRedis } from '@/lib/catalog';
import {
  geocodeAddress,
  getGoogleMapsDirectionsUrl,
  getGoogleMapsDistances,
  haversineDistanceKm,
} from '@/lib/geoUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latParam = parseFloat(searchParams.get('lat') || '');
    const lngParam = parseFloat(searchParams.get('lng') || '');
    const pincodeParam = searchParams.get('pincode') || '';
    const addressParam = searchParams.get('address') || '';
    const userId = searchParams.get('userId') || '';

    let userLat = latParam;
    let userLng = lngParam;
    if (isNaN(userLat) || isNaN(userLng)) {
      const geo = await geocodeAddress(
        [addressParam, pincodeParam, 'India'].filter(Boolean).join(', '),
        pincodeParam || '834001'
      );
      userLat = geo.latitude;
      userLng = geo.longitude;
    }

    await Promise.all([
      shopPartnerStore.syncAccountsFromRedis().catch(() => {}),
      shopPartnerStore.syncFromRedis().catch(() => {}),
      syncCatalogFromRedis().catch(() => {}),
    ]);

    const catalog = getCatalogProducts();

    const [partnerLocations, allReviews, blockedRows, verifiedSellers] = await Promise.all([
      prisma.partnerLocation.findMany().catch(() => []),
      prisma.storeReview.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
      userId
        ? prisma.blockedStore.findMany({ where: { userId } }).catch(() => [])
        : Promise.resolve([]),
      prisma.sellerProfile
        .findMany({ where: { isVerified: true }, include: { user: true } })
        .catch(() => []),
    ]);

    const locationMap = new Map(partnerLocations.map((l) => [l.shopId, l]));
    const blockedMap = new Map(blockedRows.map((b) => [b.shopId, b]));

    // Aggregate overall partner rating across all shops sharing the same partner shopName
    const reviewStatsByName = new Map<string, { sum: number; count: number }>();
    for (const r of allReviews) {
      const key = r.shopName.trim().toLowerCase();
      const curr = reviewStatsByName.get(key) || { sum: 0, count: 0 };
      curr.sum += r.rating;
      curr.count += 1;
      reviewStatsByName.set(key, curr);
    }

    const countListedProducts = (shopId: string, shopName: string, pincode: string): number => {
      const cleanName = shopName.trim().toLowerCase();
      if (!cleanName) return 0;
      return catalog.filter((p) => {
        const prod = p.producerName || '';
        if (prod.includes(`[${shopId}]`)) return true;
        if (prod.includes('[MBM-SHP-')) return false;
        return prod.toLowerCase().includes(cleanName) && (!pincode || prod.includes(pincode));
      }).length;
    };

    const candidateStores: any[] = [];
    const seenShopIds = new Set<string>();

    // Only approved ACTIVE partner branches (excluding dummy test@test.com seed account)
    const activeAccounts = [...shopPartnerStore.accounts]
      .reverse()
      .filter((acc) => {
        if (acc.status !== 'ACTIVE') return false;
        if ((acc.email || '').toLowerCase() === 'test@test.com') return false;
        if (seenShopIds.has(acc.shopId)) return false;
        seenShopIds.add(acc.shopId);
        return true;
      });

    const activeResolved = await Promise.all(
      activeAccounts.map(async (acc) => {
        const savedLoc = locationMap.get(acc.shopId);
        const pincode = savedLoc?.pincode || acc.pincode || '834001';
        const listedCount = countListedProducts(acc.shopId, acc.shopName, pincode);
        const coords = savedLoc
          ? { latitude: savedLoc.latitude, longitude: savedLoc.longitude }
          : await geocodeAddress(`${acc.address}, ${pincode}, India`, pincode);

        const stats = reviewStatsByName.get(acc.shopName.trim().toLowerCase());
        const blocked = blockedMap.get(acc.shopId);

        return {
          shopId: acc.shopId,
          shopName: acc.shopName,
          address: savedLoc?.address || acc.address,
          city: savedLoc?.city || 'Ranchi',
          pincode,
          latitude: coords.latitude,
          longitude: coords.longitude,
          businessType: acc.businessType,
          listedProductCount: listedCount,
          avgRating: stats ? Number((stats.sum / stats.count).toFixed(1)) : 0,
          reviewCount: stats ? stats.count : 0,
          isBlocked: Boolean(blocked),
          blockReason: blocked?.reason || null,
          hasVerifiedLocation: Boolean(savedLoc),
        };
      })
    );
    candidateStores.push(...activeResolved);

    // Also include verified SellerProfile stores only if they have listed products
    for (const s of verifiedSellers) {
      if (seenShopIds.has(s.id)) continue;
      const alreadyByName = candidateStores.some(
        (c) => c.shopName.trim().toLowerCase() === s.businessName.trim().toLowerCase()
      );
      if (alreadyByName) continue;
      const savedLoc = locationMap.get(s.id);
      const pincode = savedLoc?.pincode || '834001';
      const listedCount = countListedProducts(s.id, s.businessName, pincode);
      if (listedCount <= 0) continue;

      const coords = savedLoc
        ? { latitude: savedLoc.latitude, longitude: savedLoc.longitude }
        : await geocodeAddress(`${s.city}, ${s.state}, ${pincode}, India`, pincode);

      const stats = reviewStatsByName.get(s.businessName.trim().toLowerCase());
      const blocked = blockedMap.get(s.id);

      seenShopIds.add(s.id);
      candidateStores.push({
        shopId: s.id,
        shopName: s.businessName,
        address: savedLoc?.address || `${s.city}, ${s.state}`,
        city: savedLoc?.city || s.city,
        pincode,
        latitude: coords.latitude,
        longitude: coords.longitude,
        businessType: s.isSHG ? 'SHG_COOPERATIVE' : 'KIRANA_GENERAL',
        listedProductCount: listedCount,
        avgRating: stats ? Number((stats.sum / stats.count).toFixed(1)) : 0,
        reviewCount: stats ? stats.count : 0,
        isBlocked: Boolean(blocked),
        blockReason: blocked?.reason || null,
        hasVerifiedLocation: Boolean(savedLoc),
      });
    }

    // Pre-filter within 35 km via fast Haversine and cap at 25 for Google Distance Matrix API limits
    const preFiltered = candidateStores
      .map((st) => ({
        store: st,
        approxKm: haversineDistanceKm(userLat, userLng, st.latitude, st.longitude),
      }))
      .filter((item) => item.approxKm <= 35)
      .sort((a, b) => a.approxKm - b.approxKm)
      .slice(0, 25);

    const targetStores = preFiltered.length > 0 ? preFiltered.map((p) => p.store) : candidateStores.slice(0, 25);

    const distances = await getGoogleMapsDistances(
      userLat,
      userLng,
      targetStores.map((st) => ({ latitude: st.latitude, longitude: st.longitude }))
    );

    const cleanUserPincode = pincodeParam.replace(/\D/g, '').slice(0, 6);
    const stores = targetStores
      .map((st, idx) => ({
        ...st,
        samePincode: Boolean(cleanUserPincode && st.pincode === cleanUserPincode),
        distanceKm: distances[idx]?.distanceKm ?? 0,
        durationText: distances[idx]?.durationText || null,
        distanceSource: distances[idx]?.source || 'gps_haversine',
        googleMapsUrl: getGoogleMapsDirectionsUrl(userLat, userLng, st.latitude, st.longitude),
      }))
      .filter((st) => st.distanceKm <= 20 || (st.samePincode && st.distanceKm <= 25))
      .sort((a, b) => {
        if (a.samePincode !== b.samePincode) return a.samePincode ? -1 : 1;
        return a.distanceKm - b.distanceKm;
      });

    return NextResponse.json({
      success: true,
      userCoords: { latitude: userLat, longitude: userLng, pincode: pincodeParam || null },
      stores,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load nearby stores.' },
      { status: 500 }
    );
  }
}
