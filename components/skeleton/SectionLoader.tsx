/**
 * SectionLoader — lightweight inline loader for individual sections.
 * Prefer skeleton variants over this; use SectionLoader when skeleton
 * shape isn't known in advance (e.g. dynamic content blocks).
 */
import { cn } from '@/lib/utils';
import Shimmer from './Shimmer';

interface Props {
  /** Section heading placeholder */
  title?: boolean;
  /** Number of shimmer content lines */
  lines?: number;
  className?: string;
  /** Minimum height so the section doesn't collapse during load */
  minHeight?: string;
}

export default function SectionLoader({
  title = true,
  lines = 3,
  className,
  minHeight = 'min-h-[120px]',
}: Props) {
  return (
    <section
      aria-busy="true"
      aria-label="Loading section"
      className={cn('space-y-4 py-4', minHeight, className)}
    >
      {title && (
        <div className="space-y-2">
          <Shimmer className="h-6 w-40" />
          <Shimmer className="h-3 w-56" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer
            key={i}
            className={cn(
              'h-4',
              i % 3 === 0 && 'w-full',
              i % 3 === 1 && 'w-5/6',
              i % 3 === 2 && 'w-3/4',
            )}
          />
        ))}
      </div>
    </section>
  );
}

/** Inline dot-pulse loader — for small inline states (button loading, etc.) */
export function InlineLoader({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('inline-flex items-center gap-1', className)}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
