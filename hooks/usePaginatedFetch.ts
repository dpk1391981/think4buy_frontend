/**
 * usePaginatedFetch — cursor / offset pagination with React Query.
 *
 * Supports both:
 *  • Traditional offset pagination (page 1, 2, 3…)
 *  • Infinite scroll with `useInfiniteQuery`
 *
 * Works with the existing propertiesApi pattern: returns { data, meta }.
 *
 * Usage — standard pagination:
 *   const { items, meta, page, setPage, isLoading } = usePaginatedFetch({
 *     queryKey: ['properties', filters],
 *     fetcher: (page) => propertiesApi.getAll({ ...filters, page, limit: 12 }),
 *   });
 *
 * Usage — infinite scroll (append items as user scrolls):
 *   const { pages, fetchNextPage, hasNextPage } = usePaginatedFetch({
 *     queryKey: ['properties', filters],
 *     fetcher: (page) => propertiesApi.getAll({ ...filters, page, limit: 12 }),
 *     infinite: true,
 *   });
 */

import { useState } from 'react';
import { useQuery, useInfiniteQuery, QueryKey } from '@tanstack/react-query';

interface PagedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface Options<T> {
  queryKey: QueryKey;
  fetcher: (page: number, signal: AbortSignal) => Promise<{ data: PagedResponse<T> }>;
  /** Items per page (default: 12) */
  limit?: number;
  /** Start on this page (default: 1) */
  initialPage?: number;
  staleTime?: number;
}

/** Standard page-by-page pagination */
export function usePaginatedFetch<T>({
  queryKey,
  fetcher,
  limit = 12,
  initialPage = 1,
  staleTime = 2 * 60 * 1000,
}: Options<T>) {
  const [page, setPage] = useState(initialPage);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [...(queryKey as any[]), page, limit],
    queryFn: ({ signal }) => fetcher(page, signal),
    staleTime,
    placeholderData: (prev) => prev,
  });

  const response = data?.data;

  return {
    items:      response?.data ?? [],
    meta:       response?.meta,
    page,
    setPage,
    isLoading,
    isFetching,
    isError,
    hasNextPage: response?.meta ? page < response.meta.totalPages : false,
    hasPrevPage: page > 1,
  };
}

interface InfiniteOptions<T> extends Omit<Options<T>, 'initialPage'> {}

/** Infinite scroll — accumulates all pages in `allItems` */
export function useInfiniteFetch<T>({
  queryKey,
  fetcher,
  limit = 12,
  staleTime = 2 * 60 * 1000,
}: InfiniteOptions<T>) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery({
      queryKey: [...(queryKey as any[]), limit],
      queryFn: ({ pageParam = 1, signal }) => fetcher(pageParam as number, signal),
      initialPageParam: 1,
      getNextPageParam: (lastPage: { data: PagedResponse<T> }) => {
        const meta = lastPage.data?.meta;
        if (!meta) return undefined;
        return meta.page < meta.totalPages ? meta.page + 1 : undefined;
      },
      staleTime,
    });

  const allItems = data?.pages.flatMap((p) => p.data?.data ?? []) ?? [];
  const lastMeta = data?.pages[data.pages.length - 1]?.data?.meta;

  return {
    allItems,
    meta: lastMeta,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  };
}

export default usePaginatedFetch;
