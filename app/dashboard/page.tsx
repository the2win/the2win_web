'use client';
import { useAuthStore } from '../../lib/authStore';
import { RequireAuth } from '../../components/RequireAuth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatLKR } from '../../lib/currency';

export default function DashboardPage() {
  const user = useAuthStore(s=>s.user);
  const logout = useAuthStore(s=>s.logout);
  const [balance, setBalance] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (user) {
        try {
          const r = await api.get('/wallet/balance');
          setBalance(r.data.balance);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        } finally {
          setIsLoading(false);
        }
      }
    })();
  }, [user]);

  return (
    <RequireAuth>
      <div className="space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text">
              Welcome back!
            </h1>
            <p className="text-slate-400 mt-2">Hello, {user?.email.split('@')[0]}</p>
          </div>
          <button 
            onClick={logout} 
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            Sign Out
          </button>
        </div>

        {/* Balance Card */}
        <div className="glass rounded-2xl p-8 border border-slate-700/50 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-200">Account Balance</h2>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="loading-spinner"></div>
                <span className="text-slate-400">Loading...</span>
              </div>
            ) : (
              <>
                <span className="text-4xl font-bold text-white">{formatLKR(balance ?? 0)}</span>
                <span className="text-sm text-slate-500">&nbsp;(LKR)</span>
              </>
            )}
          </div>

          <div className="mt-2 text-slate-400 text-sm">Your User ID: <span className="font-mono bg-slate-800/60 px-2 py-0.5 rounded text-slate-200">{user?.id}</span></div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Link 
              href="/wallet/deposit"
              className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-medium text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              💳 Deposit
            </Link>
            <Link 
              href="/wallet/withdraw"
              className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-medium text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              💸 Withdraw
            </Link>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Play Games Card */}
          <Link href="/games" className="group">
            <div className="glass rounded-xl p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🎮</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Play Games</h3>
                  <p className="text-sm text-slate-400">Start betting & winning</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Transactions Card hidden for non-admins; can be re-enabled for admins if needed */}

          {/* Profile Card */}
          <div className="group cursor-pointer">
            <div className="glass rounded-xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Profile</h3>
                  <p className="text-sm text-slate-400">Account settings</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
            { label: 'Games Played', value: '24', icon: '🎲' },
            { label: 'Total Wins', value: '12', icon: '🏆' },
            { label: 'Win Rate', value: '50%', icon: '📈' },
            { label: 'Biggest Win (LKR)', value: 'Rs. 500', icon: '💎' }
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className="glass rounded-xl p-4 text-center border border-slate-700/50 hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}
