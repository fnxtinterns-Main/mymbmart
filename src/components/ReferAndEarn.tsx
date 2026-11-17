'use client';

import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  MessageCircle, 
  Sparkles, 
  Users, 
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface ReferAndEarnProps {
  user: UserProfile;
}

export const ReferAndEarn: React.FC<ReferAndEarnProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(5);
  const [avgSpend, setAvgSpend] = useState(1500);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `🚨 PROSUMER REVOLUTION HAS BEGUN! 🚨\n\nUntil now you were only a CONSUMER. Now become a PROSUMER.\n\n🛒 MegaBachatMart - www.mymbmart.com\n✅ Daily essential savings (10-30%)\n✅ Direct from Women Entrepreneurs & SHGs\n✅ Refer friends & earn MICRO-CREDITS!\n\nUse my Referral Code: *${user.referralCode}*\n\n👉 Join Free: https://www.mymbmart.com?ref=${user.referralCode}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Micro-Credit simulation:
  // Direct Level 1 (5% avg commission)
  // Level 2 (5 each = 25 people, 2% commission)
  const l1Earn = Math.round(referralCount * avgSpend * 0.05);
  const l2Count = referralCount * 4;
  const l2Earn = Math.round(l2Count * avgSpend * 0.02);
  const totalEstMonthly = l1Earn + l2Earn;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-lg shadow-slate-100/80 flex flex-col justify-between space-y-6">
      
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-brand-forest font-extrabold text-base sm:text-lg pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center">
            <Share2 className="w-4 h-4" />
          </div>
          <span>Refer & Earn</span>
        </div>

        <p className="text-sm font-bold text-slate-900 mt-3 text-center">
          Invite your friends & earn extra rewards!
        </p>
        <p className="text-xs text-slate-500 text-center mt-0.5">
          Your everyday shopping habit becomes a transparent income stream.
        </p>

        {/* Gift Box Graphic (Mockup replica) */}
        <div className="py-4 flex justify-center">
          <div className="relative w-28 h-28 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-sky-500/20 transform hover:scale-105 transition-transform">
            <div className="absolute inset-x-0 h-6 bg-amber-400/90 top-1/2 -translate-y-1/2"></div>
            <div className="absolute inset-y-0 w-6 bg-amber-400/90 left-1/2 -translate-x-1/2"></div>
            <Gift className="w-14 h-14 text-white z-10 drop-shadow-md" />
            <div className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
              Micro-Credit
            </div>
          </div>
        </div>

        {/* Referral Code Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Your Referral Code
          </span>
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl font-black font-mono tracking-widest text-brand-forest">
              {user.referralCode}
            </span>
            <button
              onClick={copyReferralCode}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition text-slate-700 shadow-sm"
              title="Copy Referral Code"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {copied && (
            <p className="text-[11px] text-emerald-600 font-bold animate-pulse">
              Referral code copied to clipboard!
            </p>
          )}
        </div>

        {/* Share on WhatsApp Button (Mockup replica) */}
        <button
          onClick={shareOnWhatsApp}
          className="w-full mt-4 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2.5 transition-all transform active:scale-98 text-sm sm:text-base"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
          <span>Share on WhatsApp</span>
        </button>
      </div>

      {/* Interactive Downline Commission Calculator */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-brand-orange" />
            <span>Community Earnings Calculator</span>
          </span>
          <span className="text-emerald-700 font-black">₹{totalEstMonthly}/month</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Direct Referrals</span>
            <span className="font-bold text-slate-800">{referralCount} Members</span>
          </div>
          <input
            type="range"
            min="2"
            max="25"
            value={referralCount}
            onChange={(e) => setReferralCount(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-orange"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-1">
          <div className="bg-white p-2 rounded-lg border border-slate-100">
            <span className="font-semibold text-slate-400">Level 1 Direct</span>
            <p className="font-bold text-slate-900 mt-0.5">₹{l1Earn} / mo</p>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-100">
            <span className="font-semibold text-slate-400">Level 2 Team (~{l2Count})</span>
            <p className="font-bold text-slate-900 mt-0.5">₹{l2Earn} / mo</p>
          </div>
        </div>
      </div>

    </div>
  );
};
