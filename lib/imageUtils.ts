/**
 * imageUtils — utilities for image optimisation in Next.js.
 *
 * At 1M+ users, every byte saved on images matters.
 * These helpers cover:
 *  1. Base64 blur placeholder generation (prevents CLS, improves LCP perception)
 *  2. Responsive sizes strings for common layouts
 *  3. CDN URL builder for ImageKit / Cloudinary
 */

// ─── Blur Placeholder ────────────────────────────────────────────────────────

/**
 * Returns a tiny 10×7 light-gray SVG as a base64 data URI.
 * Use as `blurDataURL` in Next.js <Image> to prevent white flash while loading.
 *
 * Performance: this is inline — zero HTTP requests, zero layout shift.
 */
export const BLUR_DATA_URL =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 7"><rect width="10" height="7" fill="#f3f4f6"/></svg>',
  ).toString('base64');

/**
 * Generates a shimmer SVG blur placeholder (subtle wave effect while loading).
 * Heavier than BLUR_DATA_URL but visually matches the shimmer skeleton style.
 */
export function getShimmerBlurDataUrl(w = 700, h = 475): string {
  const shimmer = `
  <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#f0f0f0"/>
        <stop offset="50%"  stop-color="#e8e8e8"/>
        <stop offset="100%" stop-color="#f0f0f0"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(shimmer).toString('base64')}`;
}

// ─── Responsive sizes strings ────────────────────────────────────────────────

/**
 * Pre-computed `sizes` strings for common layouts.
 * Pass these to <Image sizes=…> to help the browser pick the right srcset entry.
 *
 * Reduces wasted bytes — e.g. a 1920px image would never load for a 72vw mobile card.
 */
export const IMAGE_SIZES = {
  /** Property card in grid (4-col desktop, 2-col tablet, 1-col mobile) */
  propertyCard: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',

  /** Property card in list view */
  propertyListCard: '(max-width: 640px) 100vw, 224px',

  /** Mobile-only carousel item (72vw) */
  carouselMobile: '(max-width: 640px) 72vw, 280px',

  /** Property detail hero image */
  propertyHero: '(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 800px',

  /** Agent avatar in card */
  agentAvatar: '48px',

  /** Agent avatar in detail page */
  agentAvatarLarge: '(max-width: 640px) 80px, 120px',

  /** City card in CityExplorer */
  cityCard: '(max-width: 640px) 40vw, 160px',

  /** Full-width banner */
  banner: '100vw',
} as const;

// ─── CDN URL builders ────────────────────────────────────────────────────────

const IMAGEKIT_BASE = process.env.NEXT_PUBLIC_IMAGEKIT_URL || '';
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || '';

interface ImageKitTransform {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
}

/**
 * Builds an ImageKit CDN URL with transformation parameters.
 * Falls back to the original URL if IMAGEKIT_URL is not configured.
 */
export function imageKitUrl(src: string, transforms: ImageKitTransform = {}): string {
  if (!IMAGEKIT_BASE || !src) return src;
  const { width, height, quality = 80, format = 'auto', crop = 'maintain_ratio' } = transforms;
  const params: string[] = [`f-${format}`, `q-${quality}`];
  if (width)  params.push(`w-${width}`);
  if (height) params.push(`h-${height}`);
  if (crop)   params.push(`c-${crop}`);
  const transformation = `tr:${params.join(',')}`;
  // Resolve relative paths
  const path = src.startsWith('/') ? src : `/${src}`;
  return `${IMAGEKIT_BASE}/${transformation}${path}`;
}

/**
 * Builds a Cloudinary URL with transformation parameters.
 * Falls back to the original URL if CLOUDINARY_CLOUD is not configured.
 */
export function cloudinaryUrl(publicId: string, transforms: ImageKitTransform = {}): string {
  if (!CLOUDINARY_CLOUD || !publicId) return publicId;
  const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = transforms;
  const parts: string[] = [`q_${quality}`, `f_${format}`];
  if (width)  parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (crop)   parts.push(`c_${crop}`);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${parts.join(',')}/${publicId}`;
}
