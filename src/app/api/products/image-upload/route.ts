import { NextResponse } from 'next/server';
import { productImageLibrary } from '@/lib/productImageLibrary';
import { CATALOG_PRODUCTS } from '@/lib/catalog';
import { isAdminAuthorized } from '@/lib/securityUtils';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Enforce authentication: requires Admin, Partner session, or authenticated user
  const cookieHeader = req.headers.get('cookie') || '';
  const isPartner = cookieHeader.includes('mbm_partner_session=') || cookieHeader.includes('mbm_session=');
  const isAuthorized = isAdminAuthorized(req) || isPartner;

  if (!isAuthorized && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: 'Unauthorized. Partner or Admin session required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, productName, imageData, category } = body;

    if (!productId && !productName) {
      return NextResponse.json(
        { success: false, message: 'productId or productName is required.' },
        { status: 400 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { success: false, message: 'imageData (file or base64) is required.' },
        { status: 400 }
      );
    }

    // Size limit check: Max 5MB base64 payload (~7MB string length)
    if (typeof imageData === 'string' && imageData.length > 7 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Image exceeds maximum allowed size of 5MB.' },
        { status: 413 }
      );
    }

    let finalImageUrl = imageData;

    // If Base64 string submitted, save as file in public/uploads/products/
    if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
      try {
        const matches = imageData.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1].replace('jpeg', 'jpg');
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const safeKey = (productId || productName || 'prod')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-');
          const filename = `${safeKey}-${Date.now()}.${extension}`;
          const filePath = path.join(uploadDir, filename);

          fs.writeFileSync(filePath, buffer);
          finalImageUrl = `/uploads/products/${filename}`;
        }
      } catch (fileErr) {
        console.warn('[ImageUpload] Falling back to direct data URL:', fileErr);
      }
    }

    // Persist in image library
    if (productId) {
      productImageLibrary.saveProductImage(productId, finalImageUrl);
    }
    if (productName) {
      productImageLibrary.saveProductImage(productName, finalImageUrl);
    }

    // Update live catalog products in-memory if already present
    const normalizedKey = (productId || productName || '').toLowerCase();
    for (const p of CATALOG_PRODUCTS) {
      if (
        (productId && p.id.toLowerCase() === productId.toLowerCase()) ||
        (productName && p.name.toLowerCase() === productName.toLowerCase())
      ) {
        p.image = finalImageUrl;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product photo uploaded and permanently linked to catalog.',
      imageUrl: finalImageUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Image upload failed.' },
      { status: 500 }
    );
  }
}
