'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useEffect } from 'react';
import { formatLKR } from '../../lib/currency';
import { useAuthStore } from '../../lib/authStore';
import Link from 'next/link';

interface Game { id: string; name: string; minBet: number; maxBet: number; }

export default function GamesPage() {
  const { user } = useAuthStore();
  const [bet, setBet] = useState(5);
  const [showWingoBlocked, setShowWingoBlocked] = useState(false);
  const gamesQuery = useQuery<Game[]>({ queryKey: ['games'], queryFn: async () => (await api.get('/games')).data.games });
  const playMutation = useMutation({
    mutationFn: async ({ gameId, bet }: { gameId: string; bet: number }) => (await api.post('/games/play', { gameId, bet })).data,
  });
  const [winTotal, setWinTotal] = useState<number>(0);
  useEffect(()=>{ (async()=>{
    if(!user) { setWinTotal(0); return; }
    try { const r = await api.get('/wallet/summary'); setWinTotal(Number(r.data?.WIN || 0)); } catch {}
  })(); }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-2xl font-bold">Games</h2>
        {!user && <Link href="/auth/login" className="text-sm text-indigo-400">Login to Play</Link>}
      </div>
      {gamesQuery.isLoading && <p>Loading games...</p>}
      {user && (
        <div className="p-3 rounded bg-slate-800/60 border border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-300">Your total winnings</span>
          <span className="text-lg font-semibold text-emerald-400">{formatLKR(winTotal)}</span>
        </div>
      )}
      {gamesQuery.data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Crash Game Card */}
          <div className="p-5 rounded bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 space-y-3 hover:scale-105 transition-transform">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text">Crash</h3>
              <span className="text-xs text-slate-400">Aviator Style</span>
            </div>
            <p className="text-sm text-slate-400">Bet and cash out before the multiplier crashes.</p>
            <Link href="/games/crash" className="inline-block px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm font-medium">Play Crash</Link>
          </div>
          {/* Wingo Game Card (blocked in this region) */}
          <div className="p-5 rounded bg-gradient-to-br from-emerald-800/40 to-emerald-900 border border-emerald-700/60 space-y-3 hover:scale-105 transition-transform">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-emerald-300 to-fuchsia-300 text-transparent bg-clip-text">Wingo</h3>
              <span className="text-xs text-slate-400">Color Betting</span>
            </div>
            <p className="text-sm text-slate-400">Pick a color before the timer ends. Higher multipliers for rarer colors.</p>
            <button onClick={()=>setShowWingoBlocked(true)} className="inline-block px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm font-medium">
              Play Wingo
            </button>
          </div>
          {/* Boxes Game Card */}
          <div className="p-5 rounded bg-gradient-to-br from-rose-800/40 to-rose-900 border border-rose-700/60 space-y-3 hover:scale-105 transition-transform">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-rose-300 to-orange-300 text-transparent bg-clip-text">10 Boxes</h3>
              <span className="text-xs text-slate-400">Instant Pick</span>
            </div>
            <p className="text-sm text-slate-400">Open a box, hope it holds a prize. Three winners each round.</p>
            <Link href="/games/boxes" className="inline-block px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-sm font-medium">Play Boxes</Link>
          </div>
          {gamesQuery.data
            // Remove Dice and Coin games from the list
            .filter(g => !/\b(dice|coin)\b/i.test(g.name))
            .map((g) => (
            <div key={g.id} className="p-5 rounded bg-slate-800 border border-slate-700 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{g.name}</h3>
                <span className="text-xs text-slate-400">Bet {g.minBet}-{g.maxBet}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bet}
                  min={g.minBet}
                  max={g.maxBet}
                  onChange={(e) => setBet(Number(e.target.value))}
                  className="w-full sm:w-24 px-2 py-1 rounded bg-slate-900"
                />
                {/^wingo$/i.test(g.name) ? (
                  <button
                    onClick={()=>setShowWingoBlocked(true)}
                    className="px-3 py-1 rounded bg-emerald-600 w-full sm:w-auto"
                  >
                    Play
                  </button>
                ) : (
                  <button
                    disabled={!user || playMutation.isPending}
                    onClick={() => playMutation.mutate({ gameId: g.id, bet })}
                    className="px-3 py-1 rounded bg-indigo-600 disabled:opacity-40 w-full sm:w-auto"
                  >
                    Play
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {playMutation.data && (
        <p className="text-sm">
          Result: <span className="font-semibold">{playMutation.data.result}</span>
          {playMutation.data.winnings && ` (+${formatLKR(playMutation.data.winnings)})`}
        </p>
      )}

      {/* Wingo blocked modal */}
      {showWingoBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="wingo-blocked-title">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h3 id="wingo-blocked-title" className="text-lg font-semibold text-white">Wingo Unavailable</h3>
              <button onClick={()=>setShowWingoBlocked(false)} className="text-slate-300 hover:text-white">✕</button>
            </div>
            <p className="mt-3 text-slate-300">Wingo game is currently not available for your country.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={()=>setShowWingoBlocked(false)} className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
