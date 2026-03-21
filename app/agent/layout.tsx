'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import OptimizedImage from '@/components/common/OptimizedImage';
import {
  LayoutDashboard, Target, MapPin, Handshake,
  BadgeDollarSign, Home, MessageSquare, Building2,
  Wallet, Crown, User, Plus,
  MoreHorizontal, X, ExternalLink, ChevronRight,
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import type { MenuItem } from '@/contexts/AuthContext';

// ─── Nav groups (desktop sidebar) ─────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: '/agent', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Sales Pipeline',
    items: [
      { href: '/agent/leads',       label: 'My Leads',    icon: Target },
      { href: '/agent/site-visits', label: 'Site Visits', icon: MapPin },
      { href: '/agent/deals',       label: 'Deals',       icon: Handshake },
      { href: '/agent/commissions', label: 'Commissions', icon: BadgeDollarSign },
    ],
  },
  {
    label: 'Listings',
    items: [
      { href: '/agent/listings',   label: 'My Listings', icon: Home },
      { href: '/agent/inquiries',  label: 'Inquiries',   icon: MessageSquare },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/agent/agency',       label: 'My Coverage',  icon: Building2 },
      { href: '/agent/wallet',       label: 'Wallet',        icon: Wallet },
      { href: '/agent/subscription', label: 'Subscription',  icon: Crown },
      { href: '/agent/profile',      label: 'Profile',       icon: User },
    ],
  },
];

// ─── Mobile bottom 4 primary tabs ─────────────────────────────────────────────

const BOTTOM_TABS = [
  { href: '/agent',          label: 'Home',     icon: LayoutDashboard, exact: true },
  { href: '/agent/leads',    label: 'Leads',    icon: Target },
  { href: '/agent/listings', label: 'Listings', icon: Home },
  { href: '/agent/deals',    label: 'Deals',    icon: Handshake },
];

// ─── Mobile "More" sheet items ─────────────────────────────────────────────────

const MORE_ITEMS = [
  { href: '/agent/site-visits',  label: 'Site Visits',  icon: MapPin },
  { href: '/agent/commissions',  label: 'Commissions',  icon: BadgeDollarSign },
  { href: '/agent/inquiries',    label: 'Inquiries',    icon: MessageSquare },
  { href: '/agent/agency',       label: 'My Agency',    icon: Building2 },
  { href: '/agent/wallet',       label: 'Wallet',       icon: Wallet },
  { href: '/agent/subscription', label: 'Subscription', icon: Crown },
  { href: '/agent/profile',      label: 'Profile',      icon: User },
];

const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);
const ALLOWED_ROLES = ['agent', 'admin'];

