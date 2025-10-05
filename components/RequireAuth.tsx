'use client';
import { useAuthStore } from '../lib/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s=>s.user);
  const initializing = useAuthStore(s=>s.initializing);
  const router = useRouter();
  useEffect(()=>{ if(!initializing && !user) router.replace('/auth/login'); },[user, initializing, router]);
  if(initializing) return <p className="text-sm text-slate-400">Loading session…</p>;
  if(!user) return <p className="text-sm">Redirecting...</p>;
  return <>{children}</>;
}
