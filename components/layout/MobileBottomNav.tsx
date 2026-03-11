'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/properties' },
  { icon: Plus, label: 'Post', href: '/post-property', isPrimary: true },
  { icon: Heart, label: 'Saved', href: '/wishlist' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ icon: Icon, label, href, isPrimary }) => {
          const isActive = pathname === href;
          if (isPrimary) {
            return (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-primary-600 font-medium mt-0.5">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                isActive ? 'text-primary-600' : 'text-gray-500',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
