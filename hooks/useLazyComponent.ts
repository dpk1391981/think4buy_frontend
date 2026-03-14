/**
 * useLazyComponent — defers a component's rendering until it enters the viewport.
 *
 * Unlike next/dynamic (which splits the bundle), this hook controls WHEN
 * the already-split component mounts. Use for below-the-fold sections that
 * are expensive to render but don't need a separate JS chunk
 * (e.g. mortgage calculator, map widget, agent contact form).
 *
 * Usage:
 *   const [containerRef, shouldRender] = useLazyComponent();
 *   return (
 *     <div ref={containerRef}>
 *       {shouldRender ? <HeavyComponent /> : <Placeholder />}
 *     </div>
 *   );
 */

import { useState, useEffect, useRef } from 'react';

interface Options {
  /** Expand trigger zone below viewport. Default '400px' */
  rootMargin?: string;
  /** Once visible, never unmount (default: true — good for most cases) */
  keepMounted?: boolean;
}

export function useLazyComponent<T extends HTMLElement = HTMLDivElement>({
  rootMargin = '400px',
  keepMounted = true,
}: Options = {}): [React.RefObject<T>, boolean] {
  const ref              = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // SSR guard
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (keepMounted) observer.disconnect(); // no need to keep observing
        } else if (!keepMounted) {
          setVisible(false);
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, keepMounted]);

  return [ref, visible];
}

export default useLazyComponent;
