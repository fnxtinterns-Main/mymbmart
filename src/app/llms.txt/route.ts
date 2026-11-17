import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'llms.txt');
  let content = '';

  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    content = `# MegaBachatMart\n\nHyperlocal 20-minute grocery delivery and community SHG marketplace.\nVisit: https://mymbmart.com`;
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
