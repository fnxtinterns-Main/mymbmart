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

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'kyc');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const safeDocType = docType.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
      const filename = `${safeDocType}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);
      const fileUrl = `/uploads/kyc/${filename}`;

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

          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'kyc');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const safeDocType = (docType || 'doc').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
          const filename = `${safeDocType}-${Date.now()}.${ext}`;
          const filePath = path.join(uploadDir, filename);

          fs.writeFileSync(filePath, buffer);
          finalUrl = `/uploads/kyc/${filename}`;
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
