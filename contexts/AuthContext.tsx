'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import { api } from '@/lib/api';

export interface MenuItem {
  name: string;
  slug: string;
  icon: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  pendingAvatar?: string;
  city?: string;
  company?: string;
  isVerified: boolean;
  needsOnboarding?: boolean;
  agentTick?: 'none' | 'blue' | 'gold' | 'diamond';
  agentProfileStatus?: 'none' | 'pending' | 'approved' | 'inactive';
  isActive?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  menus: MenuItem[];
  loading: boolean;
  login: (token: string, user: AuthUser, menus?: MenuItem[]) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  menus: [],
  loading: true,
  login: () => {},
  logout: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
      return;
    }
    try {
      const [profileRes, menusRes] = await Promise.all([
        authApi.getProfile(),
        api.get('/menus/me').catch(() => ({ data: [] })),
      ]);
      const userData = profileRes.data;
      const menusData: MenuItem[] = menusRes.data || [];

      setUser(userData);
      setMenus(menusData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('menus', JSON.stringify(menusData));
      document.cookie = 't4bs_auth=1; path=/; max-age=604800; samesite=strict';
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('menus');
      setUser(null);
      setMenus([]);
      document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Seed from localStorage first (instant), then validate with API
    const stored = localStorage.getItem('user');
    const storedMenus = localStorage.getItem('menus');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    if (storedMenus) {
      try { setMenus(JSON.parse(storedMenus)); } catch {}
    }
    refresh();
  }, [refresh]);

  const login = (token: string, userData: AuthUser, loginMenus?: MenuItem[]) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (loginMenus) {
      setMenus(loginMenus);
      localStorage.setItem('menus', JSON.stringify(loginMenus));
    }
    // Set a non-httpOnly presence cookie so Next.js middleware can detect auth state
    document.cookie = 't4bs_auth=1; path=/; max-age=604800; samesite=strict';
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('menus');
    localStorage.removeItem('pf_wishlist'); // clear saved state so next user starts fresh
    setUser(null);
    setMenus([]);
    document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
  };

  return (
    <AuthContext.Provider value={{ user, menus, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
