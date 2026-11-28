import { NextResponse } from 'next/server';
import { productImageLibrary } from '@/lib/productImageLibrary';
import { getCatalogProducts } from '@/lib/catalog';
import { isAdminAuthorized, getJwtSecret } from '@/lib/securityUtils';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Enforce authentication: requires Admin or cryptographically verified Partner/User session
  const cookieHeader = req.headers.get('cookie') || '';
  const authHeader = req.headers.get('authorization') || '';
  let isAuthorized = isAdminAuthorized(req);

  if (!isAuthorized) {
    const partnerMatch = cookieHeader.match(/mbm_partner_session=([^;]+)/);
    const sessionMatch = cookieHeader.match(/mbm_session=([^;]+)/);
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const tokenToVerify = partnerMatch?.[1] || sessionMatch?.[1] || bearerToken;

    if (tokenToVerify) {
      try {
        const decoded: any = jwt.verify(tokenToVerify, getJwtSecret(), { algorithms: ['HS256'] });
        if (decoded?.role || decoded?.shopId || decoded?.userId) {
          isAuthorized = true;
        }
      } catch {}
    }
  }

  if (!isAuthorized && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: 'Unauthorized. Valid Partner or Admin session required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, productName, imageData } = body;

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

    // If Base64 string submitted, store directly in PostgreSQL StoredFile table
    if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
      const matches = imageData.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const rawExt = matches[1].toLowerCase().replace('jpeg', 'jpg');
        const allowedExtensions = ['jpg', 'png', 'webp'];
        if (!allowedExtensions.includes(rawExt)) {
          return NextResponse.json(
            { success: false, message: 'Invalid image format. Only JPG, PNG, and WebP images are permitted.' },
            { status: 400 }
          );
        }
        const extension = rawExt;
        const base64Data = matches[2];
        if (base64Data.length > 7_000_000) {
          return NextResponse.json(
            { success: false, message: 'Image exceeds 5MB limit.' },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(base64Data, 'base64');
        if (buffer.length > 5 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: 'Image exceeds 5MB limit.' },
            { status: 400 }
          );
        }

        // Verify image magic numbers to prevent malicious payload uploads
        const isValidMagic =
          (extension === 'jpg' && buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) ||
          (extension === 'png' && buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) ||
          (extension === 'webp' && buffer.length > 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP');

        if (!isValidMagic) {
          return NextResponse.json(
            { success: false, message: 'Invalid or corrupted image contents. Please upload an authentic image file.' },
            { status: 400 }
          );
        }

        const safeKey = (productId || productName || 'prod')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-');
        const filename = `${safeKey}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${extension}`;
        const mimeType =
          extension === 'png' ? 'image/png' :
          extension === 'webp' ? 'image/webp' :
          'image/jpeg';

        await prisma.storedFile.create({
          data: {
            filename,
            category: 'product',
            mimeType,
            size: buffer.length,
            data: buffer,
          },
        });

        finalImageUrl = `/api/products/image-upload?file=${filename}`;
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
    const catalog = getCatalogProducts();
    for (const p of catalog) {
      if (
        (productId && p.id.toLowerCase() === productId.toLowerCase()) ||
        (productName && p.name.toLowerCase() === productName.toLowerCase())
      ) {
        p.image = finalImageUrl;
        (p as any).imageUrl = finalImageUrl;
      }
    }

    // Sync to Redis cache if active
    try {
      const { isRedisConfigured, redisSet } = await import('@/lib/redis');
      if (isRedisConfigured()) {
        await redisSet('catalog:custom_products', catalog).catch(() => {});
      }
    } catch {}

    // Persist to PostgreSQL database if configured
    try {
      const { prisma } = await import('@/lib/prisma');
      const skuCode = productId ? `MBM-SKU-${productId.toUpperCase()}` : '';
      await prisma.product.updateMany({
        where: {
          OR: [
            ...(productId ? [{ id: productId }, { sku: skuCode }] : []),
            ...(productName ? [{ name: productName }] : []),
          ],
        },
        data: { imageUrl: finalImageUrl },
      });
    } catch {}

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get('file');
    if (!file) {
      return NextResponse.json({ success: false, message: 'File parameter is required.' }, { status: 400 });
    }

    const safeFilename = path.basename(file);
    const record = await prisma.storedFile.findUnique({
      where: { filename: safeFilename },
    });

    if (!record || record.category !== 'product') {
      return NextResponse.json({ success: false, message: 'Product image not found.' }, { status: 404 });
    }

    return new NextResponse(Buffer.from(record.data), {
      headers: {
        'Content-Type': record.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to load product image.' }, { status: 500 });
  }
}
