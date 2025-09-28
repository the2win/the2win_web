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
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setAuth(undefined, res.data.user); // token not needed if cookie-based
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
