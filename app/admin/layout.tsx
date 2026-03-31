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
  ChevronDown,
  Menu,
  X,
  Tag,
  Layers,
  FileText,
  Link2,
  Settings,
  UserCheck,
  Target,
  Handshake,
  IndianRupee,
  BookOpen,
  Navigation,
  LayoutGrid,
  Zap,
  Gem,
  MessageSquare,
  BarChart2,
  SlidersHorizontal,
  Star,
  Wrench,
  Database,
  ShieldCheck,
  ClipboardList,
  MonitorPlay,
  ToggleLeft,
  Building2,
  Inbox,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, slug: 'admin_dashboard' },
    ],
  },
  {
    label: 'Listings',
    items: [
      { href: '/admin/properties',         label: 'Properties',          icon: Home,    slug: 'admin_properties'          },
      { href: '/admin/featured-properties', label: 'Featured Properties', icon: Star,    slug: 'admin_featured_properties' },
      { href: '/admin/categories',          label: 'Categories',          icon: Tag,     slug: 'admin_categories'          },
      { href: '/admin/property-config',     label: 'Property Config',     icon: Layers,  slug: 'admin_property_config'     },
    ],
  },
  {
    label: 'Agents',
    items: [
      { href: '/admin/agents',         label: 'Agents',         icon: UserCheck, slug: 'admin_agents'         },
      { href: '/admin/premium-slots',  label: 'Premium Slots',  icon: Zap,       slug: 'admin_premium_slots'  },
      { href: '/admin/agent-coverage', label: 'Agent Coverage', icon: Gem,       slug: 'admin_agent_coverage' },
    ],
  },
  {
    label: 'Users',
    items: [
      { href: '/admin/users', label: 'All Users', icon: Users, slug: 'admin_users' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/articles', label: 'Articles', icon: BookOpen,  slug: 'admin_articles' },
      { href: '/admin/menu',     label: 'Menu',     icon: Navigation, slug: 'admin_menu'     },
    ],
  },
  {
    label: 'SEO',
    items: [
      { href: '/admin/seo/footer-links',   label: 'Footer SEO Links',   icon: Link2,    slug: 'admin_seo_footer_links'   },
      { href: '/admin/seo/agent-listing',    label: 'Agent Listing SEO',    icon: MapPin,    slug: 'admin_seo_agent_listing'    },
      { href: '/admin/seo/property-listing', label: 'Property Listing SEO', icon: Building2, slug: 'admin_seo_property_listing' },
      { href: '/admin/seo/config',        label: 'SEO Config',         icon: Settings, slug: 'admin_seo_config'        },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/storage-settings',  label: 'Storage & Watermark', icon: Database,    slug: 'admin_storage_settings'  },
      { href: '/admin/system-config',     label: 'Feature Toggles',     icon: ToggleLeft,  slug: 'admin_system_config'     },
      { href: '/admin/media-processing',  label: 'Media Queue',         icon: MonitorPlay, slug: 'admin_media_processing'  },
    ],
  },
  {
    label: 'Security & RBAC',
    items: [
      { href: '/admin/roles',      label: 'Roles & Permissions', icon: ShieldCheck,  slug: 'admin_roles'      },
      { href: '/admin/role-menus', label: 'Role Menus',          icon: LayoutGrid,   slug: 'admin_role_menus' },
      { href: '/admin/audit-logs', label: 'Audit Logs',          icon: ClipboardList, slug: 'admin_audit_logs' },
    ],
  },
  {
    label: 'Locations',
    items: [
      { href: '/admin/countries',           label: 'Countries',           icon: Globe,             slug: 'admin_countries'           },
      { href: '/admin/locations',           label: 'States & Cities',     icon: MapPin,            slug: 'admin_locations'           },
      { href: '/admin/market-intelligence',  label: 'Market Intelligence', icon: BarChart2,         slug: 'admin_market_intelligence'  },
      { href: '/admin/tools-insights',      label: 'Tools & Insights',    icon: Wrench,            slug: 'admin_tools_insights'       },
      { href: '/admin/scoring-config',      label: 'Scoring Config',      icon: SlidersHorizontal, slug: 'admin_scoring_config'       },
      { href: '/admin/locations/import',    label: 'Import Locations',    icon: Database,          slug: 'admin_locations_import'     },
    ],
  },
  {
    label: 'CRM',
    items: [
      { href: '/admin/leads',         label: 'Leads',         icon: Target,      slug: 'admin_leads'         },
      { href: '/admin/service-leads', label: 'Service Leads', icon: Wrench,      slug: 'admin_service_leads' },
      { href: '/admin/deals',         label: 'Deals',         icon: Handshake,   slug: 'admin_deals'         },
      { href: '/admin/commissions',   label: 'Commissions',   icon: IndianRupee, slug: 'admin_commissions'   },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/wallets',       label: 'Wallets',       icon: Wallet,   slug: 'admin_wallets'       },
      { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, slug: 'admin_subscriptions' },
      { href: '/admin/payments',      label: 'Payments',      icon: Receipt,  slug: 'admin_payments'      },
    ],
  },
  {
    label: 'Messaging',
    items: [
      { href: '/admin/messaging', label: 'Messaging Centre', icon: MessageSquare, slug: 'admin_messaging' },
    ],
  },
  {
    label: 'Support',
    items: [
      { href: '/admin/support/feedback',    label: 'Feedback & Reviews', icon: ThumbsUp,      slug: 'admin_support_feedback'    },
      { href: '/admin/support/complaints',  label: 'Complaints',         icon: AlertTriangle,  slug: 'admin_support_complaints'  },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allowedSlugs, setAllowedSlugs] = useState<Set<string> | null>(null);

  // All groups collapsed by default except "Listings" (Properties section)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(NAV_GROUPS.map((g) => g.label).filter((l) => l !== 'Listings')),
  );

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  // Auto-open the group that contains the currently active route
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find((g) =>
      g.items.some((item) =>
        (item as any).exact ? pathname === item.href : pathname.startsWith(item.href)
      ),
    );
    if (activeGroup?.label) {
      setCollapsedGroups((prev) => {
        if (!prev.has(activeGroup.label)) return prev;
        const next = new Set(prev);
        next.delete(activeGroup.label);
        return next;
      });
    }
  }, [pathname]);

  // Fetch menu permissions for the current user's role
  useEffect(() => {
    if (!user) return;
    import('@/lib/api').then(({ api }) => {
      api.get('/menus/me').then((res) => {
        const slugs: string[] = (res.data || []).map((m: any) => m.slug);
        setAllowedSlugs(new Set(slugs));
      }).catch(() => setAllowedSlugs(new Set()));
    });
  }, [user?.role]);

  // Gate: wait for AuthContext to resolve, then check admin access
  useEffect(() => {
    console.log('==========authLoading==========================');
    console.log(authLoading);
    console.log('====================================');
    if (authLoading) return; // still resolving

    if (!user) {
      // Not logged in
      document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
      router.replace('/auth/login?redirect=/admin');
      return;
    }

    const isAdminLevel = user.isSuperAdmin || user.role === 'admin' || user.role === 'super_admin';
    if (!isAdminLevel) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const isAdminLevel = user && (user.isSuperAdmin || user.role === 'admin' || user.role === 'super_admin');

  if (authLoading || !isAdminLevel) {
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
        {allowedSlugs === null ? (
          <div className="space-y-3 px-2 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-slate-800 rounded-lg animate-pulse opacity-60" />
            ))}
          </div>
        ) : null}
        {NAV_GROUPS.map((group) => {
          const visibleItems = allowedSlugs === null
            ? []
            : group.items.filter((item) => {
                const slug = (item as any).slug;
                return !slug || allowedSlugs.has(slug);
              });
          if (visibleItems.length === 0) return null;
          const collapsed = collapsedGroups.has(group.label);
          const hasActive = visibleItems.some((item) =>
            (item as any).exact ? pathname === item.href : pathname.startsWith(item.href),
          );
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center justify-between px-3 mb-1.5 group/hdr rounded-lg py-1 transition-colors ${
                  hasActive ? 'bg-primary-600/10' : 'hover:bg-slate-800/40'
                }`}
              >
                <p className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  hasActive ? 'text-primary-400' : 'text-slate-500 group-hover/hdr:text-slate-400'
                }`}>
                  {group.label}
                </p>
                <ChevronDown
                  className={`w-3 h-3 transition-all duration-200 ${
                    hasActive ? 'text-primary-400' : 'text-slate-600 group-hover/hdr:text-slate-400'
                  } ${collapsed ? '-rotate-90' : ''}`}
                />
              </button>
              {!collapsed && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = (item as any).exact ? pathname === item.href : pathname.startsWith(item.href);
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
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-white truncate">{user?.name}</span>
              {(user?.isSuperAdmin || user?.role === 'super_admin') && (
                <span className="flex-shrink-0 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  Root
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {(user?.isSuperAdmin || user?.role === 'super_admin') ? 'Super Admin' : user?.role === 'admin' ? 'Administrator' : user?.role}
            </div>
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
              logout();
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
