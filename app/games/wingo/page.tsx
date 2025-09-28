'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { RequireAuth } from '../../../components/RequireAuth';
import { useAuthStore } from '../../../lib/authStore';

interface WingoBet { userId: string; amount: number; color: 'GREEN'|'PURPLE'|'RED'; won?: boolean; payout?: number }
interface WingoState {
  roundId: number;
  phase: 'betting' | 'revealing';
  bettingEndsAt: number;
  revealAt: number;
  result?: { color: 'GREEN'|'PURPLE'|'RED'; multiplier: number };
  fair: { serverSeedHash: string; serverSeed?: string; nonce: number };
  bets: WingoBet[];
  history?: { roundId:number; color:string; multiplier:number }[];
}

const COLOR_INFO: Record<string, { label: string; multiplier: number; gradient: string; ring: string }> = {
  GREEN: { label: 'Green', multiplier: 2, gradient: 'from-emerald-500 to-green-600', ring: 'ring-emerald-400/70' },
  PURPLE: { label: 'Purple', multiplier: 3, gradient: 'from-fuchsia-500 to-purple-600', ring: 'ring-fuchsia-400/70' },
  RED: { label: 'Red', multiplier: 5, gradient: 'from-rose-500 to-red-600', ring: 'ring-rose-400/70' },
};

