import '@/lib/envConfig';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shopPartnerStore } from '@/lib/shopPartnerStore';

export const dynamic = 'force-dynamic';

function getPartnerBranches(shopId: string) {
  const current = shopPartnerStore.accounts.find((a) => a.shopId === shopId);
  if (!current) return [];
  const normName = (current.shopName || '').trim().toLowerCase();
  const normPhone = (current.phone || '').replace(/\D/g, '').slice(-10);
  const normEmail = (current.email || '').trim().toLowerCase();

  const matching = shopPartnerStore.accounts.filter((a) => {
    if (a.status !== 'ACTIVE') return false;
    if (a.shopId === shopId) return true;
    const sameBrand = (a.shopName || '').trim().toLowerCase() === normName;
    if (!sameBrand) return false;
    const p = (a.phone || '').replace(/\D/g, '').slice(-10);
    const e = (a.email || '').trim().toLowerCase();
    return Boolean((normPhone && p === normPhone) || (normEmail && e === normEmail));
  });

  // Deduplicate by pincode, preferring the currently active shopId
  const seenPins = new Set<string>();
  const ordered = [
    ...matching.filter((m) => m.shopId === shopId),
    ...matching.filter((m) => m.shopId !== shopId),
  ];
  return ordered.filter((m) => {
    const key = `${(m.shopName || '').trim().toLowerCase()}:${m.pincode}`;
    if (seenPins.has(key)) return false;
    seenPins.add(key);
    return true;
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId') || '';

    if (!shopId) {
      return NextResponse.json({ success: false, message: 'shopId is required.' }, { status: 400 });
    }

    await shopPartnerStore.syncAccountsFromRedis().catch(() => {});
    const branchesRaw = getPartnerBranches(shopId);
    const parentName = branchesRaw[0]?.shopName || '';

    const [locations, reviews] = await Promise.all([
      prisma.partnerLocation.findMany().catch(() => []),
      parentName
        ? prisma.storeReview
            .findMany({
              where: { shopName: { equals: parentName, mode: 'insensitive' } },
            })
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    const locMap = new Map(locations.map((l) => [l.shopId, l]));
    const overallReviewCount = reviews.length;
    const overallRating =
      overallReviewCount > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / overallReviewCount).toFixed(1))
        : 0;

    const branches = branchesRaw.map(({ passwordHash, ...safe }) => {
      const loc = locMap.get(safe.shopId);
      return {
        ...safe,
        address: loc?.address || safe.address,
        pincode: loc?.pincode || safe.pincode,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        overallRating,
        overallReviewCount,
      };
    });

    return NextResponse.json({
      success: true,
      branches,
      overallRating,
      overallReviewCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load partner branches.' },
      { status: 500 }
    );
  }
}
