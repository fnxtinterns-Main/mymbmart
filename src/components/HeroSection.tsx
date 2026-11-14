'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
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
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-mint/40 via-white to-slate-50 pt-4 pb-10 sm:pt-6 sm:pb-14 border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Hero Banner (User's Exact Design Graphic) */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-emerald-950/5 border border-emerald-200/90 bg-white group">
          <div className="relative w-full aspect-[1024/341]">
            <Image
              src="/images/hero_banner.jpg"
              alt="MEGA BACHAT MART - Bachat Bhi. Kamai Bhi! Shop Smart. Save More."
              fill
              priority
              className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
            />
            {/* Clickable Overlay Link to Shop */}
            <Link
              href="/shop"
              className="absolute inset-0 z-10"
              aria-label="Shop Now at MEGA BACHAT MART"
            />
          </div>
        </div>

        {/* Quick Action Buttons & Trust Strip */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onShopClick}
              className="bg-brand-orange hover:bg-brand-orange-hover text-white font-black px-7 py-3 rounded-full shadow-lg shadow-orange-500/25 flex items-center space-x-2 text-xs sm:text-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onJoinClick}
              className="bg-white hover:bg-emerald-50 text-brand-forest font-bold px-6 py-3 rounded-full border border-emerald-600 shadow-2xs text-xs sm:text-sm transition-all"
            >
              Join Free Community
            </button>

            <button
              onClick={onSavingsClick}
              className="bg-brand-green hover:bg-brand-green-hover text-white font-bold px-6 py-3 rounded-full shadow-md shadow-emerald-600/20 text-xs sm:text-sm transition-all"
            >
              View Savings
            </button>
          </div>

          {/* Trust Strip */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600 font-medium pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>FutureNxt E-Commerce</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <BadgeCheck className="w-4 h-4 text-brand-blue" />
              <span>Digital Support by TechNxtAI</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Smart Chain Verified</span>
            </span>
          </div>
        </div>

        {/* 3 Pillars of Prosumer Revolution Strip (Light Mint & Charcoal) */}
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
