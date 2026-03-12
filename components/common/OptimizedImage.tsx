'use client';

import Image from 'next/image';
import { useState } from 'react';

// Resolves backend /uploads/ paths to full URLs
const BACKEND_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1').replace(/\/api\/v1\/?$/, '');

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
  /** Only set true for above-the-fold hero images */
  priority?: boolean;
  style?: React.CSSProperties;
}

/**
 * Drop-in replacement for <img> and next/image.
 * - Resolves /uploads/ paths to full backend URL
 * - Lazy loads by default (priority=false)
 * - Falls back to placeholder on error
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
}: Props) {
  const [errored, setErrored] = useState(false);
  const resolved = errored ? '/placeholder-property.svg' : resolveImageSrc(src);

  const sharedProps = {
    alt,
    className,
    sizes,
    priority,
    loading: priority ? undefined : ('lazy' as const),
    onError: () => setErrored(true),
    style,
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
