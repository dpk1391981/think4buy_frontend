'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi } from '@/lib/api';

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  type: 'lead' | 'property' | 'system' | 'message' | 'admin';
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL = 30_000; // 30s polling fallback

export function useNotifications() {
  const [recent, setRecent] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<NodeJS.Timeout>();

  const fetchRecent = useCallback(async () => {
    try {
      const [recentRes, countRes] = await Promise.all([
        notificationsApi.getRecent(),
        notificationsApi.getUnreadCount(),
      ]);
      setRecent(recentRes.data);
      setUnreadCount(countRes.data.count ?? 0);
    } catch {}
  }, []);

  // Connect SSE for real-time push
  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    if (eventSourceRef.current) return; // already connected

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const url = `${apiBase}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('notification', (e: MessageEvent) => {
      try {
        const n: AppNotification = JSON.parse(e.data);
        setRecent(prev => [n, ...prev].slice(0, 10));
        setUnreadCount(c => c + 1);
      } catch {}
    });

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      // Fallback to polling on SSE error
    };
  }, []);

  const disconnectSSE = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const markRead = useCallback(async (id: string) => {
    await notificationsApi.markRead(id);
    setRecent(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setRecent(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    setLoading(true);
    fetchRecent().finally(() => setLoading(false));
    connectSSE();

    // Polling fallback (also refreshes list periodically)
    pollRef.current = setInterval(fetchRecent, POLL_INTERVAL);

    return () => {
      disconnectSSE();
      clearInterval(pollRef.current);
    };
  }, [fetchRecent, connectSSE, disconnectSSE]);

  return { recent, unreadCount, loading, markRead, markAllRead, refetch: fetchRecent };
}
