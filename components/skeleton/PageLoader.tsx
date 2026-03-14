/**
 * PageLoader — full-page loading overlay.
 * Use sparingly: only for initial page hydration or heavy navigations.
 * Does NOT block meaningful content from rendering (SEO-safe).
 */
import { cn } from '@/lib/utils';

interface Props {
  /** Overlay the entire viewport */
  overlay?: boolean;
  className?: string;
  label?: string;
}

export default function PageLoader({ overlay, className, label = 'Loading...' }: Props) {
  if (overlay) {
    return (
      <div
        role="status"
        aria-label={label}
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm',
          className,
        )}
      >
        <LogoSpinner />
        <p className="mt-4 text-sm text-gray-500 animate-pulse">{label}</p>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex flex-col items-center justify-center min-h-[60vh] gap-4', className)}
    >
      <LogoSpinner />
      <p className="text-sm text-gray-500 animate-pulse">{label}</p>
    </div>
  );
}

function LogoSpinner() {
  return (
    <div className="relative">
      {/* Outer ring */}
      <div className="w-14 h-14 rounded-full border-4 border-gray-100 border-t-primary-600 animate-spin" />
      {/* Inner logo placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 rounded bg-primary-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
