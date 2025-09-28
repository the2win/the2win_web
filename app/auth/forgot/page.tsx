'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { z } from 'zod';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request'|'verify'|'reset'>('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function requestOtp(e:any){
    e.preventDefault(); setErr(''); setMsg('');
    const s = z.object({ email: z.string().email('Enter a valid email') }).safeParse({ email });
    if (!s.success) { setErr(s.error.issues[0]?.message || 'Invalid email'); return; }
    try { await api.post('/auth/forgot-password',{ email }); setMsg('OTP sent if account exists.'); setStep('verify'); } catch(e:any){ setErr(e.response?.data?.message || 'Failed'); }
  }
  async function verify(e:any){
    e.preventDefault(); setErr('');
    const s = z.object({ code: z.string().min(4,'Enter the full code') }).safeParse({ code });
    if (!s.success) { setErr(s.error.issues[0]?.message || 'Invalid'); return; }
    try { await api.post('/auth/verify-otp',{ email, code }); setStep('reset'); } catch(e:any){ setErr(e.response?.data?.message || 'Invalid'); }
  }
  async function reset(e:any){
    e.preventDefault(); setErr('');
    const s = z.object({ newPassword: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/,'Use letters and numbers') }).safeParse({ newPassword });
    if (!s.success) { setErr(s.error.issues[0]?.message || 'Weak password'); return; }
    try { await api.post('/auth/reset-password',{ email, code, newPassword }); setMsg('Password updated'); } catch(e:any){ setErr(e.response?.data?.message || 'Failed'); }
  }

  return <div className="max-w-sm mx-auto">
    <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
    {step==='request' && <form onSubmit={requestOtp} className="space-y-3">
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 rounded bg-slate-800" />
      <button className="bg-indigo-600 px-4 py-2 rounded w-full">Send OTP</button>
    </form>}
    {step==='verify' && <form onSubmit={verify} className="space-y-3">
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter OTP" className="w-full px-3 py-2 rounded bg-slate-800" />
      <button className="bg-indigo-600 px-4 py-2 rounded w-full">Verify</button>
    </form>}
    {step==='reset' && <form onSubmit={reset} className="space-y-3">
      <input value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New Password" type="password" className="w-full px-3 py-2 rounded bg-slate-800" />
      <button className="bg-indigo-600 px-4 py-2 rounded w-full">Reset</button>
    </form>}
    {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
    {msg && <p className="text-green-400 text-sm mt-3">{msg}</p>}
  </div>;
}
