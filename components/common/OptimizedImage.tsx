'use client';

import Image from 'next/image';
import { useState } from 'react';
import { BLUR_DATA_URL } from '@/lib/imageUtils';

// Backend origin (no /api/v1 suffix) — images served from /uploads/ live here
const BACKEND_URL =
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1')
    .replace(/\/api\/v1\/?$/, '');

/**
 * Resolve any image src to an absolute URL.
 * - Already-absolute URLs (http/https) are returned unchanged — this covers
 *   S3 URLs (https://bucket.s3.region.amazonaws.com/…) and CDN URLs.
 * - Relative /uploads/ paths are prefixed with the backend origin.
 * - Everything else is returned as-is (data URIs, blob:// previews, etc.).
 */
export function resolveImageSrc(src?: string | null): string {
  if (!src) return '/placeholder-property.svg';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/uploads') || src.startsWith('uploads')) {
    return `${BACKEND_URL}${src.startsWith('/') ? src : `/${src}`}`;
  }
  return src;
}

/**
 * Returns true when the resolved URL is an external image (S3, CDN, or any
 * third-party host). External images are already optimised (WebP, correct
 * dimensions) so we skip the Next.js optimisation proxy and serve them
 * directly — avoids remotePatterns mismatches for custom CDN domains and
 * removes a redundant round-trip through the Next.js image API.
 *
 * Local /uploads/ images served from the same backend ARE proxied through
 * Next.js so they benefit from responsive srcset and caching.
 */
function isExternalUrl(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  // blob: and data: are never external
  if (url.startsWith('blob:') || url.startsWith('data:')) return false;
  try {
    const { hostname } = new URL(url);
    const backendHostname = new URL(BACKEND_URL).hostname;
    // Same host as the backend → treat as local (still route through Next.js optimizer)
    return hostname !== backendHostname;
  } catch {
    return false;
  }
}

interface Props {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  /**
   * Only set true for above-the-fold LCP images (hero, first card in list).
   * Disables lazy loading and includes the image in the critical resource hint.
   */
  priority?: boolean;
  style?: React.CSSProperties;
  /**
   * Called once the image has fully loaded — used by ProgressiveImage
   * to cross-fade from shimmer to real image.
   */
  onLoad?: () => void;
  /**
   * Override the default blur placeholder.
   * Pass `false` to disable blur (e.g. SVG icons, logos).
   */
  blurDataURL?: string | false;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

/**
 * OptimizedImage — production-grade image component for a high-traffic marketplace.
 *
 * Supports both storage modes transparently:
 *  • Local disk  — /uploads/ paths are resolved to the backend origin and
 *                  proxied through Next.js Image for responsive srcset + AVIF/WebP.
 *  • S3 / CDN    — absolute HTTPS URLs from external hosts skip the Next.js
 *                  proxy (unoptimized=true) and are served directly. The images
 *                  are already WebP/compressed by the backend upload pipeline, so
 *                  re-optimising them adds no value and avoids remotePatterns gaps.
 *
 * Other features:
 *  • Falls back to /placeholder-property.svg on 404 / network error
 *  • Gray blur placeholder prevents CLS and white flash
 *  • Lazy loads by default (priority=true for above-the-fold LCP images)
 */
export default function OptimizedImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority = false,
  style,
  onLoad,
  blurDataURL,
  objectFit = 'cover',
}: Props) {
  const [errored, setErrored] = useState(false);
  const resolved = errored ? '/placeholder-property.svg' : resolveImageSrc(src);

  // External URLs (S3, CDN) skip the Next.js image optimiser — they're already
  // WebP and don't need re-encoding. This also prevents remotePatterns errors
  // when a custom CDN host isn't explicitly listed in next.config.js.
  const external = isExternalUrl(resolved);

  // Blur placeholder:
  //  • false  → disabled (logos, icons)
  //  • string → caller override
  //  • else   → default gray SVG
  //  • external images with no explicit blur → disable blur to avoid
  //    base64-blurring an already-fast CDN image (adds no UX value)
  const blurProps: Record<string, any> =
    blurDataURL === false || external
      ? {}
      : {
          placeholder: 'blur' as const,
          blurDataURL: typeof blurDataURL === 'string' ? blurDataURL : BLUR_DATA_URL,
        };

  const sharedProps = {
    alt,
    className,
    sizes,
    priority,
    loading: priority ? undefined : ('lazy' as const),
    onError: () => setErrored(true),
    onLoad,
    style: { objectFit, ...style },
    unoptimized: external,
    ...blurProps,
  };

  if (fill) {
    return <Image src={resolved} fill {...sharedProps} />;
  }

  return (
    <Image
      src={resolved}
      width={width ?? 400}
      height={height ?? 300}
      {...sharedProps}
    />
  );
}
