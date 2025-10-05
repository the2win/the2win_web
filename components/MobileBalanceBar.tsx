"use client";
import { useAuthStore } from "../lib/authStore";
import { useEffect, useState } from "react";

// A lightweight auto-updating balance bar for mobile screens.
// Shows when user is logged in; hidden on md+ (desktop shows in nav/sidebar).
export function MobileBalanceBar(){
  const user = useAuthStore(s=>s.user);
  const [ts,setTs]=useState(0);
  // Optionally tick to allow external balance updates to reflect quickly (could also rely on store subscription only)
  useEffect(()=>{ const id = setInterval(()=>setTs(t=>t+1), 10000); return ()=>clearInterval(id); }, []);
  if(!user) return null;
  return (
    <div className="md:hidden px-4 py-2 bg-slate-800/80 backdrop-blur border-b border-slate-700 flex items-center justify-between text-sm">
      <div className="flex flex-col">
        <span className="text-[11px] text-slate-400 leading-tight">Balance</span>
        <span className="font-semibold text-indigo-300 tracking-wide">Rs. {Math.trunc(user.balance).toLocaleString('en-LK')}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-slate-500 leading-tight">User</span>
        <span className="font-mono text-slate-300 text-xs truncate max-w-[140px]">{user.email}</span>
      </div>
    </div>
  );
}
