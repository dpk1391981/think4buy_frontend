'use client';

import { useState, useEffect } from 'react';
import { propertyConfigApi } from '@/lib/api';

export interface PropCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  status: boolean;
  sortOrder: number;
}

export interface PropTypeOption {
  id: string;
  name: string;
  slug: string;
  icon: string;
  status: boolean;
  sortOrder: number;
  categoryId: string;
}

// Module-level cache so repeated mounts don't re-fetch
let categoriesCache: PropCategory[] | null = null;
const typesCache: Record<string, PropTypeOption[]> = {};

export function usePropertyCategories() {
  const [categories, setCategories] = useState<PropCategory[]>(categoriesCache ?? []);
  const [loading, setLoading] = useState(!categoriesCache);

  useEffect(() => {
    if (categoriesCache) { setCategories(categoriesCache); setLoading(false); return; }
    setLoading(true);
    propertyConfigApi.getCategories()
      .then(({ data }) => {
        categoriesCache = data ?? [];
        setCategories(categoriesCache!);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}

export function usePropertyTypes(categorySlug: string) {
  const [types, setTypes] = useState<PropTypeOption[]>(typesCache[categorySlug] ?? []);
  const [loading, setLoading] = useState(!typesCache[categorySlug] && !!categorySlug);

  useEffect(() => {
    if (!categorySlug) { setTypes([]); setLoading(false); return; }
    if (typesCache[categorySlug]) { setTypes(typesCache[categorySlug]); setLoading(false); return; }
    setLoading(true);
    propertyConfigApi.getTypesBySlug(categorySlug)
      .then(({ data }) => {
        typesCache[categorySlug] = data ?? [];
        setTypes(typesCache[categorySlug]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categorySlug]);

  return { types, loading };
}

/** Maps a category slug to the canonical page URL */
export function getCategoryHref(slug: string): string {
  const routes: Record<string, string> = {
    buy:             '/buy',
    rent:            '/rent',
    pg:              '/pg',
    commercial:      '/commercial',
    builder_project: '/new-projects',
  };
  return routes[slug] ?? `/properties?category=${slug}`;
}
