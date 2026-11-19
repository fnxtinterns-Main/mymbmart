'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Eye, EyeOff, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passcode }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mbm_admin_authenticated', 'true');
          sessionStorage.setItem('mbm_admin_role', data.role || 'Super Admin');
          sessionStorage.setItem('mbm_admin_name', data.name || email || 'System Administrator');
          document.cookie = 'mbm_admin_authenticated=true; path=/';
        }
        router.push('/admin?tab=orders');
      } else {
        setIsLoading(false);
        setError(data.error || 'Invalid Security Passcode. Access denied.');
      }
    } catch {
      setIsLoading(false);
      setError('Unable to reach authentication server. Please check your network.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0F172A]">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#064E3B] flex items-center justify-center text-white font-black text-sm shadow-xs">
            MBM
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-[#0F172A] tracking-tight">
              MegaBachatMart
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Management & Operations Portal
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 hover:text-[#16A34A] transition flex items-center space-x-1"
        >
          <span>← Back to Customer Website</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#16A34A] flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-[#0F172A]">
              Administrator Sign In
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Authorized personnel only. Please enter the master access passcode to unlock the console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email or Store ID
              </label>
              <input
                id="admin-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@test.com"
                className="w-full px-3.5 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] focus:bg-white rounded-xl text-sm text-[#0F172A] outline-hidden transition shadow-2xs"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password / Security Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter administrator passcode..."
                  autoFocus
                  className="w-full pl-10 pr-11 py-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] focus:bg-white rounded-xl text-sm font-mono text-[#0F172A] outline-hidden transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <div className="flex items-center space-x-1.5 text-rose-600 text-xs font-semibold mt-2 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#16A34A] hover:bg-[#15803D] active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Admin Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-[#E2E8F0] text-center space-y-1">
            <div className="inline-flex items-center space-x-1 text-[11px] text-slate-500 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Role-Based Access Control • 256-bit Encrypted Session</span>
            </div>
            <p className="text-[10px] text-slate-400">
              IP logs and active sessions are audited for compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MegaBachatMart (mymbmart.com). Enterprise Operations Portal.
      </footer>
    </div>
  );
}
