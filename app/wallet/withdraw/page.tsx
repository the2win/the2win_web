'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';

type WithdrawMethod = 'bank_in' | 'binance' | 'cash_agent';
interface BankAccount { id: string; bankName: string; accountNumber: string; accountHolder: string; isDefault?: boolean }

const METHOD_META: Record<WithdrawMethod, { label: string; desc: string; min: number; max: number; extra?: string }> = {
  bank_in: { label: 'Bank Transfer (IN)', desc: 'Withdraw to your Indian bank account.', min: 10, max: 100000, extra: 'Typically processed in 1–24h on business days.' },
  binance: { label: 'Binance (USDT)', desc: 'Withdraw USDT to your Binance address.', min: 10, max: 5000, extra: 'On-chain network fee may apply. Ensure the correct network (TRC20/BEP20).' },
  cash_agent: { label: 'Cash Agent (Fastest)', desc: 'Our cash agent processes withdrawals quickly.', min: 10, max: 100000, extra: 'Easiest and fastest method.' }
};

export default function WithdrawPage(){
  const [method,setMethod]=useState<WithdrawMethod>('cash_agent');
  const [amount,setAmount]=useState<number | ''>('');
  const [msg,setMsg]=useState('');
  const [error,setError]=useState('');
  const [submitting,setSubmitting]=useState(false);

  // Bank accounts from backend
  const [accounts,setAccounts]=useState<BankAccount[]>([]);
  const [selectedAcctId,setSelectedAcctId]=useState<string | null>(null);
  const [addingAcct,setAddingAcct]=useState(false);
  const [banksIN,setBanksIN]=useState<string[]>([]);
  const [newAcct,setNewAcct]=useState({ bankName:'', accountNumber:'', accountHolder:'', makeDefault:true });

  // Binance dest
  const [binanceAddress,setBinanceAddress]=useState('');
  // Optional note for cash_agent
  const [agentNote,setAgentNote]=useState('');

  const meta = METHOD_META[method];

  useEffect(()=>{
    // Load bank accounts and banks list
    (async()=>{
      try {
        const [accRes, banksRes] = await Promise.all([
          api.get('/wallet/bank-accounts'),
          api.get('/wallet/banks/in')
        ]);
        const accs: BankAccount[] = accRes.data.accounts || [];
        setAccounts(accs);
        const def = accs.find(a=>a.isDefault) || accs[0];
        if (def) setSelectedAcctId(String(def.id));
        setBanksIN(banksRes.data.banks || []);
      } catch {}
    })();
  },[]);

  const limitsText = useMemo(()=>`Limits: ${meta.min} – ${meta.max}`, [meta]);

  function validate(): string | null {
    if (amount === '' || isNaN(Number(amount))) return 'Enter an amount.';
    const val = Number(amount);
    if (val < meta.min) return `Minimum for ${meta.label} is ${meta.min}.`;
    if (val > meta.max) return `Maximum for ${meta.label} is ${meta.max}.`;
    if (method === 'bank_in') {
      if (!selectedAcctId) return 'Select a bank account.';
    } else if (method === 'binance') {
      if (!binanceAddress || binanceAddress.length < 10) return 'Enter a valid Binance address.';
    }
    return null;
  }

  async function addBankAccount(e:any){
    e.preventDefault();
    setError(''); setMsg('');
    try {
      if (!newAcct.bankName || !newAcct.accountNumber || !newAcct.accountHolder) return;
      const r = await api.post('/wallet/bank-accounts', newAcct);
      const acct: BankAccount = r.data.account;
      setAccounts(a=>[acct, ...a]);
      setSelectedAcctId(String(acct.id));
      setAddingAcct(false);
      setNewAcct({ bankName:'', accountNumber:'', accountHolder:'', makeDefault:true });
    } catch (e:any) {
      setError(e.response?.data?.message || 'Failed to add bank account');
    }
  }

  async function setDefaultAccount(id: string){
    try { await api.post(`/wallet/bank-accounts/${id}/default`); setAccounts(a=>a.map(x=>({...x, isDefault: String(x.id)===String(id)}))); }
    catch {}
  }

  async function submit(e:any){
    e.preventDefault();
    setMsg(''); setError('');
    const v = validate(); if (v) { setError(v); return; }
    setSubmitting(true);
    try {
      const payload: any = { amount: Number(amount), method };
      if (method==='bank_in') payload.bankAccountId = selectedAcctId;
      if (method==='binance') payload.dest = binanceAddress.trim();
      if (method==='cash_agent' && agentNote) payload.dest = agentNote.trim();
      await api.post('/wallet/withdraw', payload);
      setMsg('Withdrawal request submitted. Once approved by admin, funds are processed within 10 minutes.');
      setAmount('');
      setBinanceAddress('');
      setAgentNote('');
    } catch (e:any) { setError(e.response?.data?.message || 'Failed to submit withdrawal'); }
    finally { setSubmitting(false); }
  }

  return <RequireAuth><div className="max-w-3xl mx-auto space-y-6">
    <div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text">Withdraw Funds</h2>
      <p className="text-slate-400 text-sm mt-1">Select a withdrawal method and provide required details.</p>
    </div>

    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 backdrop-blur p-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(METHOD_META) as WithdrawMethod[]).map(m => (
          <button key={m} onClick={()=>{setMethod(m); setError(''); setMsg('');}}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${method===m ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>{METHOD_META[m].label}</button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-slate-400">Amount</label>
          <input type="number" min={meta.min} max={meta.max} step="0.01" value={amount} onChange={e=>setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={`${meta.min} - ${meta.max}`} className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <p className="text-[11px] text-slate-500">{limitsText}</p>
          <p className="text-[11px] text-slate-500">Note: 1000 coins = 10 USDT.</p>
        </div>

        {method === 'bank_in' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">Your Bank Accounts</label>
              {!accounts.length && <p className="text-[11px] text-slate-500">No bank accounts added yet.</p>}
              <div className="space-y-2">
                {accounts.map(a => (
                  <div key={a.id} className={`w-full px-4 py-2 rounded-lg border transition-all text-sm ${selectedAcctId===String(a.id) ? 'border-cyan-400 bg-slate-900' : 'border-slate-600 bg-slate-900/40'}`}>
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={()=>setSelectedAcctId(String(a.id))} className="text-left">
                        <div className="font-medium">[{a.bankName}] {a.accountHolder}</div>
                        <div className="font-mono text-xs text-slate-400">•••• {String(a.accountNumber).slice(-4)}</div>
                      </button>
                      <button type="button" onClick={()=>setDefaultAccount(String(a.id))} className="text-[11px] text-indigo-400 hover:text-indigo-300">{a.isDefault ? 'Default' : 'Make default'}</button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={()=>setAddingAcct(a=>!a)} className="text-xs text-indigo-400 hover:text-indigo-300">{addingAcct ? 'Cancel' : 'Add Bank Account'}</button>
            </div>
            {addingAcct && (
              <div className="space-y-3 rounded-lg border border-slate-700/50 p-3 bg-slate-900/40">
                <div className="grid sm:grid-cols-2 gap-3">
                  <select value={newAcct.bankName} onChange={e=>setNewAcct(o=>({...o, bankName:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-sm">
                    <option value="">Select Bank</option>
                    {banksIN.map(b=> <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input value={newAcct.accountHolder} onChange={e=>setNewAcct(o=>({...o, accountHolder:e.target.value}))} placeholder="Account Holder" className="px-3 py-2 rounded bg-slate-800 text-sm" />
                  <input value={newAcct.accountNumber} onChange={e=>setNewAcct(o=>({...o, accountNumber:e.target.value}))} placeholder="Account Number" className="px-3 py-2 rounded bg-slate-800 text-sm sm:col-span-2" />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={newAcct.makeDefault} onChange={e=>setNewAcct(o=>({...o, makeDefault:e.target.checked}))} /> Make default</label>
                <button onClick={addBankAccount} className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-sm font-semibold">Save Account</button>
              </div>
            )}
          </div>
        )}

        {method === 'binance' && (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">Binance USDT Address</label>
            <input value={binanceAddress} onChange={e=>setBinanceAddress(e.target.value)} placeholder="Enter destination address" className="w-full px-4 py-2 rounded bg-slate-900/50 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-[11px] text-slate-500">Ensure network matches (TRC20 / BEP20). Wrong network may lose funds.</p>
          </div>
        )}

        {method === 'cash_agent' && (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-slate-400">Note to Cash Agent (optional)</label>
            <input value={agentNote} onChange={e=>setAgentNote(e.target.value)} placeholder="e.g., preferred contact or time" className="w-full px-4 py-2 rounded bg-slate-900/50 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-[11px] text-slate-500">Our cash agent will reach out and process the withdrawal quickly.</p>
          </div>
        )}

        {meta.extra && <p className="text-[11px] text-slate-500">{meta.extra}</p>}
        {error && <div className="text-sm text-red-400">{error}</div>}
        {msg && <div className="text-sm text-emerald-400">{msg}</div>}

        <button disabled={submitting} className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform">
          {submitting ? 'Submitting...' : 'Submit Withdrawal'}
        </button>
      </form>
    </div>
  </div></RequireAuth>;
}
