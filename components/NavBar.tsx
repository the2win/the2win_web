'use client';
import Link from 'next/link';
import { useAuthStore } from '../lib/authStore';
import { useState } from 'react';

export function NavBar() {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 px-4 py-3 backdrop-blur-sm" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text hover:scale-105 transition-transform duration-200">
          The2Win
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link href="/games" className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group">
            Games
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
          </Link>
          
          {user ? (
            <>
              {/* Dashboard link removed for admin simplification */}
              <Link href="/wallet/deposit" className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group">
                Deposit
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/wallet/withdraw" className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group">
                Withdraw
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/wallet/transactions" className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group">
                Transactions
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <span className="text-sm text-slate-400">Bal: <span className="text-indigo-300 font-semibold">{user.balance}</span></span>
              <span className="text-sm text-slate-500">{user.email.split('@')[0]}</span>
              <button 
                onClick={logout} 
                className="text-slate-300 hover:text-red-400 transition-all duration-200 hover:scale-105"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 relative group">
                Login
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-6 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-300 hover:text-white transition-colors duration-200"
          aria-controls="mobile-menu"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div id="mobile-menu" className={`md:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pt-4 pb-2 space-y-2">
          <Link href="/" className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded transition-all duration-200">Home</Link>
          <Link href="/games" className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded transition-all duration-200">Games</Link>
          
          {user ? (
            <>
              {/* Dashboard link removed in mobile menu */}
              <Link href="/wallet/deposit" className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded transition-all duration-200">Deposit</Link>
              <Link href="/wallet/withdraw" className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded transition-all duration-200">Withdraw</Link>
              <Link href="/wallet/transactions" className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded transition-all duration-200">Transactions</Link>
              <button onClick={logout} className="block w-full text-left text-slate-300 hover:text-red-400 hover:bg-slate-800/50 px-3 py-2 rounded transition-all duration-200">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-slate-300 hover:text-white hover:bg-slate-800/50 px-3 py-2 rounded transition-all duration-200">Login</Link>
              <Link href="/auth/register" className="block text-center bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-3 py-2 rounded transition-all duration-200">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
