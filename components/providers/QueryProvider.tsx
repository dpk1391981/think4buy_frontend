'use client';

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Production-tuned React Query client for a high-traffic marketplace.
 *
 * Design decisions for 1M+ users / 20k concurrent:
 *  • staleTime 2 min   — listing pages stay fresh without hammering the API
 *  • gcTime 10 min     — keeps cached pages alive through browser navigation
 *  • retry smart logic — no retry on 4xx (client error), max 2 on network/5xx
 *  • refetchOnWindowFocus false — avoids thundering-herd when many tabs open
 *  • deduplication     — React Query deduplicates in-flight identical requests
 *    automatically (no extra config needed)
 */
function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error: any, query) => {
        // Suppress 404s — they're handled per-component via isError
        if (error?.response?.status === 404) return;
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Query error]', query.queryKey, error?.message);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Mutation error]', error?.message);
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Data freshness: 2 min is a good balance for property listings
        staleTime: 2 * 60 * 1000,
        // Garbage-collect unused cache after 10 min (keeps back-nav fast)
        gcTime: 10 * 60 * 1000,
        // Don't retry 4xx — those are definitive client errors
        retry: (failureCount, error: any) => {
          if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
          return failureCount < 2;
        },
        // Prevents thundering herd when user alt-tabs and returns
        refetchOnWindowFocus: false,
        // Reconnect refetch is useful for mobile users coming back online
        refetchOnReconnect: true,
      },
    },
  });
}

// Singleton for server render — one client per server request (Next.js RSC safe)
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always a new client so requests don't bleed between users
    return makeQueryClient();
  }
  // Browser: reuse the singleton across hot-reloads / navigations
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures the client is only created once per component mount
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
