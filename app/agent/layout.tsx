'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OptimizedImage from '@/components/common/OptimizedImage';

const navItems = [
  { href: '/agent', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/agent/listings', label: 'My Listings', icon: '🏠' },
  { href: '/agent/inquiries', label: 'Inquiries', icon: '💬' },
  { href: '/agent/wallet', label: 'Wallet', icon: '💰' },
  { href: '/agent/subscription', label: 'Subscription', icon: '⭐' },
  { href: '/agent/analytics', label: 'Analytics', icon: '📈' },
  { href: '/agent/profile', label: 'Profile', icon: '👤' },
];

const ALLOWED_ROLES = ['agent', 'seller', 'admin'];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.replace('/auth/login?redirect=/agent');
      } else if (!ALLOWED_ROLES.includes(user.role)) {
        router.replace('/');
      }
    }
  }, [user, loading, mounted, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AG';

  const Sidebar = () => (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <Link href="/" className="text-lg font-bold text-blue-600">Think4BuySale</Link>
          <div className="text-xs text-gray-500 mt-0.5">Agent Panel</div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
          {user.avatar ? (
            <OptimizedImage src={user.avatar} alt={user.name} fill className="object-cover" sizes="36px" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
          <div className="text-xs text-gray-500 capitalize">{user.role}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        <Link
          href="/post-property"
          className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Post Property
        </Link>
        <Link
          href="/"
          className="block text-xs text-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile slide-in sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {/* Desktop layout */}
      <div className="flex min-h-screen">
        {/* Desktop fixed sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0">
          <div className="fixed inset-y-0 w-64 shadow-sm">
            <Sidebar />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-0 flex flex-col min-h-screen">
          {/* Mobile top bar */}
          <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between shadow-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="text-base font-bold text-blue-600">Think4BuySale</Link>
            <Link href="/post-property" className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium">
              + Post
            </Link>
          </div>

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
