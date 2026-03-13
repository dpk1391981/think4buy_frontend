'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/properties' },
  { icon: Plus, label: 'Post', href: '/post-property', isPrimary: true },
  { icon: Heart, label: 'Saved', href: '/dashboard/saved' },
  { icon: User, label: 'Account', href: '/profile' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ icon: Icon, label, href, isPrimary }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

          if (isPrimary) {
            // Post Property: intercept for guests on mobile
            if (!user) {
              return (
                <button
                  key={label}
                  onClick={() => dispatch(openAuthModal({ mode: 'login', reason: 'post-property', redirectTo: '/post-property' }))}
                  className="flex flex-col items-center justify-center -mt-6 relative"
                >
                  <div className="relative">
                    <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-600/40 border-4 border-white">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="badge-free absolute -top-1 -right-1 text-[9px] px-1.5 py-0.5 rounded-full leading-none">FREE</span>
                  </div>
                  <span className="text-[10px] text-primary-600 font-semibold mt-0.5">{label}</span>
                </button>
              );
            }
            return (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center justify-center -mt-6 relative"
              >
                <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-600/40 border-4 border-white">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-primary-600 font-semibold mt-0.5">{label}</span>
              </Link>
            );
          }

          // Account item: open auth modal if not logged in
          if (label === 'Account') {
            const accountHref = user
              ? (user.role === 'admin' ? '/admin' : user.role === 'buyer' ? '/dashboard' : '/agent')
              : null;

            if (!user) {
              return (
                <button
                  key={label}
                  onClick={() => dispatch(openAuthModal('login'))}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-colors text-gray-400"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              );
            }

            return (
              <Link
                key={label}
                href={accountHref || href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-colors relative',
                  isActive ? 'text-primary-600' : 'text-gray-400'
                )}
              >
                <div className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full',
                  isActive && 'bg-primary-50'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn('text-[10px] font-medium', isActive ? 'text-primary-600 font-semibold' : 'text-gray-400')}>
                  {label}
                </span>
                {isActive && <span className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary-600 rounded-full" />}
              </Link>
            );
          }

          // Saved/Wishlist: intercept for guests
          if (label === 'Saved' && !user) {
            return (
              <button
                key={label}
                onClick={() => dispatch(openAuthModal({ mode: 'login', reason: 'wishlist', redirectTo: '/wishlist' }))}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-colors text-gray-400"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-colors relative',
                isActive ? 'text-primary-600' : 'text-gray-400'
              )}
            >
              <div className={cn(
                'w-6 h-6 flex items-center justify-center rounded-full',
                isActive && 'bg-primary-50'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn('text-[10px] font-medium', isActive ? 'text-primary-600 font-semibold' : 'text-gray-400')}>
                {label}
              </span>
              {isActive && <span className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary-600 rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
