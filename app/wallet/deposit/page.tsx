'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/RequireAuth';

type DepositMethod = 'cash_agent' | 'binance';

const METHOD_META: Record<DepositMethod, { label: string; desc: string; min: number; max: number; extra?: string; requiresReceipt?: boolean }> = {
  cash_agent: { label: 'Cash Agent', desc: 'Deposit in LKR through our verified cash agent.', min: 1000, max: 500000, extra: 'No file upload required. Contact via WhatsApp.', requiresReceipt: false },
  binance: { label: 'USDT (Binance)', desc: 'Transfer USDT only (TRC20/BEP20). 10 USDT ≈ Rs. 1000 credit.', min: 1000, max: 500000, extra: 'Send only USDT. Network fees apply.' }
};

export default function DepositPage(){
  const [method,setMethod]=useState<DepositMethod>('cash_agent');
  const [amount,setAmount]=useState<number | ''>('');
  const [msg,setMsg]=useState('');
  const [error,setError]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const [receiptFile,setReceiptFile]=useState<File|null>(null);
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  // removed bank deposit UI; keep minimal state
  const cashAgentNumber = '+94786183162';
  const [showBinanceUnavailable, setShowBinanceUnavailable] = useState(false);

  // No bank deposit UI

  const meta = METHOD_META[method];

  function validate(): string | null {
    if (amount === '' || isNaN(Number(amount))) return 'Enter an amount.';
    const val = Number(amount);
    if (val < meta.min) return `Minimum for ${meta.label} is Rs. ${meta.min}.`;
    if (val > meta.max) return `Maximum for ${meta.label} is Rs. ${meta.max}.`;
  // bank_in removed
    return null;
  }

  async function submit(e:any){
    e.preventDefault();
    setMsg(''); setError('');
    const v = validate();
    if (v) { setError(v); return; }
    setSubmitting(true);
    try {
      // For now just prototype POST; receipt upload will be multipart later
      const payload: any = { amount: Number(amount), method };
  // bank_in removed
      if (receiptFile) {
        // convert to base64 for backend receipt saving
        const b64 = await fileToBase64(receiptFile);
        payload.receiptBase64 = b64;
      }
      await api.post('/wallet/deposit', payload);
      setMsg('Deposit submitted (prototype).');
      setAmount(''); setReceiptFile(null);
    } catch (e:any){ setError(e.response?.data?.message || 'Failed to submit deposit'); }
    finally { setSubmitting(false); }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return <RequireAuth><div className="max-w-2xl mx-auto space-y-6">
    <div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text">Deposit Funds</h2>
      <p className="text-slate-400 text-sm mt-1">Choose a funding method below. Follow instructions carefully for manual methods.</p>
    </div>

    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 backdrop-blur p-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(METHOD_META) as DepositMethod[]).map(m => (
          <button key={m} onClick={()=>{ setMethod(m); setError(''); setMsg(''); if (m==='binance') setShowBinanceUnavailable(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${method===m ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>{METHOD_META[m].label}</button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-slate-400">Amount</label>
          <input type="number" inputMode="decimal" min={meta.min} max={meta.max} step="0.01"
            value={amount} onChange={e=>setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={`${meta.min} - ${meta.max}`} />
          <p className="text-[11px] text-slate-500">Limits: Rs. {meta.min} – Rs. {meta.max}</p>
          {amount !== '' && (
            <p className="text-[12px] text-slate-300">Amount to deposit: <span className="font-semibold">Rs. {Math.trunc(Number(amount)).toLocaleString('en-LK')}</span></p>
          )}
        </div>

        {method === 'cash_agent' && (
          <div className="text-xs space-y-2 bg-slate-900/40 p-3 rounded-lg border border-slate-700/40">
            <p className="text-slate-300 font-semibold">Deposit via Cash Agent</p>
            <p>Contact the cash agent via WhatsApp and deposit to the agent7s bank account. Share your The2Win account ID, your email, and the deposit slip/statement photo on WhatsApp.</p>
            <p className="font-mono bg-slate-800/60 p-2 rounded">Agent WhatsApp: {cashAgentNumber}</p>
            <ul className="list-decimal pl-5 space-y-1">
              <li>Message the agent and request bank details.</li>
              <li>Deposit in LKR and keep the receipt/statement.</li>
              <li>Send your account ID + email + receipt photo to the agent on WhatsApp.</li>
              <li>Money is credited within 1–15 minutes while agent is active.</li>
            </ul>
          </div>
        )}
        {/* bank_in UI removed */}
        {method === 'binance' && (
          <div className="text-xs space-y-2 bg-slate-900/40 p-3 rounded-lg border border-slate-700/40">
            <p>Transfer USDT only. Choose the network that matches the address below. Credits are applied in LKR.</p>
            <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-800/60 p-2 rounded">USDT (TRC20): TRxxxEXAMPLE</div>
              <div className="bg-slate-800/60 p-2 rounded">USDT (BEP20): 0xABCDEF...</div>
            </div>
            <p>Credit after 1 network confirmation.</p>
          </div>
        )}

        {/* No receipt upload required on this page. Send slip via WhatsApp to the agent. */}

        {meta.extra && <p className="text-[11px] text-slate-500">{meta.extra}</p>}
        {method==='cash_agent' && (
          <div className="text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Cash Agent Instructions:</p>
            <p>1) Message the agent at {cashAgentNumber} with your User ID and amount.</p>
            <p>2) Transfer funds to the agent’s provided account details.</p>
            <p>3) Upload transfer receipt/screenshot above and submit.</p>
            <p className="text-slate-500">Confirm agent identity before sending money.</p>
          </div>
        )}

        {error && <div className="text-sm text-red-400">{error}</div>}
        {msg && <div className="text-sm text-emerald-400">{msg}</div>}

        <button disabled={submitting} className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform">
          {submitting ? 'Submitting...' : 'Submit Deposit'}
        </button>
      </form>
    </div>
    
  <p className="text-[11px] text-slate-500">Note: All balances are in LKR. Manual deposits are credited after agent confirmation.</p>

    {showBinanceUnavailable && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={()=>setShowBinanceUnavailable(false)}>
        <div onClick={e=>e.stopPropagation()} className="max-w-sm w-full bg-slate-900 rounded-xl border border-slate-700 p-4 text-center">
          <h3 className="font-semibold mb-2">USDT (Binance) Unavailable</h3>
          <p className="text-sm text-slate-300">This method is currently unavailable.</p>
          <button onClick={()=>setShowBinanceUnavailable(false)} className="mt-4 px-4 py-2 rounded bg-indigo-600">OK</button>
        </div>
      </div>
    )}
  </div></RequireAuth>;
}
