'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchFooterLinks } from '@/lib/store/slices/seoSlice';

// Only render links whose URL is a real path (no 'undefined'/'null' segments)
function isValidUrl(url: string | undefined | null): url is string {
  if (!url || url.trim() === '') return false;
  if (url.includes('undefined') || url.includes('null')) return false;
  return true;
}

export default function FooterSeoLinks() {
  const dispatch = useAppDispatch();

  const dbGroups    = useAppSelector((s) => s.seo.footerGroups);
  const footerLoaded = useAppSelector((s) => s.seo.footerLoaded);

  useEffect(() => {
    if (!footerLoaded) dispatch(fetchFooterLinks() as any);
  }, [dispatch, footerLoaded]);

  if (dbGroups.length === 0) return null;

  return (
    <div className="border-b border-gray-800">
      <div className="container-max py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {dbGroups.map(group => {
            const validLinks = group.links.filter(link => isValidUrl(link.url));
            if (validLinks.length === 0) return null;
            return (
              <nav key={group.id} aria-label={group.title}>
                <h3 className="text-white font-semibold text-sm mb-3 pb-2 border-b border-gray-700">
                  {group.title}
                </h3>
                <ul className="space-y-1.5">
                  {validLinks.map(link => (
                    <li key={link.id}>
                      <Link
                        href={link.url}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-400 transition-colors group"
                        title={link.label}
                      >
                        <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-primary-400 flex-shrink-0" />
                        <span className="group-hover:underline underline-offset-2">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>
      </div>
    </div>
  );
}
