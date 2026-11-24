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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0F172A]">
      {/* Top Header with Only Website Logo */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="relative w-56 sm:w-72 md:w-84 lg:w-96 xl:w-[420px] h-16 sm:h-20 md:h-22 lg:h-24">
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
          className="text-xs font-semibold text-slate-500 hover:text-[#064E3B] transition flex items-center space-x-1"
        >
          <span>← Back to Customer Website</span>
        </Link>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/20">
              <Store className="w-7 h-7 text-emerald-300" />
            </div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Merchant Partner Login
            </h1>
            <p className="text-xs text-slate-500">
              Sign in to manage store inventory, bulk upload CSVs, and fulfill orders.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Store ID / Mobile / Email</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBM-SHP-834006-03 or 9431109876"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-medium bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Secure Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono bg-slate-50/50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right mt-1">
                  <span className="text-[10px] text-slate-400">Password dispatched to your WhatsApp upon approval</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-lg shadow-emerald-950/20 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Merchant Portal'}</span>
                <ArrowRight className="w-4 h-4" />
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
