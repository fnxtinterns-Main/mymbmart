'use client';

import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Mail, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2
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
  const [referralCode, setReferralCode] = useState('MB123456');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setLoading(true);
    setMessage('');

    try {
      // Call OTP endpoint
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: contact, purpose: 'LOGIN' }),
      });
      const data = await res.json();
      setLoading(false);
      setStep('verify');
      setMessage(data.message || `OTP dispatched to ${contact} (Use test OTP: 123456)`);
    } catch {
      setLoading(false);
      setStep('verify');
      setMessage(`OTP sent to ${contact}. Test OTP: 123456`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: contact.includes('@') ? contact.split('@')[0] : 'Community Member',
        email: contact.includes('@') ? contact : 'member@mymbmart.com',
        phone: contact.includes('@') ? '+91 98765 43210' : contact,
        memberId: 'MB' + Math.floor(100000 + Math.random() * 900000),
        role: 'PROMOTER',
      });
      onClose();
    }, 1000);
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: contact ? (contact.includes('@') ? contact.split('@')[0] : contact) : 'Aviraj Sharma',
        memberId: 'MB123456',
      });
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
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
          <div className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Coming Soon • VIP Early Access</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {mode === 'otp' ? 'Sign In / Pre-Register' : 'Member Login'}
          </h3>
          <p className="text-xs text-slate-600">
            Member accounts & Smart Chain wallet are launching soon! Enter your contact below to reserve your early spot.
          </p>
        </div>

        {/* Coming Soon Notice Card */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 mb-5 flex items-start space-x-2.5 text-xs text-amber-950">
          <span className="text-base shrink-0">✨</span>
          <div className="leading-snug">
            <span className="font-extrabold text-amber-900">Pre-Launch Perk:</span> Early members receive a flat <strong>₹100 Micro-Credit Welcome Bonus</strong> + priority SHG group buying access when we go live.
          </div>
        </div>

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
            Password / Google
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
                      placeholder="+91 98765 43210 or name@gmail.com"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-orange focus:outline-none text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sponsor / Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MB123456"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-orange focus:outline-hidden font-mono uppercase font-bold text-brand-forest"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Joining with a referral connects you to community bulk discounts.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 transition"
                >
                  {loading ? <span>Sending OTP...</span> : <span>Send 6-Digit OTP</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5 text-xs sm:text-sm">
                <div className="text-center space-y-1">
                  <p className="text-slate-600">Enter the code sent to</p>
                  <p className="font-bold text-slate-900">{contact}</p>
                  {message && (
                    <p className="text-[11px] text-emerald-600 bg-emerald-50 py-1 px-3 rounded-lg inline-block">
                      {message}
                    </p>
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
                      className="w-11 h-12 text-center text-lg font-black rounded-xl border border-slate-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/30 focus:outline-hidden"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  {loading ? <span>Verifying...</span> : <span>Verify & Access Mart</span>}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Change contact details
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Mode 2: Password / Google / Apple Flow */}
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
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-forest focus:outline-hidden"
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
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-forest focus:outline-hidden"
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

            {/* Social Logins: Google & Apple (Required for iOS) */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="bg-white px-2 text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onLoginSuccess({ name: 'Google User', email: 'user@gmail.com' });
                  onClose();
                }}
                className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs font-bold text-slate-700"
              >
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoginSuccess({ name: 'Apple User', email: 'user@apple.com' });
                  onClose();
                }}
                className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-black text-white hover:bg-slate-800 transition text-xs font-bold"
              >
                <span>Sign in with Apple</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
