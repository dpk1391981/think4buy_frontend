'use client';

import { useState, useEffect, useCallback } from 'react';

const KEY = 'pf_wishlist';

export function useWishlist() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
      setIds(new Set(stored));
    } catch {}
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const isSaved = (id: string) => ids.has(id);
  const getIds = () => Array.from(ids);

  return { isSaved, toggle, getIds };
}
