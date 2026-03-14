/**
 * useApiLoader — production-ready React Query wrapper with:
 *  - AbortController-based request cancellation (stale tab / fast navigation)
 *  - Per-component loading state exposure
 *  - Configurable stale time and retry policy
 *
 * Usage:
 *   const { data, isLoading, isError } = useApiLoader(
 *     ['properties', filters],
 *     (signal) => propertiesApi.getAll(filters, signal),
 *   );
 */

import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';

type ApiLoaderOptions<T> = Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryKey' | 'queryFn'> & {
  /** Cache duration in ms (default: 2 min) */
  staleTime?: number;
  /** Disable automatic refetch on window focus (default: false for listings, true for dashboards) */
  refetchOnWindowFocus?: boolean;
};

export function useApiLoader<T>(
  queryKey: QueryKey,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options?: ApiLoaderOptions<T>,
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn: ({ signal }) => fetcher(signal),
    staleTime: options?.staleTime ?? 2 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx client errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    ...options,
  });
}

export default useApiLoader;
