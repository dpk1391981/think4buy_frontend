/**
 * useDebounce — delays a value update until `delay` ms have passed
 * since the last change. Ideal for search inputs triggering API calls.
 *
 * Usage:
 *   const debouncedQuery = useDebounce(searchQuery, 350);
 *   // use debouncedQuery as the query key so React Query only fires
 *   // after the user stops typing.
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
