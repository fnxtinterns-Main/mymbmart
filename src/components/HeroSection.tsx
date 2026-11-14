'use client';

import React from 'react';
import Image from 'next/image';
import { 
  PiggyBank, 
  Users, 
  Handshake, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Percent, 
  BadgeCheck, 
  CheckCircle2 
} from 'lucide-react';

interface HeroSectionProps {
  onShopClick: () => void;
  onJoinClick: () => void;
  onSavingsClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onShopClick,
  onJoinClick,
  onSavingsClick,
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-orange-50/30 pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-slate-200">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0D2C6C_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Main Hero Card Container */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-brand-navy rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-2xl relative overflow-hidden">
          
          {/* Subtle Glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Headlines, Pitch & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs sm:text-sm text-emerald-300 font-semibold">
                <Sparkles className="w-4 h-4 text-brand-orange animate-pulse" />
                <span>The PROSUMER Revolution: Producer + Consumer</span>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none">
                  <span className="text-white">Bachat Bhi. </span>
                  <span className="text-brand-orange drop-shadow-sm">Kamai Bhi!</span>
                </h1>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                  Shop Smart. Save More. Together.
                </p>
              </div>

              {/* Sub-copy */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                MegaBachatMart is India's community e-commerce movement where households save on daily shopping, 
                Self Help Groups (SHGs) and women entrepreneurs sell direct, and every member earns referral micro-credit.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={onShopClick}
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white font-black px-6 py-3.5 rounded-full shadow-lg shadow-orange-500/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={onJoinClick}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-full border border-white/30 backdrop-blur-sm transition-all text-sm sm:text-base"
                >
                  Join Free
                </button>

                <button
                  onClick={onSavingsClick}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-full shadow-md shadow-emerald-900/40 transition-all text-sm sm:text-base"
                >
                  View Savings
                </button>
              </div>

              {/* Trust Badge Strip */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Powered by FutureNxt E-Commerce</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <BadgeCheck className="w-4 h-4 text-brand-cyan" />
                  <span>Digital Support by TechNxtAI</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Transparent Smart Chain Ledger</span>
                </span>
              </div>
            </div>

            {/* Right Column: 3 Feature Cards & Visuals */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              
              {/* Feature Pill 1: Save 10% Instantly */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <PiggyBank className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Save 10% - 30% Instantly</h3>
                  <p className="text-xs sm:text-sm text-slate-300">Direct producer pricing & community bulk discounts on daily essentials.</p>
                </div>
              </div>

              {/* Feature Pill 2: Earn via Referrals */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-brand-orange flex items-center justify-center shrink-0 border border-orange-500/30">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Earn via Referrals</h3>
                  <p className="text-xs sm:text-sm text-slate-300">Micro-credits on Level 1, 2, and 3 downline member shopping habits.</p>
                </div>
              </div>

              {/* Feature Pill 3: Easy & Trusted */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-brand-cyan flex items-center justify-center shrink-0 border border-sky-500/30">
                  <Handshake className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Easy & 100% Trusted</h3>
                  <p className="text-xs sm:text-sm text-slate-300">Empowering SHGs, women makers, and local farmers with zero middlemen.</p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* 3 Pillars of Prosumer Revolution Strip */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Producer Consumer</h4>
              <p className="text-xs text-slate-600 mt-1">
                Women entrepreneurs & SHGs sell direct. No mandi, no middleman, full dignity.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black text-sm shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Promoter Consumer</h4>
              <p className="text-xs text-slate-600 mt-1">
                Every member is a promoter. Earn transparent micro-credits on family & team referrals.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black text-sm shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Power Consumer</h4>
              <p className="text-xs text-slate-600 mt-1">
                Save ₹500 to ₹2,000 every month on household expenses via collective bulk power.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
