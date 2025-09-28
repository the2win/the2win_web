'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';

interface DepositReq { id: string; amount: number; method: string; status: 'PENDING'|'APPROVED'|'REJECTED'; createdAtMs: number; reviewedAtMs?: number|null; receiptPath?: string|null }
interface WithdrawReq { id: string; amount: number; method: string; status: 'PENDING'|'APPROVED'|'REJECTED'; createdAtMs: number; reviewedAtMs?: number|null; dest?: string|null }

function fmt(ts?: number){ if (!ts) return ''; const d = new Date(ts); return d.toLocaleString(); }

export default function RequestsPage(){
  const [deps,setDeps]=useState<DepositReq[]>([]);
  const [withs,setWiths]=useState<WithdrawReq[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ (async()=>{
    try {
      const [d,w] = await Promise.all([
        api.get('/wallet/deposit-requests'),
        api.get('/wallet/withdraw-requests')
      ]);
      setDeps(d.data.requests||[]);
      setWiths(w.data.requests||[]);
    } finally { setLoading(false); }
  })(); },[]);

  return <RequireAuth>
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text">Requests Status</h2>
        <p className="text-slate-400 text-sm mt-1">Once approved by admin, funds are processed within 10 minutes.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 backdrop-blur p-4">
          <h3 className="font-semibold mb-3">Deposit Requests</h3>
          {loading && <p className="text-xs text-slate-500">Loading…</p>}
          {!loading && !deps.length && <p className="text-xs text-slate-500">No deposit requests.</p>}
          <ul className="space-y-2">
            {deps.map(r=> (
              <li key={r.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{r.method}</div>
                  <div className="font-mono">+{Number(r.amount)}</div>
                </div>
                <div className="text-[11px] text-slate-500">{fmt(r.createdAtMs)} • <span className={r.status==='PENDING'?'text-yellow-400': r.status==='APPROVED'?'text-green-400':'text-red-400'}>{r.status}</span></div>
                {r.receiptPath && <a href={r.receiptPath} target="_blank" className="text-[11px] text-cyan-400">View receipt</a>}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 backdrop-blur p-4">
          <h3 className="font-semibold mb-3">Withdraw Requests</h3>
          {loading && <p className="text-xs text-slate-500">Loading…</p>}
          {!loading && !withs.length && <p className="text-xs text-slate-500">No withdrawal requests.</p>}
          <ul className="space-y-2">
            {withs.map(r=> (
              <li key={r.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{r.method}</div>
                  <div className="font-mono">-{Number(r.amount)}</div>
                </div>
                <div className="text-[11px] text-slate-500">{fmt(r.createdAtMs)} • <span className={r.status==='PENDING'?'text-yellow-400': r.status==='APPROVED'?'text-green-400':'text-red-400'}>{r.status}</span></div>
                {r.dest && <div className="text-[11px] text-slate-500">Dest: {r.dest}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </RequireAuth>;
}
