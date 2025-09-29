'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore, type AuthState } from '@/lib/authStore';
import Link from 'next/link';
import { z } from 'zod';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const setAuth = useAuthStore((s: AuthState) => s.setAuth);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    // simple client validation
    const schema = z.object({
      email: z.string().email('Enter a valid email'),
      password: z.string().min(8, 'Password must be at least 8 characters')
    });
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setIsLoading(false);
      setError(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }

    try {
  const res = await api.post('/auth/login', { email, password });
  // Support both cookie-based and token-based flows
  const token = res.data.token as string | undefined;
  if (token) {
    try { localStorage.setItem('auth_token', token); } catch {}
  }
  setAuth(token, res.data.user);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full mb-4 animate-glow">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-400">Sign in to your account to continue</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl border border-slate-700/50 hover-lift">
          <form onSubmit={submit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <input 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Enter your email" 
                  type="email" 
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    focusedField === 'email' ? 'ring-2 ring-indigo-500 border-transparent' : ''
                  }`}
                />
                <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full opacity-0 transition-opacity duration-300" 
                     style={{ opacity: focusedField === 'email' ? 1 : 0 }}></div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Enter your password" 
                  type="password" 
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    focusedField === 'password' ? 'ring-2 ring-indigo-500 border-transparent' : ''
                  }`}
                />
                <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full opacity-0 transition-opacity duration-300" 
                     style={{ opacity: focusedField === 'password' ? 1 : 0 }}></div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm animate-fade-in-up">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-sm">
              <Link 
                href="/auth/register" 
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 hover:underline"
              >
                Create account
              </Link>
              <Link 
                href="/auth/forgot" 
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            
            <div className="mt-4 text-center">
              <Link 
                href="/" 
                className="text-slate-400 hover:text-slate-300 text-sm transition-colors duration-200"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
