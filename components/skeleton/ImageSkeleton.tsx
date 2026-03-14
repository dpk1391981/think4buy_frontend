/**
 * ImageSkeleton — placeholder shown while an image is loading.
 *
 * ProgressiveImage — wraps OptimizedImage with a shimmer that fades out
 * once the image loads. Prevents CLS (no layout shift) and avoids
 * the white-flash that occurs without a blur placeholder.
 *
 * Two strategies for zero-flash loading:
 *  1. next/image `blurDataURL` — gray placeholder baked into the <img> before
 *     the network request starts (eliminates flash on fast CDN hits).
 *  2. ProgressiveImage shimmer overlay — for cases where the parent needs
 *     a visible shimmer animation (e.g. skeletons matching card layout).
 *
 * Use strategy 1 (default OptimizedImage) for most images.
 * Use strategy 2 (ProgressiveImage) only where you want the sweep animation.
 */
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import Shimmer from './Shimmer';
import OptimizedImage from '@/components/common/OptimizedImage';
import { IMAGE_SIZES } from '@/lib/imageUtils';

interface ImageSkeletonProps {
  className?: string;
  aspectClass?: string;
}

export default function ImageSkeleton({ className, aspectClass = 'aspect-[4/3]' }: ImageSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('relative overflow-hidden bg-gray-100', aspectClass, className)}
    >
      <Shimmer className="absolute inset-0 w-full h-full rounded-none" />
      {/* Camera icon hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          className="w-8 h-8 text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      </div>
    </div>
  );
}

interface ProgressiveImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  aspectClass?: string;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain';
}

/**
 * ProgressiveImage — shows a shimmer until the image loads, then cross-fades.
 *
 * Best used for property card images and hero images where you want the
 * shimmer animation to be visible before the image arrives.
 *
 * For above-the-fold (LCP) images: set priority=true — the blur placeholder
 * in OptimizedImage is sufficient, no need for ProgressiveImage.
 */
export function ProgressiveImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes = IMAGE_SIZES.propertyCard,
  priority = false,
  aspectClass = 'aspect-[4/3]',
  style,
  objectFit = 'cover',
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', aspectClass)}>
      {/* Shimmer layer — fades out once image is ready */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          loaded ? 'opacity-0 pointer-events-none' : 'opacity-100',
        )}
      >
        <Shimmer className="absolute inset-0 w-full h-full rounded-none" />
      </div>

      {/* Actual image — fades in from opacity-0 */}
      <OptimizedImage
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        sizes={sizes}
        priority={priority}
        style={style}
        objectFit={objectFit}
        onLoad={() => setLoaded(true)}
        // Disable double-blur: the shimmer layer already covers the pre-load state
        blurDataURL={false}
      />
    </div>
  );
}
