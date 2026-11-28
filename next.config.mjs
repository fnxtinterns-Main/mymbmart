/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/images/:file*', destination: '/api/media/:file*' },
      { source: '/favicon.ico', destination: '/api/media/favicon.ico' },
      { source: '/apple-touch-icon.png', destination: '/api/media/apple-touch-icon.png' },
      { source: '/icon-32.png', destination: '/api/media/icon-32.png' },
      { source: '/icon-96.png', destination: '/api/media/icon-96.png' },
      { source: '/icon-192.png', destination: '/api/media/icon-192.png' },
      { source: '/icon-512.png', destination: '/api/media/icon-512.png' },
    ];
  },
  async headers() {
    return [
      {
        // Default for all HTML and page routes: revalidate so CDN never caches stale Next.js chunk hashes
        source: '/((?!_next/static|_next/image|favicon.ico|images).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Content-hashed static JS & CSS chunks: safe to cache permanently in production only
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value:
              process.env.NODE_ENV === 'production'
                ? 'public, max-age=31536000, immutable'
                : 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
  turbopack: {},
};

export default nextConfig;
