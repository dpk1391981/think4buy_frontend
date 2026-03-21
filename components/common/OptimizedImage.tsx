'use client';

import Image from 'next/image';
import { useState } from 'react';
import { BLUR_DATA_URL } from '@/lib/imageUtils';

// Resolves backend /uploads/ paths to full URLs
const BACKEND_URL =
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1').replace(/\/api\/v1\/?$/, '');

export function resolveImageSrc(src?: string | null): string {
  if (!src) return '/placeholder-property.svg';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/uploads') || src.startsWith('uploads')) {
    return `${BACKEND_URL}${src.startsWith('/') ? src : `/${src}`}`;
  }
  return src;
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
 * Features:
 *  • Resolves backend /uploads/ relative paths to full URLs
 *  • Lazy loads by default — only priority=true images block rendering
 *  • Gray blur placeholder out of the box — prevents CLS and white flash
 *  • Falls back to /placeholder-property.svg on 404/error
 *  • WebP/AVIF delivery via Next.js Image (configured in next.config.js)
 *  • Responsive srcset via `sizes` prop
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

  // Determine blur placeholder
  // • undefined → use our default gray SVG blur
  // • false     → no blur (e.g. logos)
  // • string    → caller-supplied custom blur
  const blurProps =
    blurDataURL === false
      ? {}
      : {
          placeholder: 'blur' as const,
          blurDataURL: (typeof blurDataURL === 'string' ? blurDataURL : BLUR_DATA_URL),
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
