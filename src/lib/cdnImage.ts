// src/lib/cdnImage.ts
// CDN Image Optimization & Delivery Utility

export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  fit?: 'cover' | 'contain' | 'inside';
}

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, '') || '';

/**
 * Resolves an asset path to high-performance CDN edge with image resizing & compression.
 * Falls back to local asset path when CDN_URL is unset.
 */
export function getCdnImageUrl(
  imagePath: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string {
  if (!imagePath) return '/images/products/placeholder.png';

  // Already a full external URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    if (!CDN_BASE_URL) return imagePath;
    // Proxy through CDN if configured
    const cleanUrl = encodeURIComponent(imagePath);
    return `${CDN_BASE_URL}/cdn-cgi/image/width=${options.width || 'auto'},quality=${options.quality || 80},format=${options.format || 'auto'}/${cleanUrl}`;
  }

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  if (!CDN_BASE_URL) {
    return normalizedPath;
  }

  const { width = 400, quality = 80, format = 'webp', fit = 'cover' } = options;
  return `${CDN_BASE_URL}/cdn-cgi/image/width=${width},quality=${quality},format=${format},fit=${fit}${normalizedPath}`;
}
