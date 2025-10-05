'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { RequireAuth } from '../../../components/RequireAuth';
import { useAuthStore } from '../../../lib/authStore';

interface CrashState {
  roundId: number;
  phase: 'waiting' | 'locked' | 'running' | 'crashed';
  multiplier: number;
  waitingEndsAt: number;
  lockedEndsAt?: number;
  startTime?: number;
  crashTime?: number;
  nextRoundStartsAt?: number;
  fair: { serverSeedHash: string; serverSeed?: string; crashPoint?: number; nonce: number };
  bets: { userId: string; amount: number; cashedOut: boolean; cashoutMultiplier?: number; slot?: 'A' | 'B' }[];
}

export default function CrashGamePage() {
  const [state, setState] = useState<CrashState | null>(null);
  const user = useAuthStore(s=>s.user);
  const isAdmin = user && (user.email === 'admin@the2win.local');
  const [history, setHistory] = useState<{ roundId:number; crashPoint:number }[]>([]);
  const [placingA, setPlacingA] = useState(false);
  const [placingB, setPlacingB] = useState(false);
  const [cashingA, setCashingA] = useState(false);
  const [cashingB, setCashingB] = useState(false);
  const [error, setError] = useState('');
  const sseRef = useRef<EventSource | null>(null);
  const [tick, setTick] = useState(0); // forces re-render for countdown/animations
  const [amountA, setAmountA] = useState(10);
  const [amountB, setAmountB] = useState(10);
  const [showHistory, setShowHistory] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [topPlayersValue, setTopPlayersValue] = useState<number>(()=> Math.floor(7000 + Math.random()*8000));
  // Optimistic local bet flags to toggle buttons immediately on success
  const [localBets, setLocalBets] = useState<{ A?: { roundId: number; cashedOut?: boolean }, B?: { roundId: number; cashedOut?: boolean } }>({});

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const es = new EventSource(`${base.replace(/\/$/, '')}/crash/stream`);
    sseRef.current = es;
    es.addEventListener('update', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.state) setState(payload.state);
        if (payload.history) setHistory(payload.history);
      } catch {}
    });
    es.onerror = () => {
      es.close();
      // attempt reconnect after short delay
      setTimeout(() => {
        if (!sseRef.current || sseRef.current.readyState === EventSource.CLOSED) {
          sseRef.current = new EventSource(`${base.replace(/\/$/, '')}/crash/stream`);
        }
      }, 3000);
    };
    return () => { es.close(); };
  }, []);

  // polling removed; history now streamed via SSE

  // heartbeat to update countdown/progress every 200ms
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 200);
    return () => clearInterval(id);
  }, []);

  // When a new round starts, clear local optimistic flags for previous rounds
  useEffect(() => {
    if (!state) return;
    setLocalBets(prev => {
      const next = { ...prev };
      if (prev.A && prev.A.roundId !== state.roundId) next.A = undefined;
      if (prev.B && prev.B.roundId !== state.roundId) next.B = undefined;
      return next;
    });
    // Randomize top players value each round between 7000-15000
    setTopPlayersValue(Math.floor(7000 + Math.random()*8000));
  }, [state?.roundId]);

  function normalizeAmount(v: number) {
    // Guard against NaN/Infinity and negatives; keep two decimals if any
    if (!isFinite(v) || v <= 0) return null;
    if (v < 20) return null;
    return Math.round(v * 100) / 100;
  }

  async function placeBetA() {
    setError('');
    const amt = normalizeAmount(amountA);
    if (!canBet) { setError('Betting window closed'); return; }
    if (amt === null) { setError('Enter a valid amount for Bet A'); return; }
    setPlacingA(true);
    // Safety: auto-clear placing flag in case of unexpected hang
    const safety = setTimeout(() => setPlacingA(false), 8000);
    try {
      const res = await api.post('/crash/bet', { amount: amt, slot: 'A' });
      if (typeof res.data?.balance === 'number') useAuthStore.getState().updateUserBalance(res.data.balance);
      // optimistic local flag so UI toggles immediately
      if (state?.roundId) setLocalBets(prev => ({ ...prev, A: { roundId: state.roundId, cashedOut: false } }));
    }
    catch (e:any){ setError(e.response?.data?.message || e.message || 'Bet A failed'); }
    finally { clearTimeout(safety); setPlacingA(false); }
  }
  async function placeBetB() {
    setError('');
    const amt = normalizeAmount(amountB);
    if (!canBet) { setError('Betting window closed'); return; }
    if (amt === null) { setError('Enter a valid amount for Bet B'); return; }
    setPlacingB(true);
    const safety = setTimeout(() => setPlacingB(false), 8000);
    try {
      const res = await api.post('/crash/bet', { amount: amt, slot: 'B' });
      if (typeof res.data?.balance === 'number') useAuthStore.getState().updateUserBalance(res.data.balance);
      if (state?.roundId) setLocalBets(prev => ({ ...prev, B: { roundId: state.roundId, cashedOut: false } }));
    }
    catch (e:any){ setError(e.response?.data?.message || e.message || 'Bet B failed'); }
    finally { clearTimeout(safety); setPlacingB(false); }
  }
  async function cashOutA() {
    setError(''); setCashingA(true);
    try {
      const res = await api.post('/crash/cashout', { slot: 'A' });
      if (typeof res.data?.balance === 'number') useAuthStore.getState().updateUserBalance(res.data.balance);
      if (state?.roundId) setLocalBets(prev => prev.A ? { ...prev, A: { ...prev.A, cashedOut: true } } : prev);
    }
    catch (e:any){ setError(e.response?.data?.message || 'Cashout A failed'); }
    finally { setCashingA(false); }
  }
  async function cashOutB() {
    setError(''); setCashingB(true);
    try {
      const res = await api.post('/crash/cashout', { slot: 'B' });
      if (typeof res.data?.balance === 'number') useAuthStore.getState().updateUserBalance(res.data.balance);
      if (state?.roundId) setLocalBets(prev => prev.B ? { ...prev, B: { ...prev.B, cashedOut: true } } : prev);
    }
    catch (e:any){ setError(e.response?.data?.message || 'Cashout B failed'); }
    finally { setCashingB(false); }
  }
  const canBet = state?.phase === 'waiting';
  const locked = state?.phase === 'locked';
  const isRunning = state?.phase === 'running';
  const crashed = state?.phase === 'crashed';

  const now = Date.now(); // uses tick to refresh
  const countdown = canBet ? Math.max(0, Math.ceil((state!.waitingEndsAt - now)/1000)) : 0;
  const lockedCountdown = locked && state?.lockedEndsAt ? Math.max(0, Math.ceil((state.lockedEndsAt - now)/1000)) : 0;
  const nextRoundCountdown = crashed && state?.nextRoundStartsAt ? Math.max(0, Math.ceil((state.nextRoundStartsAt - now)/1000)) : 0;

  function colorForMultiplier(m?: number) {
    if (!m) return 'text-slate-300';
    if (m < 2) return 'text-green-400';
    if (m < 25) return 'text-blue-400';
    return 'text-red-400';
  }

  // Determine current user's bets per slot for button toggling
  const myId = user?.id;
  const myBetA_sse = state?.bets.find(b => b.userId === myId && (b.slot ?? 'A') === 'A');
  const myBetB_sse = state?.bets.find(b => b.userId === myId && (b.slot ?? 'B') === 'B');
  const hasLocalA = !!(localBets.A && state && localBets.A.roundId === state.roundId);
  const hasLocalB = !!(localBets.B && state && localBets.B.roundId === state.roundId);
  const myBetA = myBetA_sse || (hasLocalA ? { userId: myId || '', amount: amountA, cashedOut: !!localBets.A?.cashedOut, cashoutMultiplier: undefined, slot: 'A' as const } : undefined);
  const myBetB = myBetB_sse || (hasLocalB ? { userId: myId || '', amount: amountB, cashedOut: !!localBets.B?.cashedOut, cashoutMultiplier: undefined, slot: 'B' as const } : undefined);

  return <RequireAuth><div className="max-w-4xl mx-auto space-y-6">

    <div className="glass rounded-2xl p-6 space-y-6 shadow-2xl shadow-indigo-500/10">
      {/* Game Stats Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-800/30 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Round</div>
            <div className="text-lg font-bold text-indigo-300">#{state?.roundId}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Players</div>
            <div className="text-lg font-bold text-cyan-300">{state?.bets.length || 0}</div>
          </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Top Players</div>
              <div className="text-lg font-bold text-green-300">{topPlayersValue}</div>
            </div>
          {isAdmin && (
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Nonce</div>
              <div className="text-lg font-bold text-purple-300">{state?.fair.nonce}</div>
            </div>
          )}
        </div>
        {/* History chips with better styling */}
        <div className="flex flex-wrap gap-1">
          {history.slice(0, 8).map(h => {
            const cp = typeof h.crashPoint === 'number' ? h.crashPoint : Number(h.crashPoint);
            return (
              <div key={h.roundId} className={`px-2 py-1 rounded-full text-xs font-semibold bg-slate-800/70 border ${colorForMultiplier(cp)} transition-all hover:scale-105`}>
                {isFinite(cp) ? cp.toFixed(2) : '—'}x
              </div>
            );
          })}
          {!history.length && <span className="text-xs text-slate-500">Loading history...</span>}
        </div>
          <button onClick={()=>setShowHowTo(true)} className="ml-auto text-slate-300 hover:text-white" title="How to play">ℹ️</button>
      </div>

      <div className="text-center space-y-4">
  {/* Enhanced game canvas */}
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          {/* Multiplier display with glow effect */}
          <div className={`absolute top-4 right-4 text-6xl font-black transition-all duration-300 ${
            crashed ? 'text-red-400 animate-pulse' : 
            isRunning ? 'text-white animate-glow' : 
            'text-indigo-300'
          } drop-shadow-2xl`}>
            {state?.multiplier.toFixed(2)}x
          </div>
          
          {/* Flight path visualization */}
          <div className="absolute inset-0 flex items-end justify-start p-6">
            <div className="relative w-full h-full">
              {/* Flight trail */}
              {isRunning && (
                <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-indigo-400/30 to-cyan-400/30 rounded-full animate-shimmer" />
              )}
              
              {/* Enhanced plane */}
              <div
                className={`plane transition-all duration-500 ${crashed ? 'crash animate-bounce' : isRunning ? 'animate-float' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${Math.min(95, (state?.multiplier || 1) / (state?.fair.crashPoint || 10) * 100)}%`,
                  bottom: `${Math.min(85, (state?.multiplier || 1) * 3)}%`,
                  transform: 'translate(-50%, 50%)'
                }}
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 border-2 border-white/50 shadow-2xl flex items-center justify-center text-lg transition-all duration-300 ${
                  isRunning ? 'animate-glow' : ''
                }`}>
                  <span className="text-slate-900 font-bold">✈️</span>
                </div>
                {/* Plane glow effect */}
                <div className="absolute inset-0 rounded-full bg-indigo-400/30 blur-xl animate-pulse" />
              </div>
              
              {/* Enhanced crash explosion */}
              {crashed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-red-500/30 border-2 border-red-400/60 backdrop-blur-sm animate-ping" />
                    <div className="absolute inset-0 w-32 h-32 rounded-full bg-orange-500/20 animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">💥</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Enhanced progress bar with phase indication */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wide">
            <span>Phase Progress</span>
            <span className="flex items-center gap-2">{canBet ? 'Betting' : locked ? 'Locked' : isRunning ? 'Flying' : 'Crashed'}
              <button onClick={()=>setShowHistory(true)} className="text-slate-300 hover:text-white" title="Full history">
                ⋯
              </button>
            </span>
          </div>
          <div className="relative h-3 bg-slate-800/60 rounded-full overflow-hidden">
            {(() => {
              const nowTs = Date.now();
              let pct = 0;
              let bgColor = 'bg-indigo-500';
              
              if (canBet && state) {
                const total = 5000;
                const elapsed = 5000 - Math.max(0, state.waitingEndsAt - nowTs);
                pct = Math.min(100, (elapsed / total) * 100);
                bgColor = 'bg-green-500';
              } else if (locked && state?.lockedEndsAt) {
                const total = 3000;
                const elapsed = 3000 - Math.max(0, state.lockedEndsAt - nowTs);
                pct = Math.min(100, (elapsed / total) * 100);
                bgColor = 'bg-yellow-500';
              } else if (isRunning && state?.fair.crashPoint) {
                pct = Math.min(100, (state.multiplier / state.fair.crashPoint) * 100);
                bgColor = 'bg-cyan-500';
              } else if (crashed) {
                pct = 100;
                bgColor = 'bg-red-500';
              }
              
              return (
                <div 
                  className={`h-full ${bgColor} transition-all duration-300 relative overflow-hidden`}
                  style={{ width: pct + '%' }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                </div>
              );
            })()}
          </div>
        </div>
        
        {/* Enhanced status message with countdown styling */}
        <div className="text-center p-4 bg-slate-800/30 rounded-lg">
          {canBet && (
            <div className="space-y-1">
              <p className="text-green-400 font-semibold text-lg">🎯 Place Your Bets!</p>
              <p className="text-slate-300">Time remaining: <span className="text-green-300 font-mono text-xl">{countdown}s</span></p>
            </div>
          )}
          {locked && (
            <div className="space-y-1">
              <p className="text-yellow-400 font-semibold text-lg">🔒 Betting Locked</p>
              <p className="text-slate-300">Preparing for takeoff: <span className="text-yellow-300 font-mono text-xl">{lockedCountdown}s</span></p>
            </div>
          )}
          {isRunning && (
            <div className="space-y-1">
              <p className="text-cyan-400 font-semibold text-lg animate-pulse">🚀 In Flight!</p>
              <p className="text-slate-300">Cash out before it crashes!</p>
            </div>
          )}
          {crashed && (
            <div className="space-y-1">
              <p className="text-red-400 font-semibold text-lg">💥 Crashed!</p>
              <p className="text-slate-300">
                {isAdmin ? (
                  <>Crashed at <span className="text-red-300 font-bold">{state?.fair.crashPoint?.toFixed(2)}x</span></>
                ) : (
                  <>Round ended</>
                )}
                {nextRoundCountdown > 0 && (
                  <span> • Next round: <span className="text-indigo-300 font-mono">{nextRoundCountdown}s</span></span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      {/* Dual Betting Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/40">
          <h3 className="font-semibold mb-2">Bet A</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Amount</label>
    <input type="number" value={Number.isFinite(amountA) ? amountA : '' as any} disabled={!canBet || !!myBetA || placingA}
      onChange={e=>{
        const v = Number(e.target.value);
        setAmountA(Number.isFinite(v) ? v : 0);
      }}
                     className="bg-slate-800/60 border border-slate-600 rounded px-3 py-2 w-full sm:w-40 md:w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="mt-2 grid grid-cols-5 gap-1">
                {[20,50,100,500,1000].map(v => (
                  <button key={v} type="button" disabled={!canBet || !!myBetA || placingA} onClick={()=>setAmountA(v)} className="text-[11px] px-2 py-1 rounded bg-slate-900/60 border border-slate-700 hover:border-slate-500">
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {myBetA && !myBetA.cashedOut ? (
              <button disabled={!isRunning || cashingA} onClick={cashOutA}
                      className="px-6 py-3 rounded bg-gradient-to-r from-green-600 to-emerald-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform w-full sm:w-auto">
                {isRunning ? (cashingA ? 'Cashing…' : 'Cash Out A') : 'Cash Out A'}
              </button>
            ) : myBetA && myBetA.cashedOut ? (
              <button disabled className="px-6 py-3 rounded bg-slate-700 font-semibold opacity-60 cursor-not-allowed w-full sm:w-auto">
                Cashed {myBetA.cashoutMultiplier?.toFixed(2)}x
              </button>
            ) : (
              <button disabled={!canBet || placingA || amountA < 20} onClick={placeBetA}
                      className="px-6 py-3 rounded bg-gradient-to-r from-indigo-600 to-cyan-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform w-full sm:w-auto">
                {placingA ? 'Placing…' : 'Place Bet A'}
              </button>
            )}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/40">
          <h3 className="font-semibold mb-2">Bet B</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Amount</label>
    <input type="number" value={Number.isFinite(amountB) ? amountB : '' as any} disabled={!canBet || !!myBetB || placingB}
      onChange={e=>{
        const v = Number(e.target.value);
        setAmountB(Number.isFinite(v) ? v : 0);
      }}
                     className="bg-slate-800/60 border border-slate-600 rounded px-3 py-2 w-full sm:w-40 md:w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="mt-2 grid grid-cols-5 gap-1">
                {[20,50,100,500,1000].map(v => (
                  <button key={v} type="button" disabled={!canBet || !!myBetB || placingB} onClick={()=>setAmountB(v)} className="text-[11px] px-2 py-1 rounded bg-slate-900/60 border border-slate-700 hover:border-slate-500">
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {myBetB && !myBetB.cashedOut ? (
              <button disabled={!isRunning || cashingB} onClick={cashOutB}
                      className="px-6 py-3 rounded bg-gradient-to-r from-green-600 to-emerald-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform w-full sm:w-auto">
                {isRunning ? (cashingB ? 'Cashing…' : 'Cash Out B') : 'Cash Out B'}
              </button>
            ) : myBetB && myBetB.cashedOut ? (
              <button disabled className="px-6 py-3 rounded bg-slate-700 font-semibold opacity-60 cursor-not-allowed w-full sm:w-auto">
                Cashed {myBetB.cashoutMultiplier?.toFixed(2)}x
              </button>
            ) : (
              <button disabled={!canBet || placingB || amountB < 20} onClick={placeBetB}
                      className="px-6 py-3 rounded bg-gradient-to-r from-indigo-600 to-cyan-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform w-full sm:w-auto">
                {placingB ? 'Placing…' : 'Place Bet B'}
              </button>
            )}
          </div>
        </div>
      </div>


      {showHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowHistory(false)}>
          <div onClick={e=>e.stopPropagation()} className="max-w-3xl w-full max-h-[80vh] overflow-y-auto bg-slate-900 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Full Crash History</h3>
              <button onClick={()=>setShowHistory(false)} className="text-slate-300 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs text-slate-400">
              <div className="font-semibold">Round</div>
              <div className="font-semibold">Crashed</div>
              <div className="font-semibold">At</div>
              <div className="font-semibold">Time</div>
              {history.map(h => (
                <>
                  <div>#{h.roundId}</div>
                  <div className="font-mono">{typeof h.crashPoint==='number' ? h.crashPoint.toFixed(2) : String(h.crashPoint)}</div>
                  <div>{/* placeholder; if backend supplies timestamp use it */}</div>
                  <div></div>
                </>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {isAdmin && (
          <div>
            <h2 className="font-semibold mb-2">Fairness</h2>
            <div className="space-y-2 text-xs bg-slate-800/40 rounded p-3 font-mono break-all">
              <div><span className="text-slate-400">Seed Hash:</span> {state?.fair.serverSeedHash}</div>
              <div><span className="text-slate-400">Server Seed:</span> {state?.fair.serverSeed || '—'}</div>
              <div><span className="text-slate-400">Crash Point:</span> {state?.fair.crashPoint?.toFixed(2)}x</div>
              <div className="pt-2 space-y-2">
                <p className="text-xs text-indigo-300 font-semibold">Admin Controls (Next Round)</p>
                <div className="flex gap-2 flex-wrap">
                  <input placeholder="Override Multiplier" className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1 text-xs" />
                  <button className="px-3 py-1 rounded bg-indigo-600 text-xs">Queue</button>
                </div>
                <p className="text-[10px] text-slate-500">Placeholder – backend endpoint needed to set next crash point.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History moved into canvas overlay */}
    </div>
    {showHowTo && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowHowTo(false)}>
        <div onClick={e=>e.stopPropagation()} className="max-w-md w-full bg-slate-900 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">How to play Crash</h3>
            <button onClick={()=>setShowHowTo(false)} className="text-slate-300 hover:text-white">✕</button>
          </div>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
            <li>Enter your bet amount for A or B during the betting window.</li>
            <li>When the flight starts, cash out before it crashes to win coins.</li>
            <li>Higher multiplier increases risk. Play responsibly.</li>
          </ul>
        </div>
      </div>
    )}
    {isAdmin && <p className="text-xs text-slate-500">Prototype crash logic with deterministic fairness (seed hash + server seed displayed).</p>}
  </div></RequireAuth>;
}
