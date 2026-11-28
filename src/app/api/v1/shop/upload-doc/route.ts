import { NextResponse } from 'next/server';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isAdminAuthorized } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

function getMimeTypeForExt(ext: string): string {
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function isSupportedDocumentBuffer(buffer: Buffer): boolean {
  const isPdf = buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  const isJpg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isWebp = buffer.length > 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return isPdf || isJpg || isPng || isWebp;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon-client';
    const rateLimitKey = `rate-limit:kyc-upload:${ip}`;
    try {
      const { redisCommand } = await import('@/lib/redis');
      const attempts = await redisCommand('incr', rateLimitKey);
      if (attempts === 1) await redisCommand('expire', rateLimitKey, 600);
      if (attempts && Number(attempts) > 10) {
        return NextResponse.json(
          { success: false, message: 'Upload rate limit reached. Please wait 10 minutes before uploading more documents.' },
          { status: 429 }
        );
      }
    } catch {}

    const contentType = req.headers.get('content-type') || '';

    // Handle multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const docType = (formData.get('docType') as string) || 'document';

      if (!file) {
        return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: 'File size exceeds maximum allowed limit (10MB).' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (!isSupportedDocumentBuffer(buffer)) {
        return NextResponse.json({ success: false, message: 'Invalid file contents. Only authentic PDF, JPG, PNG, and WebP files are allowed.' }, { status: 400 });
      }

      const rawExt = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
      const ext = allowedExtensions.includes(rawExt) ? rawExt : 'jpg';
      const safeDocType = docType.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
      const filename = `${safeDocType}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
      const mimeType = getMimeTypeForExt(ext);

      await prisma.storedFile.create({
        data: {
          filename,
          category: 'kyc',
          mimeType,
          size: buffer.length,
          data: buffer,
        },
      });

      const fileUrl = `/api/v1/shop/upload-doc?file=${filename}`;

      return NextResponse.json({
        success: true,
        url: fileUrl,
        filename: file.name,
        size: file.size,
      });
    }

    // Handle JSON Base64 payload
    const body = await req.json();
    const { fileData, fileName, docType } = body;

    if (!fileData) {
      return NextResponse.json({ success: false, message: 'fileData is required.' }, { status: 400 });
    }

    let finalUrl = fileData;

    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const rawMime = matches[1];
        const base64Content = matches[2];
        if (base64Content.length > 14_000_000) {
          return NextResponse.json(
            { success: false, message: 'File size exceeds maximum allowed limit (10MB).' },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(base64Content, 'base64');
        if (buffer.length > 10 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: 'File size exceeds maximum allowed limit (10MB).' },
            { status: 400 }
          );
        }
        if (!isSupportedDocumentBuffer(buffer)) {
          return NextResponse.json(
            { success: false, message: 'Invalid file contents. Only authentic PDF, JPG, PNG, and WebP files are allowed.' },
            { status: 400 }
          );
        }

        let ext = 'jpg';
        if (rawMime.includes('pdf')) ext = 'pdf';
        else if (rawMime.includes('png')) ext = 'png';
        else if (rawMime.includes('webp')) ext = 'webp';

        const safeDocType = (docType || 'doc').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
        const filename = `${safeDocType}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;

        await prisma.storedFile.create({
          data: {
            filename,
            category: 'kyc',
            mimeType: getMimeTypeForExt(ext),
            size: buffer.length,
            data: buffer,
          },
        });

        finalUrl = `/api/v1/shop/upload-doc?file=${filename}`;
      }
    }

    return NextResponse.json({
      success: true,
      url: finalUrl,
      filename: fileName || 'uploaded-doc',
    });
  } catch (error: any) {
    console.error('Doc upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload document.' },
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

    const cookieHeader = req.headers.get('cookie') || '';
    const hasAdminCookie =
      cookieHeader.includes('mbm_admin_token=') ||
      cookieHeader.includes('mbm_admin_authenticated=true');

    if (!isAdminAuthorized(req) && !hasAdminCookie) {
      return NextResponse.json({ success: false, message: 'Unauthorized. KYC documents are restricted to Admin.' }, { status: 401 });
    }

    const safeFilename = path.basename(file);
    const record = await prisma.storedFile.findUnique({
      where: { filename: safeFilename },
    });

    if (!record || record.category !== 'kyc') {
      return NextResponse.json({ success: false, message: 'Document not found.' }, { status: 404 });
    }

    return new NextResponse(Buffer.from(record.data), {
      headers: {
        'Content-Type': record.mimeType,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to retrieve document.' }, { status: 500 });
  }
}
