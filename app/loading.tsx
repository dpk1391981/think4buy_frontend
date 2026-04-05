/**
 * Root-level App Router loading state.
 * Next.js streams this immediately on any top-level page navigation
 * while the server component fetches data — prevents blank-screen flash.
 */
import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9990] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
      {/* Brand mark */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-primary-600 animate-spin" />
          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded bg-primary-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 animate-pulse">Think4BuySale</p>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 justify-center">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading…
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full"
            style={{ animation: 'root-progress 1.4s ease-in-out infinite' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes root-progress {
          0%   { width: 0%;  margin-left: 0; }
          50%  { width: 65%; margin-left: 17%; }
          100% { width: 0%;  margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
