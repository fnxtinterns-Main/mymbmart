/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false; // Prevents Windows PackFileCacheStrategy ENOENT / rename crashes
    }
    return config;
  },
};

export default nextConfig;
