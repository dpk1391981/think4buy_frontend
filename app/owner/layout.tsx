'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, MenuItem } from '@/contexts/AuthContext';
import { getMenuIcon } from '@/lib/menuIcons';
import OptimizedImage from '@/components/common/OptimizedImage';
import { Bell, Plus, ExternalLink, ChevronRight, MoreHorizontal, X } from 'lucide-react';

// ── Slug → href mapping for owner panel ───────────────────────────────────────

const OWNER_HREF: Record<string, { href: string; exact?: boolean }> = {
  dashboard:          { href: '/owner',            exact: true },
  add_property:       { href: '/post-property' },
  my_properties:      { href: '/owner/properties' },
  leads:              { href: '/owner/leads' },
  messages:           { href: '/owner/messages' },
  property_analytics: { href: '/owner/analytics' },
  boost_listing:      { href: '/owner/boost' },
  profile:            { href: '/owner/profile' },
  settings:           { href: '/owner/settings' },
};

const FALLBACK_MENUS: MenuItem[] = [
  { name: 'Dashboard',          slug: 'dashboard',          icon: 'layout-dashboard' },
  { name: 'Add Property',       slug: 'add_property',       icon: 'plus-circle' },
  { name: 'My Properties',      slug: 'my_properties',      icon: 'home' },
  { name: 'Leads',              slug: 'leads',              icon: 'target' },
  { name: 'Property Analytics', slug: 'property_analytics', icon: 'trending-up' },
  { name: 'Profile',            slug: 'profile',            icon: 'user' },
];

const ALLOWED_ROLES = ['owner', 'seller'];

// ── Layout ─────────────────────────────────────────────────────────────────────

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, menus: ctxMenus, loading } = useAuth();

  const [mounted,  setMounted]  = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) { router.replace('/auth/login?redirect=/owner'); return; }
      if (!ALLOWED_ROLES.includes(user.role)) {
        if (user.role === 'admin')  router.replace('/admin');
        else if (user.role === 'agent') router.replace('/agent');
        else if (user.role === 'buyer') router.replace('/buyer');
      }
    }
  }, [user, loading, mounted, router]);

  if (loading || !mounted || !user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-600/40">
            <span className="text-white font-black text-xl">T4</span>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeMenus = (ctxMenus.length > 0 ? ctxMenus : FALLBACK_MENUS).filter(
    (m) => OWNER_HREF[m.slug],
  );

  const bottomTabs = activeMenus.slice(0, 4);
  const moreItems  = activeMenus.slice(4);

  const isActive = (slug: string) => {
    const map = OWNER_HREF[slug];
    if (!map) return false;
    return map.exact ? pathname === map.href : pathname.startsWith(map.href);
  };

  const currentMenu = activeMenus.find((m) => isActive(m.slug));
  const pageTitle   = currentMenu?.name ?? 'Owner Dashboard';

  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'OW';

  const Avatar = ({ size = 9 }: { size?: number }) => (
    <div
      className="relative rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold flex-shrink-0 overflow-hidden"
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

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-slate-900 z-30 shadow-2xl">

        <div className="px-5 pt-5 pb-4 border-b border-slate-800/60">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 transition-colors flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-black text-sm">T4</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight tracking-tight">Think4BuySale</div>
              <div className="text-slate-500 text-[11px] leading-tight">Owner Portal</div>
            </div>
          </Link>
        </div>

        <Link href="/owner/profile" className="mx-3 my-3 flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors group">
          <Avatar size={9} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate leading-tight">{user.name}</div>
            <div className="text-xs text-slate-400 capitalize mt-0.5">{user.role}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
        </Link>

        <nav className="flex-1 px-3 pb-3 overflow-y-auto">
          <div className="space-y-0.5">
            {activeMenus.map((item) => {
              const active = isActive(item.slug);
              const Icon   = getMenuIcon(item.slug, item.icon);
              const href   = OWNER_HREF[item.slug]?.href ?? '/owner';
              return (
                <Link
                  key={item.slug}
                  href={href}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    active
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="truncate">{item.name}</span>
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-300 rounded-full -ml-3" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/60 space-y-2">
          <Link
            href="/post-property"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
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

      {/* ── Desktop content ─────────────────────────────────────────────── */}
      <div className="hidden lg:block lg:pl-64 min-h-screen">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-8 h-14 flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">{pageTitle}</span>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <Link
              href="/post-property"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Post Property
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </div>

      {/* ── Mobile layout ───────────────────────────────────────────────── */}
      <div className="lg:hidden flex flex-col min-h-screen">

        <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 safe-top"
          style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
          <div className="h-14 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-black text-xs">T4</span>
              </div>
              <span className="text-sm font-bold text-gray-900 truncate">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="relative p-2 text-gray-400 rounded-xl">
                <Bell className="w-5 h-5" />
              </button>
              <Link
                href="/post-property"
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                Post
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-14 pb-[72px]">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 safe-bottom"
          style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.06)' }}>
          <div className="flex items-center h-16 px-1">
            {bottomTabs.map((tab) => {
              const active = isActive(tab.slug);
              const Icon   = getMenuIcon(tab.slug, tab.icon);
              const href   = OWNER_HREF[tab.slug]?.href ?? '/owner';
              return (
                <Link
                  key={tab.slug}
                  href={href}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl mx-0.5 transition-all active:scale-90"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-emerald-600 shadow-md' : ''}`}>
                    <Icon className={`w-[22px] h-[22px] ${active ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[10px] font-bold leading-none ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {tab.name.split(' ')[0]}
                  </span>
                </Link>
              );
            })}

            {moreItems.length > 0 && (
              <button
                onClick={() => setMoreOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl mx-0.5 active:scale-90"
              >
                <div className={`p-1.5 rounded-xl ${moreOpen ? 'bg-emerald-600 shadow-md' : ''}`}>
                  <MoreHorizontal className={`w-[22px] h-[22px] ${moreOpen ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <span className={`text-[10px] font-bold leading-none ${moreOpen ? 'text-emerald-600' : 'text-gray-400'}`}>More</span>
              </button>
            )}
          </div>
        </nav>

        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden safe-bottom"
              style={{ boxShadow: '0 -20px 60px rgba(0,0,0,0.18)' }}>
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="px-5 pb-3 flex items-center gap-3 border-b border-gray-100">
                <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                  {user.avatar
                    ? <OptimizedImage src={user.avatar} alt={user.name} fill className="object-cover" sizes="44px" />
                    : <span className="text-xs font-bold">{initials}</span>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-900 text-sm truncate">{user.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user.role} · Online</div>
                </div>
                <button onClick={() => setMoreOpen(false)} className="p-2 text-gray-400 bg-gray-100 rounded-xl">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 pt-4 pb-2 grid grid-cols-4 gap-3">
                {moreItems.map((item) => {
                  const active = isActive(item.slug);
                  const Icon   = getMenuIcon(item.slug, item.icon);
                  const href   = OWNER_HREF[item.slug]?.href ?? '/owner';
                  return (
                    <Link key={item.slug} href={href} className="flex flex-col items-center gap-2 active:scale-90 transition-transform">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${active ? 'bg-emerald-600 shadow-emerald-600/30 shadow-md' : 'bg-gray-100'}`}>
                        <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <span className={`text-[11px] font-semibold text-center leading-tight ${active ? 'text-emerald-600' : 'text-gray-600'}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="px-4 pt-3 pb-5 border-t border-gray-100 mt-2">
                <Link
                  href="/"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold"
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
