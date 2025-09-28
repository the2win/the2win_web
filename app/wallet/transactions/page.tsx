'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { RequireAuth } from '../../../components/RequireAuth';
import { TransactionDto } from '../../../lib/types';

export default function TransactionsPage(){
  const [txs,setTxs]=useState<TransactionDto[]>([]);
  useEffect(()=>{ (async()=>{ try { const r = await api.get('/wallet/transactions'); const arr = Array.isArray(r.data.transactions) ? r.data.transactions : []; setTxs(arr); } catch { setTxs([]);} })(); },[]);
  return <RequireAuth><div className="space-y-4 max-w-2xl mx-auto px-2">
    <h2 className="text-xl font-semibold">Transactions</h2>
    {!txs.length && <p className="text-xs text-slate-500">No transactions yet.</p>}
    <ul className="space-y-2 text-sm">
      {txs.map(t=> <li key={t.id} className="bg-slate-800 rounded px-3 py-2 flex justify-between">
        <span className="font-medium">{t.type}</span>
        <span className={t.type==='DEPOSIT' || t.type==='WIN' ? 'text-green-400' : 'text-red-400'}>{t.type==='DEPOSIT' || t.type==='WIN' ? '+' : '-'}{t.amount}</span>
      </li>)}
    </ul>
  </div></RequireAuth>;
}
