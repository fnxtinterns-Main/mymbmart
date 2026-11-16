import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot', 'ClaudeBot', 'Applebot'],
        allow: ['/', '/shop', '/savings', '/refer', '/producer'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://mymbmart.com/sitemap.xml',
  };
}
