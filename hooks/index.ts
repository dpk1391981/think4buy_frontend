/**
 * Hooks barrel export.
 * Import from '@/hooks' for clean single-line imports.
 *
 * Usage:
 *   import { useDebounce, useApiLoader, useInfiniteScroll } from '@/hooks';
 */

export { useDebounce }           from './useDebounce';
export { useApiLoader }          from './useApiLoader';
export { useInfiniteScroll }     from './useInfiniteScroll';
export { useDebouncedSearch }    from './useDebouncedSearch';
export { usePaginatedFetch, useInfiniteFetch } from './usePaginatedFetch';
export { useLazyComponent }      from './useLazyComponent';
export { useWishlist }           from './useWishlist';
export { useAnalytics }          from './useAnalytics';
export { useLeadCapture, useBehavioralLeadCapture } from './useLeadCapture';
