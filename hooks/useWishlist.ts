'use client';

// Thin re-export so existing imports (`useWishlist from '@/hooks/useWishlist'`) keep working.
// The actual state lives in WishlistContext — ONE fetch for the whole app.
export { useWishlistContext as useWishlist } from '@/contexts/WishlistContext';
