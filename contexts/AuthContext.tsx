'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  city?: string;
  company?: string;
  isVerified: boolean;
  needsOnboarding?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
      return;
    }
    try {
      const { data } = await authApi.getProfile();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      document.cookie = 't4bs_auth=1; path=/; max-age=604800; samesite=strict';
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Seed from localStorage first (instant), then validate with API
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    refresh();
  }, [refresh]);

  const login = (token: string, userData: AuthUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // Set a non-httpOnly presence cookie so Next.js middleware can detect auth state
    // without reading localStorage (which is inaccessible server-side).
    // This is NOT a security token — the real JWT stays in localStorage/HTTP-only cookie.
    document.cookie = 't4bs_auth=1; path=/; max-age=604800; samesite=strict';
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Clear the presence cookie so middleware correctly blocks private routes
    document.cookie = 't4bs_auth=; path=/; max-age=0; samesite=strict';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