export default function WingoPage() {
  const [state, setState] = useState<WingoState | null>(null);
  const user = useAuthStore(s=>s.user);
  const isAdmin = user && (user.email === 'admin@the2win.local');
  const [amount, setAmount] = useState(10);
  const [color, setColor] = useState<'GREEN'|'PURPLE'|'RED'>('GREEN');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const sseRef = useRef<EventSource | null>(null);
  const [history, setHistory] = useState<{ roundId:number; color:string; multiplier:number }[]>([]);

  useEffect(() => {
    // Initial fetch so UI doesn't appear empty if SSE slight delay
    (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const r = await fetch(base.replace(/\/$/, '') + '/wingo/state');
        if (r.ok) {
          const data = await r.json();
            if (data?.state) {
              setState(data.state);
              if (data.state.history) setHistory(data.state.history);
            }
        }
      } catch {}
    })();
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const es = new EventSource(`${base.replace(/\/$/, '')}/wingo/stream`);
    sseRef.current = es;
    es.addEventListener('update', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.state) {
          setState(payload.state);
          if (payload.state.history) setHistory(payload.state.history);
        }
        if (payload.history) setHistory(payload.history);
      } catch {}
    });
    es.onerror = () => {
      es.close();
      setTimeout(() => {
        if (!sseRef.current || sseRef.current.readyState === EventSource.CLOSED) {
          sseRef.current = new EventSource(`${base.replace(/\/$/, '')}/wingo/stream`);
        }
      }, 3000);
    };
    return () => { es.close(); };
  }, []);

  const betting = state?.phase === 'betting';
  const revealing = state?.phase === 'revealing';
  const now = Date.now();
  const bettingCountdown = betting ? Math.max(0, Math.ceil((state!.bettingEndsAt - now)/1000)) : 0;
  const revealCountdown = revealing ? Math.max(0, Math.ceil((state!.revealAt - now)/1000)) : 0;

  async function placeBet() {
    if (!betting) return;
    setError('');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    setPlacing(true);
    try {
      await api.post('/wingo/bet', { amount: amt, selection: color });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Bet failed');
    } finally { setPlacing(false); }
  }

  function chipClasses(c: 'GREEN'|'PURPLE'|'RED') {
    const active = color === c;
    const info = COLOR_INFO[c];
    return `relative px-4 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-br ${info.gradient} shadow-lg transition-all hover:scale-105 ${active ? 'ring-4 '+info.ring+' scale-105' : 'opacity-80'}`;
  }

  function resultPill(h: {roundId:number; multiplier:number; color:string}) {
    const info = COLOR_INFO[h.color];
    return <div key={h.roundId} className={`px-2 py-1 rounded-full text-xs font-semibold bg-slate-800/70 border border-slate-700 flex items-center gap-1`}
      style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
      <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-br ${info.gradient}`}></span>
      <span className="font-mono">{h.multiplier}x</span>
    </div>;
  }

  return <RequireAuth><div className="max-w-4xl mx-auto space-y-6">
    <div className="text-center space-y-2">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-fuchsia-400 to-rose-400 text-transparent bg-clip-text animate-gradient">🎨 Wingo Colors</h1>
      <p className="text-slate-400">Bet on a color before the timer ends. Higher risk, higher reward.</p>
    </div>

    <div className="glass rounded-2xl p-6 space-y-6 shadow-2xl shadow-emerald-500/10">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-800/30 rounded-xl">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Round</div>
            <div className="text-lg font-bold text-emerald-300">#{state?.roundId}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Players</div>
            <div className="text-lg font-bold text-fuchsia-300">{state?.bets.length || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Nonce</div>
            <div className="text-lg font-bold text-rose-300">{state?.fair.nonce}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {history.slice(0,10).map(h=>resultPill(h))}
          {!history.length && <span className="text-xs text-slate-500">Loading history...</span>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="relative h-56 md:h-64 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 70%)' }} />
            <div className="space-y-4 text-center">
              {betting && <div className="space-y-1">
                <p className="text-emerald-400 font-semibold text-xl">Place Your Bets</p>
                <p className="text-slate-300">Time left: <span className="text-emerald-300 font-mono text-2xl">{bettingCountdown}s</span></p>
              </div>}
              {revealing && <div className="space-y-1">
                <p className="text-fuchsia-400 font-semibold text-xl animate-pulse">Revealing...</p>
                <p className="text-slate-300">Outcome in <span className="text-fuchsia-300 font-mono text-2xl">{revealCountdown}s</span></p>
              </div>}
              {state?.result && <div className="space-y-1">
                <p className="text-slate-300">Result:</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${COLOR_INFO[state.result.color].gradient} font-bold text-white shadow-lg animate-bounce`}>{COLOR_INFO[state.result.color].label} {state.result.multiplier}x</div>
              </div>}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wide">
              <span>Round Progress</span>
              <span>{betting ? 'Betting' : revealing ? 'Revealing' : state?.result ? 'Finished' : ''}</span>
            </div>
            <div className="relative h-3 bg-slate-800/60 rounded-full overflow-hidden">
              {(() => {
                if (!state) return null;
                const nowTs = Date.now();
                let pct = 0; let colorBar = 'bg-emerald-500';
                if (betting) {
                  const total = state.bettingEndsAt - (state.bettingEndsAt - 30000); // 30s window
                  const elapsed = total - Math.max(0, state.bettingEndsAt - nowTs);
                  pct = Math.min(100, (elapsed / total) * 100);
                  colorBar = 'bg-emerald-500';
                } else if (revealing) {
                  const total = state.revealAt - state.bettingEndsAt;
                  const elapsed = total - Math.max(0, state.revealAt - nowTs);
                  pct = Math.min(100, (elapsed / total) * 100);
                  colorBar = 'bg-fuchsia-500';
                } else if (state.result) { pct = 100; colorBar = 'bg-rose-500'; }
                return <div className={`h-full ${colorBar} transition-all duration-300`} style={{ width: pct + '%' }}><div className="absolute inset-0 bg-white/20 animate-shimmer" /></div>;
              })()}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wide text-slate-400">Amount</label>
            <input type="number" value={Number.isFinite(amount) ? amount : '' as any} disabled={!betting || placing} onChange={e=>{ const v = Number(e.target.value); setAmount(Number.isFinite(v) ? v : 0); }} className="bg-slate-800/60 border border-slate-600 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <div className="grid grid-cols-3 gap-3">
              {(['GREEN','PURPLE','RED'] as const).map(c => (
                <button key={c} disabled={!betting || placing} onClick={()=>setColor(c)} className={chipClasses(c)}>
                  <div className="flex flex-col items-center leading-tight">
                    <span>{COLOR_INFO[c].label}</span>
                    <span className="text-[10px] opacity-80">{COLOR_INFO[c].multiplier}x</span>
                  </div>
                </button>
              ))}
            </div>
            <button disabled={!betting || placing} onClick={placeBet} className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform">
              {placing ? 'Placing...' : 'Place Bet'}
            </button>
            {error && <div className="text-sm text-red-400">{error}</div>}
          </div>
          <div>
            <h2 className="font-semibold mb-2">Current Bets</h2>
            <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
              {state?.bets.map(b => (
                <div key={b.userId + b.color} className="flex justify-between gap-2 bg-slate-800/50 rounded px-3 py-2">
                  <span>{b.userId.slice(0,6)}…</span>
                  <span className="font-mono">{b.amount}</span>
                  <span className={`font-semibold ${b.color === 'GREEN' ? 'text-emerald-400' : b.color === 'PURPLE' ? 'text-fuchsia-400' : 'text-rose-400'}`}>{COLOR_INFO[b.color].multiplier}x</span>
                  <span>{b.won === undefined ? (state?.result ? '—' : '…') : b.won ? 'WIN' : 'LOSE'}</span>
                </div>
              ))}
              {!state?.bets.length && <p className="text-slate-500">No bets yet.</p>}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Fairness</h2>
            <div className="space-y-2 text-xs bg-slate-800/40 rounded p-3 font-mono break-all">
              <div><span className="text-slate-400">Seed Hash:</span> {state?.fair.serverSeedHash}</div>
              <div><span className="text-slate-400">Server Seed:</span> {isAdmin ? state?.fair.serverSeed : '********'}</div>
              <div><span className="text-slate-400">Nonce:</span> {state?.fair.nonce}</div>
            </div>
            {isAdmin && <div className="mt-3 space-y-2">
              <p className="text-xs text-fuchsia-300 font-semibold">Admin Override (Next Round)</p>
              <div className="flex gap-2 flex-wrap">
                <select className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1 text-xs">
                  <option value="GREEN">GREEN 2x</option>
                  <option value="PURPLE">PURPLE 3x</option>
                  <option value="RED">RED 5x</option>
                </select>
                <button className="px-3 py-1 rounded bg-fuchsia-600 text-xs">Queue</button>
              </div>
              <p className="text-[10px] text-slate-500">Placeholder – add backend to persist override.</p>
            </div>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Recent Results</h2>
        <div className="flex flex-wrap gap-2">
          {history.map(h => (
            <div key={h.roundId} className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 bg-slate-800/60 border border-slate-700`}> 
              <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-br ${COLOR_INFO[h.color].gradient}`}></span>
              <span>#{h.roundId}</span>
              <span className="font-mono">{h.multiplier}x</span>
            </div>
          ))}
          {!history.length && <p className="text-slate-500 text-sm">No history yet.</p>}
        </div>
      </div>
    </div>
    <p className="text-xs text-slate-500">Provably fair colors derived from hashed server seed + nonce. Hash revealed before outcome; seed exposed afterwards for verification.</p>
  </div></RequireAuth>;
}
