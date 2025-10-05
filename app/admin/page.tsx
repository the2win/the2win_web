'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { RequireAuth } from '@/components/RequireAuth';
import { api } from '@/lib/api';
import { formatLKR } from '@/lib/currency';

// Minimal stats now only uses transactions summary for admin expenses/income
type TxSummary = { DEPOSIT: number; WITHDRAW: number; BET: number; WIN: number };
type AdminUser = { id: string; email: string; role: string; balance: number; createdAt: string };
type Tx = { id:string; userId:string; type:string; amount:number; createdAt:string; meta?:any };
type DepositReq = { id:string; userId:string; amount:number; method:string; receiptPath?:string|null; status:'PENDING'|'APPROVED'|'REJECTED'; createdAt:string };
type WithdrawReq = { id:string; userId:string; amount:number; method:string; dest?:string|null; status:'PENDING'|'APPROVED'|'REJECTED'; createdAt:string };

export default function AdminPage(){
  const user = useAuthStore(s=>s.user);
  const isAdmin = useMemo(()=> !!user && (user as any).role === 'admin', [user]);
  const [msg, setMsg] = useState<string>('');
  const [err, setErr] = useState<string>('');
  const [summary, setSummary] = useState<TxSummary|undefined>();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [deps, setDeps] = useState<DepositReq[]>([]);
  const [wrs, setWrs] = useState<WithdrawReq[]>([]);
  // Crash patterns UI state
  const [patterns, setPatterns] = useState<Array<{id:string; name:string; sequence:number[]; active:boolean; createdAt?:string}>>([]);
  const [newPatName, setNewPatName] = useState('');
  const [newPatSeq, setNewPatSeq] = useState('2,2.5,3,1.8,2.2');
  const [patMsg, setPatMsg] = useState('');
  // Simple overrides UI
  const [nextCrash, setNextCrash] = useState<string>('2.0');
  const [boxesOverride, setBoxesOverride] = useState<string>('');

  async function refresh() {
    try {
      const [sum,u,t,dr,wr,cp] = await Promise.all([
        api.get('/admin/transactions/summary'),
        api.get('/admin/users'),
        api.get('/admin/transactions'),
        api.get('/admin/deposit-requests'),
        api.get('/admin/withdraw-requests'),
        api.get('/admin/crash-patterns')
      ]);
      setSummary(sum.data);
      setUsers(u.data);
      setTxs(t.data);
      setDeps(dr.data);
      setWrs(wr.data);
      setPatterns(cp.data || []);
    } catch (e:any) { setErr(e.response?.data?.message || 'Failed to load admin data'); }
  }

  useEffect(()=>{ if(isAdmin) refresh(); }, [isAdmin]);

  // Admin actions
  async function deleteUser(id:string){
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    setErr(''); setMsg('');
    try { await api.delete(`/admin/users/${id}`); setMsg('User deleted'); await refresh(); } catch (e:any){ setErr(e.response?.data?.message || 'Failed to delete user'); }
  }

  async function createPattern(){
    setPatMsg(''); setErr('');
    try {
      const sequence = newPatSeq.split(',').map(s=>Number(s.trim())).filter(n=>!isNaN(n) && n>1);
      if (!newPatName || !sequence.length) { setPatMsg('Enter name and sequence > 1'); return; }
      await api.post('/admin/crash-patterns', { name: newPatName, sequence });
      setPatMsg('Pattern created'); setNewPatName(''); setNewPatSeq('2,2.5,3,1.8,2.2');
      await refresh();
    } catch (e:any) { setErr(e.response?.data?.message || 'Failed to create pattern'); }
  }
  async function activatePattern(id:string){
    setPatMsg(''); setErr('');
    try { await api.post(`/admin/crash-patterns/${id}/activate`); setPatMsg('Pattern activated'); await refresh(); } catch (e:any) { setErr(e.response?.data?.message || 'Failed to activate'); }
  }
  async function savePattern(id:string, name:string, seqStr:string){
    setPatMsg(''); setErr('');
    try {
      const sequence = seqStr.split(',').map(s=>Number(s.trim())).filter(n=>!isNaN(n) && n>1);
      await api.put(`/admin/crash-patterns/${id}`, { name, sequence });
      setPatMsg('Pattern updated'); await refresh();
    } catch (e:any) { setErr(e.response?.data?.message || 'Failed to update'); }
  }

  return <RequireAuth><div className="max-w-6xl mx-auto space-y-8">
    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text">Admin Control Center</h1>
    {!isAdmin && <p className="text-sm text-red-400">Access denied – not an admin.</p>}
    {isAdmin && (
      <div className="space-y-10">
        {/* Crash Controls */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Crash Controls</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3">
              <h3 className="font-semibold">Set Next Crash Value</h3>
              <div className="text-xs text-slate-400">Set the next round crash multiplier (e.g. 2.0)</div>
              <div className="flex gap-2">
                <input value={nextCrash} onChange={e=>setNextCrash(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-600 text-sm" />
                <button onClick={async()=>{ setErr(''); setMsg(''); try { const v = Number(nextCrash); if (!isFinite(v) || v<=1) throw new Error('Enter >1'); await api.post('/admin/overrides/crash', { crashPoint: v }); setMsg('Next crash queued'); } catch(e:any){ setErr(e.response?.data?.message || e.message || 'Failed'); } }} className="px-3 py-2 rounded bg-rose-600 text-sm font-medium">Queue</button>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3 lg:col-span-2">
              <h3 className="font-semibold">Boxes: Set Next Winners</h3>
              <div className="text-xs text-slate-400">Enter 1-3 box indexes (1-10) comma-separated. Multipliers assigned as 5x,3x,2x in order.</div>
              <div className="flex gap-2">
                <input value={boxesOverride} onChange={e=>setBoxesOverride(e.target.value)} placeholder="e.g. 4,7,1" className="w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-600 text-sm" />
                <button onClick={async()=>{ setErr(''); setMsg(''); try { const idxs = boxesOverride.split(',').map(s=>parseInt(s.trim(),10)-1).filter(n=>Number.isInteger(n) && n>=0 && n<=9); if (!idxs.length) throw new Error('Enter 1-3 indexes between 1 and 10'); await api.post('/admin/overrides/boxes', { indexes: idxs }); setMsg('Next boxes winners queued'); setBoxesOverride(''); } catch(e:any){ setErr(e.response?.data?.message || e.message || 'Failed'); } }} className="px-3 py-2 rounded bg-indigo-600 text-sm font-medium">Queue</button>
              </div>
            </div>
          </div>
        </section>

        {/* Crash Patterns */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Crash Patterns</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3">
              <h3 className="font-semibold">Create Pattern</h3>
              <input value={newPatName} onChange={e=>setNewPatName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-600 text-sm" />
              <input value={newPatSeq} onChange={e=>setNewPatSeq(e.target.value)} placeholder="Comma separated e.g. 2,2.5,3" className="w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-600 text-sm" />
              <button onClick={createPattern} className="w-full py-2 rounded bg-cyan-600 text-sm font-medium">Create</button>
              {patMsg && <p className="text-xs text-emerald-400">{patMsg}</p>}
            </div>
            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700 space-y-3">
              <h3 className="font-semibold">Existing Patterns</h3>
              <div className="space-y-3 max-h-80 overflow-auto pr-2">
                {patterns.map(p => {
                  const [name, setName] = [p.name, (v:string)=>{}]; // placeholders not used; inline editing below
                  const seqStrDefault = p.sequence.join(',');
                  let seqStr = seqStrDefault;
                  return (
                    <div key={p.id} className={`rounded border ${p.active? 'border-emerald-500':'border-slate-700'} p-3`}> 
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{p.name} {p.active && <span className="text-[10px] text-emerald-400">(active)</span>}</div>
                        <button onClick={()=>activatePattern(p.id)} className="text-xs px-2 py-1 rounded bg-indigo-600">Activate</button>
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-slate-400">Edit</summary>
                        <div className="mt-2 space-y-2">
                          <input defaultValue={p.name} onBlur={e=>savePattern(p.id, e.target.value, seqStr)} className="w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-600 text-sm" />
                          <input defaultValue={seqStrDefault} onBlur={e=>{ seqStr = e.target.value; savePattern(p.id, p.name, e.target.value); }} className="w-full px-3 py-2 rounded bg-slate-900/60 border border-slate-600 text-sm" />
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Deposit Requests (top) */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Deposit Requests</h2>
          <div className="overflow-x-auto rounded border border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="text-left px-3 py-2">User</th>
                  <th className="text-right px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Method</th>
                  <th className="text-left px-3 py-2">Receipt</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deps.map(d => (
                  <tr key={d.id} className="border-t border-slate-700/50">
                    <td className="px-3 py-2">{d.userId}</td>
                    <td className="px-3 py-2 text-right">{d.amount}</td>
                    <td className="px-3 py-2">{d.method}</td>
                    <td className="px-3 py-2">{d.receiptPath ? (()=>{
                      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                      const href = d.receiptPath.startsWith('/') ? `${base}${d.receiptPath}` : `${base}/uploads/${d.receiptPath}`;
                      return <a href={href} className="text-indigo-300 underline" target="_blank">View</a>;
                    })() : '-'}</td>
                    <td className="px-3 py-2">{d.status}</td>
                    <td className="px-3 py-2 space-x-2">
                      {d.status === 'PENDING' && (
                        <>
                          <button onClick={async()=>{ setErr(''); setMsg(''); try { await api.post(`/admin/deposit-requests/${d.id}/approve`); setMsg('Approved'); await refresh(); } catch(e:any){ setErr(e.response?.data?.message || 'Failed'); } }} className="text-xs px-2 py-1 rounded bg-emerald-600">Approve</button>
                          <button onClick={async()=>{ setErr(''); setMsg(''); try { await api.post(`/admin/deposit-requests/${d.id}/reject`); setMsg('Rejected'); await refresh(); } catch(e:any){ setErr(e.response?.data?.message || 'Failed'); } }} className="text-xs px-2 py-1 rounded bg-red-600">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Withdraw Requests (below Deposit Requests) */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Withdraw Requests</h2>
          <div className="overflow-x-auto rounded border border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="text-left px-3 py-2">User</th>
                  <th className="text-right px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Method</th>
                  <th className="text-left px-3 py-2">Dest</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wrs.map(w => (
                  <tr key={w.id} className="border-t border-slate-700/50">
                    <td className="px-3 py-2">{w.userId}</td>
                    <td className="px-3 py-2 text-right">{w.amount}</td>
                    <td className="px-3 py-2">{w.method}</td>
                    <td className="px-3 py-2">{w.dest || '-'}</td>
                    <td className="px-3 py-2">{w.status}</td>
                    <td className="px-3 py-2 space-x-2">
                      {w.status === 'PENDING' && (
                        <>
                          <button onClick={async()=>{ setErr(''); setMsg(''); try { await api.post(`/admin/withdraw-requests/${w.id}/approve`); setMsg('Approved'); await refresh(); } catch(e:any){ setErr(e.response?.data?.message || 'Failed'); } }} className="text-xs px-2 py-1 rounded bg-emerald-600">Approve</button>
                          <button onClick={async()=>{ setErr(''); setMsg(''); try { await api.post(`/admin/withdraw-requests/${w.id}/reject`); setMsg('Rejected'); await refresh(); } catch(e:any){ setErr(e.response?.data?.message || 'Failed'); } }} className="text-xs px-2 py-1 rounded bg-red-600">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Users */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Users</h2>
            <button onClick={refresh} className="text-xs px-3 py-1 rounded bg-slate-700">Refresh</button>
          </div>
          <div className="overflow-x-auto rounded border border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-right px-3 py-2">Balance</th>
                  <th className="text-left px-3 py-2">Created</th>
                  <th className="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-slate-700/50">
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2 text-right">{u.balance}</td>
                    <td className="px-3 py-2">{new Date(u.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <button onClick={()=>deleteUser(u.id)} className="text-xs px-2 py-1 rounded bg-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Transactions (bottom) */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <div className="overflow-x-auto rounded border border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-right px-3 py-2">Amount</th>
                  <th className="text-left px-3 py-2">Meta</th>
                  <th className="text-left px-3 py-2">At</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(t => (
                  <tr key={t.id} className="border-t border-slate-700/50">
                    <td className="px-3 py-2">{t.type}</td>
                    <td className="px-3 py-2 text-right">{t.amount}</td>
                    <td className="px-3 py-2"><pre className="text-[10px] whitespace-pre-wrap">{t.meta ? JSON.stringify(t.meta) : '-'}</pre></td>
                    <td className="px-3 py-2">{t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )}
  </div></RequireAuth>;
}
