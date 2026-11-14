'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ShoppingBag, 
  Users, 
  Crown, 
  TrendingUp, 
  Tag, 
  Coins, 
  Gift, 
  Info, 
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { UserProfile, WalletState } from '@/lib/types';

interface DashboardCardProps {
  user: UserProfile;
  wallet: WalletState;
  onOpenWithdraw: () => void;
  onViewOrders: () => void;
  onViewReferrals: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  user,
  wallet,
  onOpenWithdraw,
  onViewOrders,
  onViewReferrals,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-lg shadow-slate-100/80 space-y-6">
      
      {/* Header: Member Profile & Active Status */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-navy to-emerald-600 text-white flex items-center justify-center text-xl font-black shadow-md">
              {user.name.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{user.name}</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                Active Member
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Member ID: <span className="font-mono font-bold text-slate-800">{user.memberId}</span>
            </p>
          </div>
        </div>

        {/* Level badge */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold text-slate-400">Membership Tier</span>
          <div className="flex items-center space-x-1 text-amber-600 font-extrabold text-sm">
            <Crown className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span>{user.level}</span>
          </div>
        </div>
      </div>

      {/* Main Wallet Balance Box */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-orange-200/70 rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
              <div className="p-1.5 rounded-lg bg-brand-orange/20 text-brand-orange">
                <Wallet className="w-4 h-4" />
              </div>
              <span>Spendable Wallet Balance</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              ₹ {wallet.balance.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500">
              Micro-credits available for instant checkout redemption or withdrawal
            </p>
          </div>

          <button
            onClick={onOpenWithdraw}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <span>Withdraw</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 4 Stat Tiles (Mockup replica) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Tile 1: Total Savings */}
        <div className="bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 transition text-left">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
            <Tag className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-emerald-800">Total Savings</span>
          <div className="text-lg font-black text-emerald-900">
            ₹ {wallet.totalSavings.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Tile 2: Referrals */}
        <div 
          onClick={onViewReferrals}
          className="bg-orange-50/60 hover:bg-orange-50 border border-orange-100 rounded-2xl p-3.5 transition text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-orange-800">Referrals</span>
          <div className="text-lg font-black text-orange-900">
            {user.totalTeamCount} Members
          </div>
        </div>

        {/* Tile 3: My Orders */}
        <div 
          onClick={onViewOrders}
          className="bg-sky-50/60 hover:bg-sky-50 border border-sky-100 rounded-2xl p-3.5 transition text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-sky-800">My Orders</span>
          <div className="text-lg font-black text-sky-900">
            8 Orders
          </div>
        </div>

        {/* Tile 4: My Level */}
        <div className="bg-purple-50/60 hover:bg-purple-50 border border-purple-100 rounded-2xl p-3.5 transition text-left">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
            <Crown className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-purple-800">My Level</span>
          <div className="text-lg font-black text-purple-900">
            {user.level} Tier
          </div>
        </div>

      </div>

      {/* 4-Stream Rewards & Savings Clear Distinction (User's Critical Recommendation) */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 p-3 rounded-xl transition"
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-orange" />
            <span>View Separated Earning Streams & Transparent Ledger</span>
          </div>
          <ChevronRight className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-90' : ''}`} />
        </button>

        {showBreakdown && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              To keep full financial clarity, MegaBachatMart separates your earnings into 4 clear categories:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Shopping Discounts</span>
                  </span>
                  <span className="font-black text-emerald-700">₹ 1,250</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Instant price drop from MRP at checkout.</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Coins className="w-3.5 h-3.5 text-sky-600" />
                    <span>Actual Cashback</span>
                  </span>
                  <span className="font-black text-sky-700">₹ {wallet.actualCashback}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Real cash returned directly to your wallet.</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-600" />
                    <span>Wallet Credits</span>
                  </span>
                  <span className="font-black text-amber-700">₹ {wallet.walletCredits}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Promotional and loyalty credits redeemable 100%.</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Gift className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Referral Rewards</span>
                  </span>
                  <span className="font-black text-brand-orange">₹ {wallet.referralRewards}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Direct & multi-level downline commissions.</p>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
};
