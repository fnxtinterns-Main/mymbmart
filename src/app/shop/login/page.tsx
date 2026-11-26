'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ShopPartnerLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/shop/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success && data.account) {
        localStorage.setItem('mbm_shop_partner', JSON.stringify(data.account));
        router.push('/shop/portal');
      } else {
        setErrorMsg(data.message || 'Invalid Store ID or password.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Failed to authenticate merchant.');
    }
  };

  const handleQuickDemoFill = (id: string, pwd: string) => {
    setIdentifier(id);
    setPassword(pwd);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0F172A] w-[100vw] max-w-[100vw] overflow-x-hidden">
      {/* Top Header with Only Website Logo */}
      <header className="w-[100vw] max-w-[100vw] bg-white border-b-[1px] border-slate-200 px-[4%] py-[0.75rem] sm:py-[1.25rem] flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="relative w-[10.5rem] sm:w-[14.5rem] md:w-[18rem] lg:w-[22rem] h-[3rem] sm:h-[4rem]">
            <Image
              src="/images/LOgo.jpeg"
              alt="MegaBachatMart"
              fill
              priority
              className="object-contain object-left group-hover:scale-105 transition-transform"
            />
          </div>
        </Link>

        <Link
          href="/"
          className="text-[0.75rem] font-semibold text-slate-500 hover:text-[#064E3B] transition flex items-center space-x-[0.25rem]"
        >
          <span>← Back to Customer Website</span>
        </Link>
      </header>

      {/* Main Login Area */}
      <main className="w-[100vw] max-w-[100vw] flex-1 py-[2rem] sm:py-[3.5rem] px-[4%] sm:px-[5%] flex items-center justify-center">
        <div className="w-[100%] max-w-[28rem] space-y-[1.5rem]">
          
          {/* Header */}
          <div className="text-center space-y-[0.5rem]">
            <div className="w-[3.5rem] h-[3.5rem] rounded-[1rem] bg-[#064E3B] text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/20">
              <Store className="w-[1.75rem] h-[1.75rem] text-emerald-300" />
            </div>
            <h1 className="text-[1.5rem] sm:text-[1.75rem] font-black text-[#0F172A] tracking-tight">
              Merchant Partner Login
            </h1>
            <p className="text-[0.75rem] text-slate-500">
              Sign in to manage store inventory, bulk upload CSVs, and fulfill orders.
            </p>
          </div>

          {/* Login Card */}
          <div className="w-[100%] bg-white rounded-[1.5rem] p-[1.5rem] sm:p-[2rem] border-[1px] border-slate-200 shadow-xl space-y-[1.25rem]">
            {errorMsg && (
              <div className="p-[0.875rem] rounded-[1rem] bg-rose-50 border-[1px] border-rose-200 text-rose-800 text-[0.75rem] font-bold flex items-center space-x-[0.5rem]">
                <AlertCircle className="w-[1rem] h-[1rem] text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-[1rem] text-[0.875rem]">
              <div>
                <label className="block font-bold text-slate-700 mb-[0.25rem]">Store ID / Mobile / Email</label>
                <div className="relative">
                  <Store className="w-[1rem] h-[1rem] text-slate-400 absolute left-[0.875rem] top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBM-SHP-834006-03 or 9431109876"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-[100%] pl-[2.5rem] pr-[1rem] py-[0.75rem] rounded-[0.75rem] border-[1px] border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium bg-slate-50/50 focus:bg-white text-[0.875rem]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-[0.25rem]">
                  <label className="font-bold text-slate-700">Secure Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[0.6875rem] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-[0.25rem] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-[0.875rem] h-[0.875rem]" /> : <Eye className="w-[0.875rem] h-[0.875rem]" />}
                    <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-[1rem] h-[1rem] text-slate-400 absolute left-[0.875rem] top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-[100%] pl-[2.5rem] pr-[2.5rem] py-[0.75rem] rounded-[0.75rem] border-[1px] border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono bg-slate-50/50 focus:bg-white text-[0.875rem]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[0.875rem] top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-[1rem] h-[1rem]" /> : <Eye className="w-[1rem] h-[1rem]" />}
                  </button>
                </div>
                <div className="text-right mt-[0.25rem]">
                  <span className="text-[0.625rem] text-slate-400">Password dispatched to your WhatsApp upon approval</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-[100%] bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold py-[0.75rem] rounded-[0.75rem] text-[0.875rem] shadow-lg shadow-emerald-950/20 transition flex items-center justify-center space-x-[0.5rem] cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Merchant Portal'}</span>
                <ArrowRight className="w-[1rem] h-[1rem]" />
              </button>
            </form>

            {/* Quick Demo Fill Buttons for Testing (Dev only) */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Quick Test Merchant Accounts (Dev Only)
                </p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('MBM-SHP-834001-23', 'MBM#Test001@2026')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 text-[11px] transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-emerald-800">Test Store (Prop: RAJ)</span>
                      <span className="text-slate-500 block text-[10px]">ID: MBM-SHP-834001-23 • Pwd: MBM#Test001@2026</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Click to Fill
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoFill('MBM-SHP-834006-03', 'MBM#Chot834@2026')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 text-[11px] transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-emerald-800">Chotanagpur Tribal Hub</span>
                      <span className="text-slate-500 block text-[10px]">ID: MBM-SHP-834006-03</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Pre-Approved
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Don’t have a partner account yet?{' '}
                <Link href="/shop/register" className="font-bold text-[#16A34A] hover:underline">
                  Apply for Merchant Onboarding →
                </Link>
              </p>
            </div>
          </div>

          {/* Compliance & Security Badge */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>MegaBachatMart Partner Network • SSL 256-bit Encrypted</span>
            </div>
          </div>

        </div>
      </main>

      {/* Minimal Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        &copy; 2026 MegaBachatMart (mymbmart.com). Merchant Partner Portal.
      </footer>
    </div>
  );
}
