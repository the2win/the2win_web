'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { z } from 'zod';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); 
    setMsg('');
    // Client validation
    const schema = z.object({
      email: z.string().trim().toLowerCase().email('Enter a valid email'),
      password: z.string().min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Password must include letters and numbers'),
      confirm: z.string()
    }).refine(v => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });

    const parsed = schema.safeParse({ email, password, confirm: confirmPassword });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', { email, password });
      setMsg('Account created successfully! You can now sign in.');
    } catch (e: any) { 
      setErr(e.response?.data?.message || 'Registration failed'); 
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full mb-4 animate-glow">
            <span className="text-2xl">🎮</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text mb-2">
            Join The2Win
          </h1>
          <p className="text-slate-400">Create your account and start winning</p>
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
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                    focusedField === 'email' ? 'ring-2 ring-cyan-500 border-transparent' : ''
                  }`}
                />
                <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full opacity-0 transition-opacity duration-300" 
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
                  placeholder="Create a strong password" 
                  type="password" 
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                    focusedField === 'password' ? 'ring-2 ring-cyan-500 border-transparent' : ''
                  }`}
                />
                <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full opacity-0 transition-opacity duration-300" 
                     style={{ opacity: focusedField === 'password' ? 1 : 0 }}></div>
              </div>
              <p className="text-xs text-slate-400">Minimum 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Confirm Password</label>
              <div className="relative">
                <input 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Confirm your password" 
                  type="password" 
                  required
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                    focusedField === 'confirmPassword' ? 'ring-2 ring-cyan-500 border-transparent' : ''
                  }`}
                />
                <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full opacity-0 transition-opacity duration-300" 
                     style={{ opacity: focusedField === 'confirmPassword' ? 1 : 0 }}></div>
              </div>
            </div>

            {/* Error Message */}
            {err && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm animate-fade-in-up">
                {err}
              </div>
            )}

            {/* Success Message */}
            {msg && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm animate-fade-in-up">
                {msg}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <div className="text-center text-sm">
              <span className="text-slate-400">Already have an account? </span>
              <Link 
                href="/auth/login" 
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200 hover:underline font-medium"
              >
                Sign in
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
