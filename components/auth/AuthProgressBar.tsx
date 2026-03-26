'use client';

import { useEffect, useRef, useState } from 'react';
import { authEvents } from '@/lib/authEvents';

/**
 * 2-px progress bar pinned to the top of the viewport.
 * Appears only during silent token refresh — never blocks the UI.
 *
 * Behaviour:
 *  - refresh-start → slide in from 0 → ~80 % (indeterminate stall)
 *  - refresh-end / auth-fail → jump to 100 % → fade out
 */
export default function AuthProgressBar() {
  const [pct,     setPct]     = useState(0);
  const [visible, setVisible] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout>  | null>(null);

  useEffect(() => {
    function clearTimers() {
      if (animRef.current) clearInterval(animRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    }

    const startBar = () => {
      clearTimers();
      setPct(10);
      setVisible(true);
      // Slowly creep toward 85 % — never reaches 100 until we know result
      animRef.current = setInterval(() => {
        setPct((p) => {
          if (p >= 84) return p;
          return p + Math.random() * 4;
        });
      }, 350);
    };

    const endBar = () => {
      clearTimers();
      setPct(100);
      hideRef.current = setTimeout(() => {
        setVisible(false);
        setPct(0);
      }, 350);
    };

    const unsubStart = authEvents.on('refresh-start', startBar);
    const unsubEnd   = authEvents.on('refresh-end',   endBar);
    const unsubFail  = authEvents.on('auth-fail',     endBar);

    return () => {
      unsubStart();
      unsubEnd();
      unsubFail();
      clearTimers();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[300] h-0.5 bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-primary-500 transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
