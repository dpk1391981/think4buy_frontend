/**
 * useDebouncedSearch — combines input debouncing with React Query for
 * search-as-you-type functionality (search suggestions, autocomplete).
 *
 * Features:
 *  • Debounce — only fires API call after user stops typing (default 350ms)
 *  • AbortController — cancels in-flight request when query changes
 *  • Minimum length guard — avoids hits on 0-1 char queries
 *  • Ready for high-traffic search: deduplicated by React Query
 *
 * Usage:
 *   const { results, isLoading, query, setQuery } = useDebouncedSearch({
 *     fetcher: (q, signal) => searchApi.getSuggestions(q, signal),
 *     minLength: 2,
 *   });
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';

interface Options<T> {
  /** Async function that performs the search. Receives current signal for cancellation. */
  fetcher: (query: string, signal: AbortSignal) => Promise<T>;
  /** Minimum query length before firing (default: 2) */
  minLength?: number;
  /** Debounce delay in ms (default: 350) */
  delay?: number;
  /** Cache key prefix — combined with the debounced query */
  cacheKey?: string;
  /** How long to keep results fresh (default: 30s — search results change often) */
  staleTime?: number;
}

export function useDebouncedSearch<T>({
  fetcher,
  minLength = 2,
  delay = 350,
  cacheKey = 'search',
  staleTime = 30 * 1000,
}: Options<T>) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, delay);
  const isReady = debouncedQuery.length >= minLength;

  const { data, isLoading, isFetching } = useQuery<T>({
    queryKey: [cacheKey, debouncedQuery],
    queryFn: ({ signal }) => fetcher(debouncedQuery, signal),
    enabled: isReady,
    staleTime,
    // Suggestions are cheap — no retry needed
    retry: false,
    // Keep previous results while new ones load (prevents flash of empty)
    placeholderData: (prev) => prev,
  });

  return {
    query,
    setQuery,
    results: data,
    isLoading: isReady && (isLoading || isFetching),
    /** True when there is a live debounce in progress before the first request */
    isDebouncing: query.length >= minLength && debouncedQuery !== query,
  };
}

export default useDebouncedSearch;
