import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const robotsTxt = `# MegaBachatMart Robots Policy & Agent Directives
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Content Signals (Search Allowed, AI Model Training Prohibited without license)
Content-Signal: search=yes, ai-train=no

# Permitted LLM Crawlers for Real-time Retrieval & Fact-checking
User-agent: GPTBot
Allow: /
Allow: /shop
Allow: /savings
Allow: /refer
Allow: /producer
Allow: /partners

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot
Allow: /

# Canonical Discovery
Sitemap: https://mymbmart.com/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
