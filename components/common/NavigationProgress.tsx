'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Thin top-of-page progress bar that appears on every client-side navigation.
 *
 * Strategy:
 *  - Listen for clicks on <a> tags and `router.push`-style buttons with [data-nav].
 *  - Show bar immediately on click, animate it to ~80 % while waiting.
 *  - When pathname changes (page loaded), animate to 100 % then fade out.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth]     = useState(0);
  const [done, setDone]       = useState(false);
  const timerRef  = useRef<NodeJS.Timeout>();
  const prevPath  = useRef(pathname);

  // ── Start bar ─────────────────────────────────────────────────────────────
  const start = () => {
    clearTimeout(timerRef.current);
    setDone(false);
    setVisible(true);
    setWidth(0);
    // Tick to 30 % immediately, then slowly creep to 80 %
    requestAnimationFrame(() => {
      setWidth(30);
      timerRef.current = setTimeout(() => setWidth(65), 400);
      timerRef.current = setTimeout(() => setWidth(80), 1200);
    });
  };

  // ── Finish bar ────────────────────────────────────────────────────────────
  const finish = () => {
    clearTimeout(timerRef.current);
    setWidth(100);
    setDone(true);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
      setDone(false);
    }, 350);
  };

  // Detect route change (path loaded) → finish bar
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      finish();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Detect clicks on same-origin anchor tags → start bar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a');
      if (!a) return;
      if (a.target === '_blank' || a.getAttribute('download')) return;
      try {
        const href = a.getAttribute('href') || '';
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        // Only same-origin navigations
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.search === location.search) return;
        start();
      } catch { /* ignore malformed href */ }
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  // Listen for programmatic navigation (router.push without anchor click)
  useEffect(() => {
    const onNavStart = () => start();
    window.addEventListener('t4bs:navstart', onNavStart);
    return () => window.removeEventListener('t4bs:navstart', onNavStart);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[9998] h-[3px] pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-primary-400 via-blue-400 to-primary-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
        style={{
          width: `${width}%`,
          transition: done
            ? 'width 0.25s ease-out, opacity 0.25s ease-out'
            : 'width 0.4s ease-out',
          opacity: done && width === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
