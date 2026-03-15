import {
  LayoutDashboard, Search, PlusCircle, Home, Target, Users,
  Handshake, MapPin, Heart, MessageSquare, MessageCircle,
  BarChart2, TrendingUp, Bell, Zap, User, Settings,
  type LucideIcon,
} from 'lucide-react';

/** Maps a menu slug or icon name → Lucide icon component */
export const MENU_ICONS: Record<string, LucideIcon> = {
  dashboard:          LayoutDashboard,
  search_property:    Search,
  add_property:       PlusCircle,
  my_properties:      Home,
  leads:              Target,
  clients:            Users,
  deals:              Handshake,
  site_visits:        MapPin,
  saved_properties:   Heart,
  my_enquiries:       MessageSquare,
  messages:           MessageCircle,
  analytics:          BarChart2,
  property_analytics: TrendingUp,
  property_alerts:    Bell,
  boost_listing:      Zap,
  profile:            User,
  settings:           Settings,
  // icon name aliases (from DB icon field)
  'layout-dashboard': LayoutDashboard,
  'search':           Search,
  'plus-circle':      PlusCircle,
  'home':             Home,
  'target':           Target,
  'users':            Users,
  'handshake':        Handshake,
  'map-pin':          MapPin,
  'heart':            Heart,
  'message-square':   MessageSquare,
  'message-circle':   MessageCircle,
  'bar-chart-2':      BarChart2,
  'trending-up':      TrendingUp,
  'bell':             Bell,
  'zap':              Zap,
  'user':             User,
};

export function getMenuIcon(slug: string, iconName?: string): LucideIcon {
  return MENU_ICONS[slug] || MENU_ICONS[iconName || ''] || LayoutDashboard;
}
