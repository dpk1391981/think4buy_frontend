'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Users,
  MapPin,
  Globe,
  Wallet,
  CreditCard,
  Receipt,
  LogOut,
  Shield,
  ChevronRight,
  Menu,
  X,
  Tag,
  Layers,
  FileText,
  Link2,
  Settings,
  Building2,
  UserCheck,
  Target,
  Handshake,
  IndianRupee,
  BookOpen,
  Navigation,
  LayoutGrid,
  Zap,
  Gem,
} from 'lucide-react';
import { authApi } from '@/lib/api';
import NotificationBell from '@/components/notifications/NotificationBell';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Listings',
    items: [
      { href: '/admin/properties', label: 'Properties', icon: Home },
      { href: '/admin/categories', label: 'Categories', icon: Tag },
      { href: '/admin/property-config', label: 'Property Config', icon: Layers },
    ],
  },
  {
    label: 'Agencies',
    items: [
      { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
      { href: '/admin/agents', label: 'Agents', icon: UserCheck },
      { href: '/admin/premium-slots',   label: 'Premium Slots',    icon: Zap },
      { href: '/admin/agent-coverage',  label: 'Agent Coverage', icon: Gem },
    ],
  },
  {
    label: 'Users',
    items: [
      { href: '/admin/users', label: 'All Users', icon: Users },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/articles', label: 'Articles', icon: BookOpen },
      { href: '/admin/menu', label: 'Menu', icon: Navigation },
      { href: '/admin/role-menus', label: 'Role Menus', icon: LayoutGrid },
    ],
  },
  {
    label: 'SEO',
    items: [
      { href: '/admin/seo/footer-links', label: 'Footer SEO Links', icon: Link2 },
      { href: '/admin/seo/config', label: 'SEO Config', icon: Settings },
    ],
  },
  {
    label: 'Locations',
    items: [
      { href: '/admin/countries', label: 'Countries', icon: Globe },
      { href: '/admin/locations', label: 'States & Cities', icon: MapPin },
    ],
  },
  {
    label: 'CRM',
    items: [
      { href: '/admin/leads', label: 'Leads', icon: Target },
      { href: '/admin/deals', label: 'Deals', icon: Handshake },
      { href: '/admin/commissions', label: 'Commissions', icon: IndianRupee },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/wallets', label: 'Wallets', icon: Wallet },
      { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { href: '/admin/payments', label: 'Payments', icon: Receipt },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Clear stale undefined/null tokens that may have been stored by older code
    const storedToken = localStorage.getItem('token');
    if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
      localStorage.removeItem('token');
      router.replace('/auth/login?redirect=/admin');
      return;
    }

    authApi
      .getProfile()
      .then((r) => {
        if (r.data.role !== 'admin') {
          router.replace('/');
        } else {
          setUser(r.data);
          setLoading(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
        router.replace('/auth/login?redirect=/admin');
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          <p className="text-slate-400 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Think4BuySale</div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      active
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}
                      size={18}
                    />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-white/60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Home size={13} />
            Back to Site
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
              router.push('/auth/login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-col flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Sticky Top Bar — mobile + desktop */}
        <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 flex items-center gap-3 px-4 lg:px-6 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-bold text-white">Think4BuySale Admin</span>
          </div>
          <div className="flex-1" />
          <NotificationBell panelHref="/admin/notifications" accentClass="bg-orange-600" />
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[10px] font-bold">
              {userInitials}
            </div>
            <span className="text-xs text-slate-300 hidden sm:block">{user?.name}</span>
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
