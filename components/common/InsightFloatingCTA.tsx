'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 't4bs_insight_cta_dismissed';

// Pages where this CTA shouldn't show
const HIDDEN_ON = ['/tools', '/admin', '/agent', '/owner', '/auth'];

export default function InsightFloatingCTA() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasDismissed = localStorage.getItem(STORAGE_KEY) === '1';
      setDismissed(wasDismissed);
    }
    // Delay appearance so it doesn't flash on first load
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  const shouldHide =
    dismissed ||
    !visible ||
    HIDDEN_ON.some((p) => pathname.startsWith(p));

  if (shouldHide) return null;

  return (
    <div
      className="
        lg:hidden
        fixed bottom-[76px] left-3 z-[45]
        flex items-center gap-2
        animate-in slide-in-from-left-4 fade-in duration-500
      "
    >
      <Link
        href="/tools"
        className="
          flex items-center gap-1.5 pl-3 pr-2 py-2
          bg-gradient-to-r from-violet-600 to-indigo-600
          text-white text-xs font-semibold
          rounded-full shadow-lg shadow-indigo-500/40
          active:scale-95 transition-transform
        "
      >
        {/* Pulsing ring */}
        <span className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-4 w-4 rounded-full bg-white/30 animate-ping" />
          <Sparkles className="relative w-3.5 h-3.5" />
        </span>
        AI&nbsp;Insights
        {/* Dismiss X */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="
            ml-0.5 w-4 h-4 flex items-center justify-center
            rounded-full bg-white/20 hover:bg-white/30 transition-colors
          "
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </Link>
    </div>
  );
}
