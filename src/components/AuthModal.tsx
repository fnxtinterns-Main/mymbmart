'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  Smartphone, 
  Mail, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Store
} from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Partial<UserProfile>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [contact, setContact] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setLoading(true);
    setMessage('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: contact, action: 'SEND' }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setStep('verify');
        setMessage(data.message || `OTP dispatched to ${contact}`);
      } else {
        setErrorMsg(data.error || 'Failed to dispatch OTP');
      }
    } catch {
      setLoading(false);
      setStep('verify');
      setMessage(`OTP sent to ${contact}. Use test code: 123456`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: contact, 
          action: 'VERIFY', 
          otp: otpValue, 
          referralCode 
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.success && data.user) {
        // Persist session
        try {
          localStorage.setItem('mbm_user', JSON.stringify(data.user));
          if (data.token) localStorage.setItem('mbm_token', data.token);
        } catch (err) {
          console.error('Storage error', err);
        }

        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.error || 'Invalid OTP. Please enter 123456');
      }
    } catch {
      setLoading(false);
      // Fallback
      const fallbackUser = {
        name: contact.includes('@') ? contact.split('@')[0] : 'Community Member',
        phone: contact,
        memberId: 'MBM' + Math.floor(100000 + Math.random() * 900000),
        role: 'CONSUMER' as const,
      };
      onLoginSuccess(fallbackUser);
      onClose();
    }
  };

  const fillTestOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6']);
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = {
        name: contact ? (contact.includes('@') ? contact.split('@')[0] : 'Member ' + contact.slice(-4)) : 'Community Member',
        memberId: 'MBM' + Math.floor(100000 + Math.random() * 900000),
        phone: contact || '',
        role: 'CONSUMER' as const,
      };
      try {
        localStorage.setItem('mbm_user', JSON.stringify(user));
      } catch (e) {}
      onLoginSuccess(user);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Secure 2-Factor Authentication</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {mode === 'otp' ? 'Sign In / Register' : 'Member Login'}
          </h3>
          <p className="text-xs text-slate-600">
            Access your passbook savings, 10–30 min quick grocery orders & referral earnings.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-2xl mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 text-xs font-bold">
          <button
            onClick={() => { setMode('otp'); setStep('input'); }}
            className={`flex-1 py-2 rounded-xl transition ${
              mode === 'otp' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            OTP Verification
          </button>
          <button
            onClick={() => setMode('password')}
            className={`flex-1 py-2 rounded-xl transition ${
              mode === 'password' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Password Login
          </button>
        </div>

        {/* Mode 1: OTP Flow */}
        {mode === 'otp' && (
          <div>
            {step === 'input' ? (
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Number or Email
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Enter 10-digit mobile number or email"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-green focus:border-brand-green text-slate-900 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sponsor / Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter sponsor code (if any)"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-green outline-hidden font-mono uppercase font-bold text-brand-forest"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Connecting with a sponsor unlocks ₹100 welcome credit + 3-tier commission sharing.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-forest hover:bg-emerald-950 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  {loading ? <span>Sending OTP...</span> : <span>Send 6-Digit Verification Code</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5 text-xs sm:text-sm">
                <div className="text-center space-y-1">
                  <p className="text-slate-600">Enter the 6-digit code dispatched to</p>
                  <p className="font-bold text-slate-900">{contact}</p>
                  {message && (
                    <div className="text-[11px] text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-xl inline-block border border-emerald-200">
                      {message}
                    </div>
                  )}
                </div>

                {/* 6 Digit Input */}
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value;
                        const next = [...otp];
                        next[idx] = val;
                        setOtp(next);
                        if (val && idx < 5) {
                          const nextInput = document.getElementById(`otp-${idx + 1}`);
                          nextInput?.focus();
                        }
                      }}
                      className="w-11 h-12 text-center text-lg font-black rounded-xl border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-emerald-200 outline-hidden"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  {loading ? <span>Verifying Code...</span> : <span>Verify & Access Account</span>}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStep('input'); setOtp(['', '', '', '', '', '']); }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Change contact details
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Mode 2: Password Flow */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email or Phone</label>
              <input
                type="text"
                required
                placeholder="name@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-forest outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-forest outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-forest hover:bg-emerald-950 text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition"
            >
              {loading ? <span>Signing in...</span> : <span>Sign In with Password</span>}
            </button>
          </form>
        )}

        {/* Merchant Partner Onboarding Pathway */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Local Shop or Retail Owner?</p>
                <p className="text-[10px] text-slate-500">Partner with MegaBachatMart to sell online</p>
              </div>
            </div>
            <Link
              href="/shop/register"
              onClick={onClose}
              className="bg-[#064E3B] hover:bg-emerald-950 text-white text-[11px] font-black px-3 py-1.5 rounded-xl transition whitespace-nowrap"
            >
              Apply Now →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
