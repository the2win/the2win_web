'use client';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore, type AuthState } from '@/lib/authStore';

export function AuthBootstrap() {
  const user = useAuthStore((s: AuthState) => s.user);
  const setAuth = useAuthStore((s: AuthState) => s.setAuth);
  const initializing = useAuthStore((s: AuthState) => s.initializing);
  const setInitializing = useAuthStore((s: AuthState) => s.setInitializing);

  useEffect(() => {
    if (user || !initializing) return; // already attempted
    // Restore token from localStorage if present
    try {
      const saved = localStorage.getItem('auth_token');
      if (saved) {
        // We don't have the user object yet; try /auth/me below which works via cookie or bearer
        // Set token into store so api interceptor attaches it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useAuthStore.getState() as any).setAuth(saved, useAuthStore.getState().user);
      }
    } catch {}
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setAuth(useAuthStore.getState().token, res.data.user);
        }
      } catch {
        // ignore silently
      } finally {
        setInitializing(false);
      }
    })();
  }, [user, initializing, setAuth, setInitializing]);

  return null;
}
