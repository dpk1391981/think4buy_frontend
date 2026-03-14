/**
 * Shimmer — atomic shimmer block.
 * Use className to set width/height/rounded/etc.
 *
 * <Shimmer className="h-4 w-3/4" />
 */
import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
  /** 'light' (default) = gray sweep. 'dark' = white-over-dark sweep. */
  variant?: 'light' | 'dark';
  /** Round fully into a circle (avatar etc.) */
  circle?: boolean;
}

export default function Shimmer({ className, variant = 'light', circle }: ShimmerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        variant === 'dark' ? 'skeleton-shimmer-dark' : 'skeleton-shimmer',
        circle && 'rounded-full',
        className,
      )}
    />
  );
}
