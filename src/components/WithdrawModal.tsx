'use client';

import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  ArrowUpRight, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  QrCode,
  AlertCircle
} from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onWithdrawSuccess: (amount: number, upi: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  onWithdrawSuccess,
}) => {
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (withdrawAmount > availableBalance) {
      setError('Withdrawal amount exceeds spendable balance');
      return;
    }
    if (withdrawAmount < 100) {
      setError('Minimum withdrawal is ₹100');
      return;
    }

    setProcessing(true);
    setError('');

    setTimeout(() => {
      setProcessing(false);
      onWithdrawSuccess(withdrawAmount, method === 'upi' ? upiId : accountNumber);
      onClose();
      alert(`Withdrawal request for ₹${withdrawAmount} submitted! Payout will be transferred within 2 hours via Smart Chain instant settlement.`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            <Wallet className="w-3.5 h-3.5" />
            <span>Smart Payout Settlement</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">Withdraw Rewards</h3>
          <p className="text-xs text-slate-500">
            Transfer your actual cashback & referral earnings to your bank or UPI.
          </p>
        </div>

        {/* Current Balance */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500">Available to Withdraw</span>
            <p className="text-2xl font-black text-slate-900">₹ {availableBalance.toLocaleString('en-IN')}</p>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-100 font-bold px-2 py-1 rounded-lg">
            Instant Transfer
          </span>
        </div>

        {/* Method selection */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMethod('upi')}
            className={`py-2.5 rounded-xl border flex items-center justify-center space-x-2 transition ${
              method === 'upi' ? 'bg-brand-forest text-white border-brand-forest shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>UPI ID / VPA</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('bank')}
            className={`py-2.5 rounded-xl border flex items-center justify-center space-x-2 transition ${
              method === 'bank' ? 'bg-brand-forest text-white border-brand-forest shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Bank Transfer</span>
          </button>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Amount to Withdraw (₹)</label>
            <input
              type="number"
              required
              min="100"
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 font-black text-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {method === 'upi' ? (
            <div>
              <label className="block font-bold text-slate-700 mb-1">UPI ID</label>
              <input
                type="text"
                required
                placeholder="name@okhdfcbank or 9876543210@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  required
                  placeholder="HDFC0001234"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className="w-full p-3 rounded-2xl border border-slate-200 uppercase font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
          >
            {processing ? <span>Processing Transfer...</span> : <span>Confirm Withdrawal</span>}
          </button>

          <p className="text-[10px] text-center text-slate-400">
            Powered by Smart Chain transparent finance ledger with zero deduction fees.
          </p>
        </form>

      </div>
    </div>
  );
};
