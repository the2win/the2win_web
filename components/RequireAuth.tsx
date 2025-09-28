'use client';
import { useAuthStore } from '../lib/authStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s=>s.user);
  const router = useRouter();
  useEffect(()=>{ if(!user) router.replace('/auth/login'); },[user, router]);
  if(!user) return <p className="text-sm">Redirecting...</p>;
  return <>{children}</>;
}
