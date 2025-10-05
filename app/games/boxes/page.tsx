'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { RequireAuth } from '../../../components/RequireAuth';
import { useAuthStore } from '../../../lib/authStore';

type Phase = 'waiting' | 'locked' | 'revealed';
interface Winner { idx: number; multiplier: number }
interface BoxesState {
  roundId: number;
  phase: Phase;
  waitingEndsAt: number;
  lockedEndsAt?: number;
  revealedAt?: number;
  settledAt?: number;
  totals: number[];
  counts: number[];
  fair: { serverSeedHash: string; serverSeed?: string; nonce: number };
  winners?: Winner[];
}

export default function BoxesPage() {
  const [amount, setAmount] = useState(10);
  const user = useAuthStore(s=>s.user);
  const updateUserBalance = useAuthStore(s=>s.updateUserBalance);
  const isAdmin = user && (user.email === 'admin@the2win.local');
  const [state, setState] = useState<BoxesState | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const sseRef = useRef<EventSource | null>(null);
  const [tick, setTick] = useState(0);
  const [myBet, setMyBet] = useState<{ roundId:number; boxIndex:number } | null>(null);
  const lastSettledRef = useRef<number | undefined>(undefined);
  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const es = new EventSource(`${base.replace(/\/$/, '')}/boxes/stream`);
    sseRef.current = es;
    es.addEventListener('update', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.state) setState(payload.state);
      } catch {}
    });
    es.onerror = () => { es.close(); setTimeout(() => {
      if (!sseRef.current || sseRef.current.readyState === EventSource.CLOSED) {
        sseRef.current = new EventSource(`${base.replace(/\/$/, '')}/boxes/stream`);
      }
    }, 3000); };
    return () => { es.close(); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 250);
    return () => clearInterval(id);
  }, []);

  // When payouts settle on server, refresh balance once
  useEffect(() => {
    if (!state?.settledAt) return;
    if (lastSettledRef.current === state.settledAt) return;
    lastSettledRef.current = state.settledAt;
    (async () => {
      try {
        const res = await api.get('/wallet/balance');
        if (typeof res.data?.balance === 'number') updateUserBalance(res.data.balance);
      } catch {}
    })();
  }, [state?.settledAt]);

  // Reset local bet and selection when a new round starts
  useEffect(() => {
    if (!state) return;
    setSelected(null);
    if (myBet && myBet.roundId !== state.roundId) setMyBet(null);
  }, [state?.roundId]);

  const canBet = state?.phase === 'waiting';
  const locked = state?.phase === 'locked';
  const revealed = state?.phase === 'revealed';
  const now = Date.now();
  const countdown = canBet && state ? Math.max(0, Math.ceil((state.waitingEndsAt - now)/1000)) : 0;
  const lockedCountdown = locked && state?.lockedEndsAt ? Math.max(0, Math.ceil((state.lockedEndsAt - now)/1000)) : 0;

  async function placeBet() {
    setError('');
    if (!canBet) { setError('Betting window closed'); return; }
    if (selected === null) { setError('Pick a box first'); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setError('Enter a valid amount'); return; }
    if (amount < 20) { setError('Minimum bet is 20'); return; }
    setPlacing(true);
    const safety = setTimeout(() => setPlacing(false), 8000);
    try {
      const res = await api.post('/boxes/bet', { amount, boxIndex: selected });
      if (typeof res.data?.balance === 'number') updateUserBalance(res.data.balance);
      if (state) setMyBet({ roundId: state.roundId, boxIndex: selected });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Bet failed');
    } finally { clearTimeout(safety); setPlacing(false); }
  }

  function isWinning(i: number) { return Array.isArray(state?.winners) && state!.winners!.some(w=>w.idx===i); }
  function winMult(i: number) { return Array.isArray(state?.winners) ? state!.winners!.find(w=>w.idx===i)?.multiplier : undefined; }

  return <RequireAuth><div className="max-w-5xl mx-auto space-y-6">
    <div className="text-right">
      <button onClick={()=>setShowHowTo(true)} className="text-slate-300 hover:text-white" title="How to play">ℹ️</button>
    </div>

    <div className="glass rounded-2xl p-6 space-y-8 shadow-2xl shadow-rose-500/10">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-800/30 rounded-xl">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Round</div>
            <div className="text-lg font-bold text-amber-300">#{state?.roundId}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Phase</div>
            <div className="text-lg font-bold text-slate-200">{canBet ? 'Betting' : locked ? 'Locked' : revealed ? 'Revealed' : '—'}</div>
          </div>
          {isAdmin && (
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Nonce</div>
              <div className="text-lg font-bold text-rose-300">{state?.fair.nonce}</div>
            </div>
          )}
        </div>
        <div className="text-sm text-slate-300">
          {canBet && <>Time remaining: <span className="text-amber-300 font-mono text-xl">{countdown}s</span></>}
          {locked && <>Revealing in: <span className="text-yellow-300 font-mono text-xl">{lockedCountdown}s</span></>}
          {revealed && <span className="text-slate-400">Next round soon…</span>}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => {
              const picked = selected === i;
              const highlight = revealed && isWinning(i);
              const isMine = !!(myBet && state && myBet.roundId === state.roundId && myBet.boxIndex === i);
              return (
                <div key={i} onClick={()=> canBet && !myBet && setSelected(i)} className={`relative aspect-square rounded-xl flex items-center justify-center text-lg font-bold transition-all select-none ${
                  highlight ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-slate-900 shadow-lg shadow-amber-500/30' : 'bg-slate-800/70 text-slate-200 hover:bg-slate-700/70'
                } ${picked ? 'ring-4 ring-rose-400/70 scale-105' : ''} ${myBet ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <span>{i+1}</span>
                  {highlight && (
                    <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-600 text-slate-900 shadow">{winMult(i)}x</div>
                  )}
                  {isMine && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/90 text-white shadow">My bet</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Amount</label>
                <input type="number" min={20} value={amount} disabled={!canBet || placing} onChange={e=>setAmount(parseFloat(e.target.value))} className="bg-slate-800/60 border border-slate-600 rounded px-3 py-2 w-full sm:w-40 md:w-32 focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div className="flex flex-wrap gap-1">
                {[20,50,100,500,1000].map(v => (
                  <button key={v} type="button" disabled={!canBet || placing} onClick={()=>setAmount(v)} className="text-[11px] px-2 py-1 rounded bg-slate-900/60 border border-slate-700 hover:border-slate-500">
                    {v}
                  </button>
                ))}
              </div>
              <div className="text-sm text-slate-400">
                {canBet ? (
                  myBet && state && myBet.roundId === state.roundId
                    ? `You placed a bet on Box ${myBet.boxIndex+1}. Good luck!`
                    : (selected !== null ? `Ready to bet on Box ${selected+1}` : 'Pick a box to bet')
                ) : locked ? 'Revealing shortly…' : 'Round complete'}
              </div>
              {myBet && state && myBet.roundId === state.roundId ? (
                <button disabled className="px-6 py-3 rounded bg-slate-700 font-semibold opacity-60 cursor-not-allowed w-full sm:w-auto">
                  Bet placed
                </button>
              ) : (
                <button disabled={!canBet || selected===null || placing || amount < 20} onClick={placeBet} className="px-6 py-3 rounded bg-gradient-to-r from-rose-600 to-amber-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform w-full sm:w-auto">
                  {placing ? 'Placing…' : (selected !== null ? `Place Bet on Box ${selected+1}` : 'Place Bet')}
                </button>
              )}
            </div>
            {error && <div className="text-sm text-red-400">{error}</div>}
            {state && (
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2">
                <p className="text-sm">Round <span className="font-mono">#{state.roundId}</span> fairness:</p>
                <div className="text-xs font-mono break-all space-y-1">
                  <div><span className="text-slate-400">Seed Hash:</span> {state.fair.serverSeedHash}</div>
                  <div><span className="text-slate-400">Server Seed:</span> {isAdmin ? (state.fair.serverSeed || '—') : '********'}</div>
                  <div><span className="text-slate-400">Nonce:</span> {state.fair.nonce}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
    {showHowTo && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowHowTo(false)}>
        <div onClick={e=>e.stopPropagation()} className="max-w-md w-full bg-slate-900 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">How to play Boxes</h3>
            <button onClick={()=>setShowHowTo(false)} className="text-slate-300 hover:text-white">✕</button>
          </div>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
            <li>Pick one of the 10 boxes and place your bet during the betting window.</li>
            <li>After betting closes, three winning boxes are revealed with multipliers 2x, 3x, and 5x.</li>
            <li>Winners are chosen with fairness in mind. Earn coins by hitting a winning box.</li>
          </ul>
          <div className="text-xs text-slate-400 mt-3">Tip: You can earn coins by winning rounds and through events/promotions.</div>
        </div>
      </div>
    )}
  </div></RequireAuth>;
}