// ─── Main layout ───────────────────────────────────────────────────────────────

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, loading } = useAuth();
  const [mounted,   setMounted]   = useState(false);
  const [moreOpen,  setMoreOpen]  = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) { router.replace('/auth/login?redirect=/agent'); return; }
      if (!ALLOWED_ROLES.includes(user.role)) {
        if (user.role === 'buyer') router.replace('/buyer');
        else if (user.role === 'owner' || user.role === 'seller') router.replace('/owner');
        else router.replace('/');
      }
    }
  }, [user, loading, mounted, router]);

  if (loading || !mounted || !user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40">
            <span className="text-white font-black text-xl">T4</span>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AG';

  const TICK_CONFIG: Record<string, { label: string; className: string }> = {
    blue:    { label: '✓', className: 'bg-blue-500 text-white' },
    gold:    { label: '★', className: 'bg-yellow-500 text-white' },
    diamond: { label: '◆', className: 'bg-purple-600 text-white' },
  };
  const tickInfo = user.agentTick && user.agentTick !== 'none' ? TICK_CONFIG[user.agentTick] : null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const currentItem = ALL_NAV.find(item => isActive(item.href, (item as any).exact));
  const pageTitle   = currentItem?.label ?? 'Dashboard';

  // ── Shared avatar ──────────────────────────────────────────────────────────
  const Avatar = ({ size = 9 }: { size?: number }) => (
    <div
      className={`relative rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 overflow-hidden`}
      style={{ width: size * 4, height: size * 4, fontSize: size * 1.5 }}
    >
      {user.avatar
        ? <OptimizedImage src={user.avatar} alt={user.name} fill className="object-cover" sizes={`${size * 4}px`} />
        : <span className="text-xs">{initials}</span>
      }
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-slate-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/80">

      {/* ═══════════════════════════════════════════════
          DESKTOP SIDEBAR
      ═══════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-slate-900 z-30 shadow-2xl">

        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-800/60">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 group-hover:bg-blue-500 transition-colors flex items-center justify-center shadow-lg shadow-blue-600/30 flex-shrink-0">
              <span className="text-white font-black text-sm">T4</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight tracking-tight">Think4BuySale</div>
              <div className="text-slate-500 text-[11px] leading-tight">Agent Portal</div>
            </div>
          </Link>
        </div>

        {/* User card */}
        <Link href="/agent/profile" className="mx-3 my-3 flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors group">
          <Avatar size={9} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white truncate leading-tight">{user.name}</span>
              {tickInfo && (
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black flex-shrink-0 ${tickInfo.className}`}>
                  {tickInfo.label}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 capitalize mt-0.5">{user.role}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-3 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
              {group.label && (
                <div className="px-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {group.label}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href, (item as any).exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                        active
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                      }`} />
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-300 rounded-full -ml-3" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Post property CTA */}
        <div className="p-4 border-t border-slate-800/60 space-y-2">
          <Link
            href="/post-property"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Post Property
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-slate-600 hover:text-slate-400 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Back to website
          </Link>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          DESKTOP CONTENT
      ═══════════════════════════════════════════════ */}
      <div className="hidden lg:block lg:pl-64 min-h-screen">
        {/* Desktop header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell panelHref="/agent/notifications" accentClass="bg-blue-600" />
            <Link
              href="/post-property"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Post Property
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>

      {/* ═══════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 safe-top"
          style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
          <div className="h-14 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/20">
                <span className="text-white font-black text-xs">T4</span>
              </div>
              <span className="text-sm font-bold text-gray-900 truncate">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationBell panelHref="/agent/notifications" accentClass="bg-blue-600" />
              <Link
                href="/post-property"
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Post
              </Link>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 pt-14 pb-[72px]">{children}</main>

        {/* ── Mobile bottom tab bar ────────────────── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 safe-bottom"
          style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center h-16 px-1">
            {BOTTOM_TABS.map(tab => {
              const active = isActive(tab.href, tab.exact);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl mx-0.5 transition-all active:scale-90"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-blue-600 shadow-md shadow-blue-600/30' : ''}`}>
                    <Icon className={`w-[22px] h-[22px] transition-colors ${active ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[10px] font-bold leading-none transition-colors ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}

            {/* More tab */}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl mx-0.5 transition-all active:scale-90"
            >
              <div className={`p-1.5 rounded-xl transition-all ${moreOpen ? 'bg-blue-600 shadow-md shadow-blue-600/30' : ''}`}>
                <MoreHorizontal className={`w-[22px] h-[22px] transition-colors ${moreOpen ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <span className={`text-[10px] font-bold leading-none transition-colors ${moreOpen ? 'text-blue-600' : 'text-gray-400'}`}>
                More
              </span>
            </button>
          </div>
        </nav>

        {/* ── Mobile "More" bottom sheet ───────────── */}
        {moreOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setMoreOpen(false)}
            />

            {/* Sheet */}
            <div
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden safe-bottom"
              style={{ boxShadow: '0 -20px 60px rgba(0,0,0,0.18)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* User row */}
              <div className="px-5 pb-3 flex items-center gap-3 border-b border-gray-100">
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden ring-2 ring-white shadow-md">
                  {user.avatar
                    ? <OptimizedImage src={user.avatar} alt={user.name} fill className="object-cover" sizes="44px" />
                    : <span className="text-xs font-bold">{initials}</span>
                  }
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 text-sm truncate">{user.name}</span>
                    {tickInfo && (
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black flex-shrink-0 ${tickInfo.className}`}>
                        {tickInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{user.role} · Online</div>
                </div>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of more items */}
              <div className="px-4 pt-4 pb-2 grid grid-cols-4 gap-3">
                {MORE_ITEMS.map(item => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex flex-col items-center gap-2 active:scale-90 transition-transform"
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all ${
                        active
                          ? 'bg-blue-600 shadow-blue-600/30 shadow-md'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}>
                        <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <span className={`text-[11px] font-semibold text-center leading-tight ${active ? 'text-blue-600' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="px-4 pt-3 pb-5 space-y-2.5 border-t border-gray-100 mt-2">
                <Link
                  href="/post-property"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-blue-600 active:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Post New Property
                </Link>
                <Link
                  href="/"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 active:bg-gray-200 text-gray-700 rounded-2xl text-sm font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  Back to Website
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
