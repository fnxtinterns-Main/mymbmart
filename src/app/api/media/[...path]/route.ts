import { NextResponse } from 'next/server';
import path from 'path';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolved = await context.params;
    const segments = resolved?.path || [];
    const requested = segments[segments.length - 1];
    if (!requested) {
      return NextResponse.json({ success: false, message: 'Filename is required.' }, { status: 400 });
    }

    const safeFilename = path.basename(requested);
    const record = await prisma.storedFile.findUnique({
      where: { filename: safeFilename },
    });

    // Never expose private KYC files through the public media endpoint
    if (!record || (record.category !== 'site' && record.category !== 'product')) {
      return NextResponse.json({ success: false, message: 'Media not found.' }, { status: 404 });
    }

    return new NextResponse(Buffer.from(record.data), {
      headers: {
        'Content-Type': record.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to load media.' }, { status: 500 });
  }
}
