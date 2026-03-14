/**
 * useInfiniteScroll — fires a callback when a sentinel element enters the viewport.
 *
 * Uses IntersectionObserver (zero polling, battery-friendly).
 * Works seamlessly with React Query's useInfiniteQuery.
 *
 * Usage:
 *   const sentinelRef = useInfiniteScroll(fetchNextPage, hasNextPage && !isFetchingNextPage);
 *   <div ref={sentinelRef} />
 */

import { useEffect, useRef, useCallback } from 'react';

interface Options {
  /** How much of the sentinel must be visible before triggering (0–1). Default 0.1 */
  threshold?: number;
  /** Expand detection zone below the viewport. Default '200px' */
  rootMargin?: string;
}

export function useInfiniteScroll(
  onIntersect: () => void,
  enabled = true,
  options: Options = {},
): React.RefObject<HTMLDivElement> {
  const sentinelRef  = useRef<HTMLDivElement>(null);
  const callbackRef  = useRef(onIntersect);

  // Always call the latest version of the callback
  useEffect(() => { callbackRef.current = onIntersect; }, [onIntersect]);

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) callbackRef.current();
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? '200px',
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, options.threshold, options.rootMargin]);

  return sentinelRef;
}

export default useInfiniteScroll;
