import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getCatalogProducts, updateCatalogProductStock } from '@/lib/catalog';
import { isAdminAuthorized, getJwtSecret } from '@/lib/securityUtils';
import { shopPartnerStore } from '@/lib/shopPartnerStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    const isAdmin = isAdminAuthorized(req);
    let isAuthorized = isAdmin;
    let partnerShopId: string | null = null;

    if (!isAuthorized) {
      const partnerMatch = cookieHeader.match(/mbm_partner_session=([^;]+)/);
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
      const tokenToVerify = partnerMatch?.[1] || bearerToken;

      if (tokenToVerify) {
        try {
          const decoded: any = jwt.verify(tokenToVerify, getJwtSecret(), { algorithms: ['HS256'] });
          if (decoded?.shopId || decoded?.role === 'SHOP_PARTNER') {
            isAuthorized = true;
            partnerShopId = decoded.shopId || null;
          }
        } catch {}
      }
    }

    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Valid Shop Partner or Admin session required.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, stockQuantity } = body;

    if (!productId || stockQuantity === undefined || stockQuantity === null || isNaN(Number(stockQuantity))) {
      return NextResponse.json(
        { success: false, message: 'Valid productId and numeric stockQuantity are required.' },
        { status: 400 }
      );
    }

    if (!isAdmin && partnerShopId) {
      const cleanId = String(productId).toLowerCase();
      const prod = getCatalogProducts().find(
        (p) => p.id.toLowerCase() === cleanId || (p.sku && p.sku.toLowerCase() === cleanId)
      );
      if (prod?.producerName && !prod.producerName.includes(`[${partnerShopId}]`)) {
        // Allow updates if product belongs to a sibling branch owned by the same merchant
        const currentAcc = shopPartnerStore.accounts.find((a) => a.shopId === partnerShopId);
        const normName = (currentAcc?.shopName || '').trim().toLowerCase();
        const normPhone = (currentAcc?.phone || '').replace(/\D/g, '').slice(-10);
        const normEmail = (currentAcc?.email || '').trim().toLowerCase();
        const isSiblingOwned = shopPartnerStore.accounts.some((a) => {
          if (!prod.producerName.includes(`[${a.shopId}]`)) return false;
          const sameBrand = (a.shopName || '').trim().toLowerCase() === normName;
          if (!sameBrand) return false;
          const p = (a.phone || '').replace(/\D/g, '').slice(-10);
          const e = (a.email || '').trim().toLowerCase();
          return Boolean((normPhone && p === normPhone) || (normEmail && e === normEmail));
        });

        if (!isSiblingOwned) {
          return NextResponse.json(
            { success: false, message: 'Forbidden. You do not own this product.' },
            { status: 403 }
          );
        }
      }
    }

    const cleanQty = Math.max(0, Math.round(Number(stockQuantity)));
    const updated = await updateCatalogProductStock(String(productId), cleanQty);

    return NextResponse.json({
      success: true,
      productId,
      stockQuantity: cleanQty,
      inStock: cleanQty > 0,
      product: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update stock.' },
      { status: 500 }
    );
  }
}
