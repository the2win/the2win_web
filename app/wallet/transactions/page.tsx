'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { RequireAuth } from '../../../components/RequireAuth';
import { TransactionDto } from '../../../lib/types';
import { useAuthStore } from '@/lib/authStore';
import { formatLKR } from '@/lib/currency';

export default function TransactionsPage(){
  const user = useAuthStore(s=>s.user);
  const [txs,setTxs]=useState<TransactionDto[]>([]);
  useEffect(()=>{ (async()=>{ try { const r = await api.get('/wallet/transactions'); const arr = Array.isArray(r.data.transactions) ? r.data.transactions : []; setTxs(arr); } catch { setTxs([]);} })(); },[]);
  return <RequireAuth><div className="space-y-4 max-w-2xl mx-auto px-2">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Transactions</h2>
      {user && <div className="text-xs text-slate-400">User ID: <span className="font-mono text-slate-200">{user.id}</span></div>}
    </div>
    {!txs.length && <p className="text-xs text-slate-500">No transactions yet.</p>}
    <ul className="space-y-2 text-sm">
      {txs.map(t=> <li key={t.id} className="bg-slate-800 rounded px-3 py-2 flex justify-between">
        <span className="font-medium">{t.type}</span>
        <span className={t.type==='DEPOSIT' || t.type==='WIN' ? 'text-green-400' : 'text-red-400'}>{t.type==='DEPOSIT' || t.type==='WIN' ? '+' : '-'}{formatLKR(t.amount)}</span>
      </li>)}
    </ul>
  </div></RequireAuth>;
}
