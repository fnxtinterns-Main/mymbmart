import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const uploadRateMap = new Map<string, { count: number; startTime: number }>();

function isAllowedFileType(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;
  // PDF: %PDF
  if (ext === 'pdf' && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return true;
  // PNG: 89 50 4E 47
  if (ext === 'png' && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if ((ext === 'jpg' || ext === 'jpeg') && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // WEBP: RIFF ... WEBP
  if (ext === 'webp' && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return true;
  return false;
}

export async function POST(req: Request) {
  try {
    // Basic IP rate limiting: max 20 uploads per 10 minutes
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const now = Date.now();
    const rateRecord = uploadRateMap.get(ip);
    if (rateRecord) {
      if (now - rateRecord.startTime < 600000) {
        if (rateRecord.count >= 20) {
          return NextResponse.json(
            { success: false, message: 'Too many document uploads. Please wait 10 minutes.' },
            { status: 429 }
          );
        }
        rateRecord.count += 1;
      } else {
        uploadRateMap.set(ip, { count: 1, startTime: now });
      }
    } else {
      uploadRateMap.set(ip, { count: 1, startTime: now });
    }

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

      const rawExt = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
      if (!allowedExtensions.includes(rawExt) || !isAllowedFileType(buffer, rawExt)) {
        return NextResponse.json(
          { success: false, message: 'Invalid file format. Only JPG, PNG, WEBP, and PDF documents are permitted.' },
          { status: 400 }
        );
      }
      const ext = rawExt;
      const uploadDir = path.join(process.cwd(), 'data', 'kyc_uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const safeDocType = docType.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
      const filename = `${safeDocType}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);
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
      try {
        const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Content = matches[2];
          const buffer = Buffer.from(base64Content, 'base64');

          let ext = 'jpg';
          if (mimeType.includes('pdf')) ext = 'pdf';
          else if (mimeType.includes('png')) ext = 'png';
          else if (mimeType.includes('webp')) ext = 'webp';

          if (!isAllowedFileType(buffer, ext)) {
            return NextResponse.json(
              { success: false, message: 'Invalid file contents. Only authentic images and PDF files are allowed.' },
              { status: 400 }
            );
          }

          const uploadDir = path.join(process.cwd(), 'data', 'kyc_uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const safeDocType = (docType || 'doc').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
          const filename = `${safeDocType}-${Date.now()}.${ext}`;
          const filePath = path.join(uploadDir, filename);

          fs.writeFileSync(filePath, buffer);
          finalUrl = `/api/v1/shop/upload-doc?file=${filename}`;
        }
      } catch (fileErr) {
        console.warn('[DocUpload] Falling back to direct data URI:', fileErr);
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
    const authHeader = req.headers.get('authorization') || '';
    const ADMIN_PIN = process.env.ADMIN_PIN || (process.env.NODE_ENV !== 'production' ? 'MBM@Admin2026' : '');
    const JWT_SECRET = process.env.JWT_SECRET || 'megabachatmart-smartchain-secret-key-2026';

    let isAuthorized = false;

    // 1. Direct Bearer PIN or token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (ADMIN_PIN && token === ADMIN_PIN) isAuthorized = true;
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded && (decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN' || decoded.role === 'SHOP_PARTNER')) {
          isAuthorized = true;
        }
      } catch {}
    }

    // 2. Admin token cookie
    const adminTokenMatch = cookieHeader.match(/mbm_admin_token=([^;]+)/);
    if (adminTokenMatch) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const decoded: any = jwt.verify(adminTokenMatch[1], JWT_SECRET);
        if (decoded && (decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN')) isAuthorized = true;
      } catch {}
    }

    // 3. Partner session cookie
    const partnerTokenMatch = cookieHeader.match(/mbm_partner_session=([^;]+)/);
    if (partnerTokenMatch) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const decoded: any = jwt.verify(partnerTokenMatch[1], JWT_SECRET);
        if (decoded && (decoded.role === 'SHOP_PARTNER' || decoded.role === 'STORE_MANAGER' || decoded.role === 'SELLER' || decoded.role === 'ADMIN')) {
          isAuthorized = true;
        }
      } catch {}
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. KYC documents are restricted to verified administrators and partners.' },
        { status: 401 }
      );
    }

    const safeFilename = path.basename(file);
    const filePath = path.join(process.cwd(), 'data', 'kyc_uploads', safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, message: 'Document not found.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType =
      ext === '.pdf' ? 'application/pdf' :
      ext === '.png' ? 'image/png' :
      ext === '.webp' ? 'image/webp' :
      'image/jpeg';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to retrieve document.' }, { status: 500 });
  }
}
