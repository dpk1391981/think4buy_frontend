'use client';

import Link from 'next/link';
import { usePropertyCategories, getCategoryHref } from '@/hooks/usePropertyCategories';

// Gradient palette — cycles for any number of categories, no hardcoded slugs
const GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-orange-500 to-orange-700',
  'from-purple-500 to-purple-700',
  'from-pink-500 to-rose-600',
  'from-teal-500 to-teal-700',
  'from-indigo-500 to-indigo-700',
  'from-amber-500 to-amber-700',
  'from-cyan-500 to-cyan-700',
  'from-rose-500 to-rose-700',
];

export default function CategoryGrid() {
  const { categories, loading } = usePropertyCategories();

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-24 sm:h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
      {categories.map((cat, i) => (
        <Link
          key={cat.id}
          href={getCategoryHref(cat.slug)}
          className="group relative overflow-hidden rounded-2xl p-2.5 sm:p-5 flex flex-col items-center text-center transition-all duration-300 active:scale-95 bg-white border border-gray-100 hover:border-primary-100 hover:shadow-card-hover"
        >
          <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} rounded-xl flex items-center justify-center mb-1.5 sm:mb-3 text-lg sm:text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
            {cat.icon || '🏠'}
          </div>
          <span className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">{cat.name}</span>
          {cat.description && (
            <span className="text-xs text-gray-500 hidden sm:block mt-1 leading-tight line-clamp-2">{cat.description}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
