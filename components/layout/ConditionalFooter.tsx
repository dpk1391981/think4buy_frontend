'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (
    pathname.startsWith('/admin') ||
    pathname === '/agent' || pathname.startsWith('/agent/') ||
    // The whole /auth tree — sign-in, onboarding — renders its own full-screen
    // layout with its own logo and its own way back home. Letting the global
    // chrome through stacks a second header on top of it, and on a phone the
    // bottom nav sits over the form.
    pathname === '/auth' || pathname.startsWith('/auth/')
  ) return null;
  return <Footer />;
}
