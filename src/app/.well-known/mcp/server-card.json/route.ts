import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', '.well-known', 'mcp', 'server-card.json');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        name: 'megabachatmart-mcp-server',
        version: '1.0.0',
        endpoint: 'https://mymbmart.com/api/v1/openapi.json',
      },
      { status: 200 }
    );
  }
}
