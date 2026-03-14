'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin') || pathname === '/agent' || pathname.startsWith('/agent/')) return null;
  return <Footer />;
}
