'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  PiggyBank, 
  Users, 
  Handshake, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  BadgeCheck, 
  CheckCircle2,
  ChevronRight
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
    <section className="relative overflow-hidden w-full max-w-full bg-gradient-to-b from-brand-mint/40 via-white to-slate-50 pt-4 pb-10 sm:pt-6 sm:pb-14 border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* 1. Top Hero Graphic Banner (High-Resolution 3072x1017 for Smart Boards & 4K Displays) */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-emerald-950/5 border border-emerald-200/90 bg-white group cursor-pointer">
          <div className="relative w-full aspect-[3072/1017]">
            <Image
              src="/images/hero_banner.jpg"
              alt="MegaBachatMart - Bachat Bhi. Kamai Bhi! Shop Smart. Save More."
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1536px) 1400px, 3072px"
              className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
            />
            {/* Clickable Overlay Link directly into the Shop */}
            <Link
              href="/shop"
              className="absolute inset-0 z-10"
              aria-label="Shop Now at MegaBachatMart"
            />
          </div>
        </div>

        {/* 2. Interactive Mission & Feature Pitch Card (From Before, Just Below) */}
        <div className="bg-gradient-to-br from-brand-mint via-white to-orange-50/50 rounded-3xl p-6 sm:p-10 lg:p-12 border border-emerald-200/80 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
          
          {/* Subtle Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headlines, Pitch & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Top Tag Pill */}
              <div className="inline-flex items-center space-x-2 bg-white/90 border border-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-forest shadow-2xs">
                <Sparkles className="w-4 h-4 text-brand-orange animate-pulse" />
                <span>The PROSUMER Movement: Producer + Consumer</span>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none text-slate-900">
                  <span className="text-brand-forest">Bachat Bhi. </span>
                  <span className="text-brand-orange drop-shadow-2xs">Kamai Bhi!</span>
                  <span className="sr-only"> — MegaBachatMart Hyperlocal Quick Commerce & Community SHG Marketplace</span>
                </h1>
                <p className="text-lg sm:text-xl font-bold text-brand-charcoal">
                  Shop Smart. Save More. Together.
                </p>
              </div>

              {/* Supporting Copy in English */}
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
                <strong>MegaBachatMart</strong> is India's community e-commerce movement where households save on everyday groceries, 
                Self Help Groups (SHGs) and women entrepreneurs sell direct, and every member earns referral micro-credit.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={onShopClick}
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white font-black px-7 py-3 rounded-full shadow-lg shadow-orange-500/25 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onJoinClick}
                  className="bg-white hover:bg-emerald-50 text-brand-forest font-bold px-6 py-3 rounded-full border border-emerald-600 shadow-2xs transition-all text-xs sm:text-sm flex items-center space-x-1.5"
                >
                  <span>Join Free</span>
                </button>

                <button
                  onClick={onSavingsClick}
                  className="bg-brand-green hover:bg-brand-green-hover text-white font-bold px-6 py-3 rounded-full shadow-md shadow-emerald-600/20 transition-all text-xs sm:text-sm flex items-center space-x-1.5"
                >
                  <span>View Savings</span>
                </button>
              </div>

              {/* Trust Badge Strip */}
              <div className="pt-4 border-t border-emerald-100 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600 font-medium">
                <span className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                  <span>Powered by FutureNxt E-Commerce</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <BadgeCheck className="w-4 h-4 text-brand-blue" />
                  <span>Digital Support by TechNxtAI</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Transparent Digital Finance</span>
                </span>
              </div>
            </div>

            {/* Right Column: 3 Feature Cards (White Elevated Cards on Mint) */}
            <div className="lg:col-span-5 flex flex-col space-y-3.5">
              
              {/* Feature Pill 1: Save 5% - 30% Instantly */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 flex items-center space-x-4 border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-brand-mint text-brand-green flex items-center justify-center shrink-0 border border-emerald-200">
                  <PiggyBank className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Save 5% – 30% Instantly</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Direct producer pricing & community bulk discounts on daily essentials.</p>
                </div>
              </div>

              {/* Feature Pill 2: Earn via Referrals */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 flex items-center space-x-4 border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-300 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 border border-orange-200">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Earn via Referrals</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Micro-credits on Level 1, 2, and 3 downline member shopping habits.</p>
                </div>
              </div>

              {/* Feature Pill 3: Easy & 100% Trusted */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 flex items-center space-x-4 border border-sky-100 shadow-sm hover:shadow-md hover:border-sky-300 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-brand-blue-light text-brand-blue flex items-center justify-center shrink-0 border border-sky-200">
                  <Handshake className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Easy & 100% Trusted</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Empowering SHGs, women makers, and local farmers with zero middlemen.</p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* 3. 3 Pillars of Prosumer Revolution Strip (Light Mint & Charcoal) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex items-start space-x-4 hover:border-emerald-300 transition">
            <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-forest flex items-center justify-center font-black text-sm shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-brand-forest text-sm">Producer Consumer</h4>
              <p className="text-xs text-slate-600 mt-1">
                Women entrepreneurs & SHGs sell direct. No intermediaries, no heavy cuts, full dignity.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs flex items-start space-x-4 hover:border-orange-300 transition">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black text-sm shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-brand-orange text-sm">Promoter Consumer</h4>
              <p className="text-xs text-slate-600 mt-1">
                Every member is a promoter. Earn transparent micro-credits on family & team referrals.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-start space-x-4 hover:border-sky-300 transition">
            <div className="w-10 h-10 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center font-black text-sm shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-brand-blue text-sm">Power Consumer</h4>
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
