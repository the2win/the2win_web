'use client';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuthStore } from '@/lib/authStore';
import { api } from '@/lib/api';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function ProfilePage(){
  const user = useAuthStore(s=>s.user);
  const [stage,setStage]=useState<'idle'|'otp_sent'|'verified'>('idle');
  const [otpEmail,setOtpEmail]=useState(user?.email || '');
  const [otpCode,setOtpCode]=useState('');
  const [newPass,setNewPass]=useState('');
  const [msg,setMsg]=useState('');
  const [err,setErr]=useState('');
  const [loading,setLoading]=useState(false);

  async function sendOtp(){
    setErr(''); setMsg(''); setLoading(true);
    try{ await api.post('/auth/forgot-password',{ email: otpEmail }); setStage('otp_sent'); setMsg('OTP sent to your email'); }
    catch(e:any){ setErr(e.response?.data?.message || 'Failed to send OTP'); }
    finally{ setLoading(false); }
  }
  async function verify(){
    setErr(''); setMsg(''); setLoading(true);
    try{ await api.post('/auth/verify-otp',{ email: otpEmail, code: otpCode }); setStage('verified'); setMsg('OTP verified. You can set a new password.'); }
    catch(e:any){ setErr(e.response?.data?.message || 'Invalid OTP'); }
    finally{ setLoading(false); }
  }
  async function changePassword(){
    setErr(''); setMsg(''); setLoading(true);
    try{ await api.post('/auth/reset-password',{ email: otpEmail, code: otpCode, newPassword: newPass }); setMsg('Password changed successfully'); setStage('idle'); setOtpCode(''); setNewPass(''); }
    catch(e:any){ setErr(e.response?.data?.message || 'Failed to change password'); }
    finally{ setLoading(false); }
  }

  return <RequireAuth>
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text">Profile</h1>
        <p className="text-slate-400 text-sm">View and update your account details</p>
      </div>

      {user && (
        <div className="glass rounded-xl p-5 space-y-2">
          <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-medium">{user.email}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">User ID</span><span className="font-mono">{user.id}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Balance</span><span className="font-medium">{Math.trunc(user.balance)} coins</span></div>
          {(user as any).role && <div className="flex justify-between"><span className="text-slate-400">Role</span><span className="font-medium">{(user as any).role}</span></div>}
        </div>
      )}

      <div className="glass rounded-xl p-5 space-y-4">
        <h2 className="font-semibold">Change Password (OTP required)</h2>
        <div className="grid gap-3">
          <label className="text-xs text-slate-400">Email for OTP</label>
          <input value={otpEmail} onChange={e=>setOtpEmail(e.target.value)} className="px-3 py-2 rounded bg-slate-900/50 border border-slate-600"/>
          {stage==='idle' && <button disabled={loading} onClick={sendOtp} className="px-4 py-2 rounded bg-indigo-600 disabled:opacity-50 w-fit">Send OTP</button>}
          {stage!=='idle' && (
            <>
              <label className="text-xs text-slate-400">Enter OTP</label>
              <input value={otpCode} onChange={e=>setOtpCode(e.target.value)} className="px-3 py-2 rounded bg-slate-900/50 border border-slate-600"/>
              {stage==='otp_sent' && <button disabled={loading} onClick={verify} className="px-4 py-2 rounded bg-cyan-600 disabled:opacity-50 w-fit">Verify OTP</button>}
              {stage==='verified' && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">New Password</label>
                  <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} className="px-3 py-2 rounded bg-slate-900/50 border border-slate-600"/>
                  <button disabled={loading || newPass.length<8} onClick={changePassword} className="px-4 py-2 rounded bg-emerald-600 disabled:opacity-50 w-fit">Change Password</button>
                </div>
              )}
            </>
          )}
        </div>
        {err && <div className="text-sm text-red-400">{err}</div>}
        {msg && <div className="text-sm text-emerald-400">{msg}</div>}
      </div>
    </div>
  </RequireAuth>;
}
