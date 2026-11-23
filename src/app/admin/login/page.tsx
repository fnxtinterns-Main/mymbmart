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
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Ambient background glow orbs (Glassmorphism Dashboard V22 aesthetic) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header */}
      <header className="glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between relative z-10 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            MBM
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">
              MegaBachatMart
            </h1>
            <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
              Management & Operations Portal V22
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-cyan-300 transition flex items-center space-x-1"
        >
          <span>← Back to Customer Website</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md glass-panel-glow border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">
              Administrator Sign In
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Authorized personnel only. Please enter the master access passcode to unlock the console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email or Store ID
              </label>
              <input
                id="admin-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mymbmart.com"
                className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 outline-hidden transition shadow-2xs"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password / Security Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
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
                  className="w-full pl-10 pr-11 py-3 bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.08] rounded-xl text-sm font-mono text-white placeholder-slate-500 outline-hidden transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-cyan-300 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-semibold mt-2 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center justify-center space-x-2 cursor-pointer"
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
          <div className="pt-4 border-t border-white/10 text-center space-y-1">
            <div className="inline-flex items-center space-x-1 text-[11px] text-slate-400 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Role-Based Access Control • 256-bit Encrypted Session</span>
            </div>
            <p className="text-[10px] text-slate-500">
              IP logs and active sessions are audited for compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/10 py-4 text-center text-xs text-slate-500 relative z-10">
        © {new Date().getFullYear()} MegaBachatMart (mymbmart.com). Enterprise Operations Portal.
      </footer>
    </div>
  );
}
