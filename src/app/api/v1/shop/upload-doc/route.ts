import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
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
      const ext = allowedExtensions.includes(rawExt) ? rawExt : 'jpg';
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
    const isAuthorized =
      cookieHeader.includes('mbm_admin_authenticated=true') ||
      cookieHeader.includes('mbm_partner_session=') ||
      cookieHeader.includes('mbm_session=') ||
      authHeader.startsWith('Bearer ');

    if (!isAuthorized) {
      return NextResponse.json({ success: false, message: 'Unauthorized. KYC documents are restricted.' }, { status: 401 });
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
