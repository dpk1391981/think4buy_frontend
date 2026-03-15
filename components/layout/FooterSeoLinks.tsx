'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchFooterLinks } from '@/lib/store/slices/seoSlice';

function isValidUrl(url: string | undefined | null): url is string {
  if (!url || url.trim() === '') return false;
  if (url.includes('undefined') || url.includes('null')) return false;
  return true;
}

function SeoLinkGroup({ title, links }: { title: string; links: { id: string; label: string; url: string }[] }) {
  const valid = links.filter(l => isValidUrl(l.url));
  if (valid.length === 0) return null;
  return (
    <nav aria-label={title}>
      <h3 className="text-white font-semibold text-sm mb-3 pb-2 border-b border-gray-700">{title}</h3>
      <ul className="space-y-1.5">
        {valid.map(link => (
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
}

export default function FooterSeoLinks() {
  const dispatch = useAppDispatch();
  const dbGroups    = useAppSelector((s) => s.seo.footerGroups);
  const footerLoaded = useAppSelector((s) => s.seo.footerLoaded);

  useEffect(() => {
    if (!footerLoaded) dispatch(fetchFooterLinks() as any);
  }, [dispatch, footerLoaded]);

  const activeGroups = dbGroups.filter(g => (g as any).isActive !== false);
  if (activeGroups.length === 0) return null;

  // Split groups into rows of 4
  const rows: typeof activeGroups[] = [];
  for (let i = 0; i < activeGroups.length; i += 4) {
    rows.push(activeGroups.slice(i, i + 4));
  }

  return (
    <>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="border-b border-gray-800">
          <div className="container-max py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {row.map(group => {
                const validLinks = group.links
                  .filter((l: any) => l.isActive !== false && isValidUrl(l.url))
                  .map((l: any) => ({ id: l.id, label: l.label, url: l.url }));
                return (
                  <SeoLinkGroup key={group.id} title={group.title} links={validLinks} />
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
