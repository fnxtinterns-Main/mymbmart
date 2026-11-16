'use client';

import React, { useState, useEffect } from 'react';
import { Users, Award, TrendingUp, ChevronRight, CheckCircle2, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  phone?: string;
  referredBy?: string;
  joinedDate: string;
  monthlySpend: number;
  commissionEarned: number;
  status: string;
  itemsBoughtCount?: number;
}

interface TeamData {
  promoter: {
    name: string;
    memberId: string;
    tierLevel: string;
    referralCode: string;
  };
  summary: {
    totalDirectReferrals: number;
    totalTeamSize: number;
    totalCommissionEarned: number;
    level1Earnings: number;
    level2Earnings: number;
    level3Earnings: number;
  };
  tree: {
    level1Direct: TeamMember[];
    level2Team: TeamMember[];
    level3Community: TeamMember[];
  };
}

export const PromoterTeamView: React.FC = () => {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [activeTab, setActiveTab] = useState<'L1' | 'L2' | 'L3'>('L1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promoter/team')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTeamData(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !teamData) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
        <div className="h-20 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  const currentMembers = 
    activeTab === 'L1' ? teamData.tree.level1Direct :
    activeTab === 'L2' ? teamData.tree.level2Team :
    teamData.tree.level3Community;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-brand-forest" />
            <span>Downline Team Hierarchy (3-Tier)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time shopping activity & commission ledger
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 block">Total Team Commission</span>
          <span className="text-lg font-black text-brand-orange">
            ₹{teamData.summary.totalCommissionEarned}
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
        <div 
          onClick={() => setActiveTab('L1')}
          className={`cursor-pointer p-3 rounded-2xl border transition-all ${
            activeTab === 'L1' 
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-amber-800 block">Level 1 (5%)</span>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
            {teamData.summary.totalDirectReferrals} Friends
          </div>
          <span className="text-[10px] font-bold text-emerald-700">
            ₹{teamData.summary.level1Earnings} earned
          </span>
        </div>

        <div 
          onClick={() => setActiveTab('L2')}
          className={`cursor-pointer p-3 rounded-2xl border transition-all ${
            activeTab === 'L2' 
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-sky-800 block">Level 2 (2%)</span>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
            {teamData.tree.level2Team.length} Members
          </div>
          <span className="text-[10px] font-bold text-emerald-700">
            ₹{teamData.summary.level2Earnings} earned
          </span>
        </div>

        <div 
          onClick={() => setActiveTab('L3')}
          className={`cursor-pointer p-3 rounded-2xl border transition-all ${
            activeTab === 'L3' 
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs' 
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-emerald-800 block">Level 3 (1%)</span>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
            {teamData.tree.level3Community.length} Members
          </div>
          <span className="text-[10px] font-bold text-emerald-700">
            ₹{teamData.summary.level3Earnings} earned
          </span>
        </div>
      </div>

      {/* Member List */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {activeTab === 'L1' ? 'Level 1: Direct Personal Invites (5% commission on all grocery orders)' :
           activeTab === 'L2' ? 'Level 2: Team Members Invited By Your Friends (2% recurring)' :
           'Level 3: Community Downline Shoppers (1% passive override)'}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {currentMembers.map((member) => (
            <div 
              key={member.id}
              className="p-3 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-brand-mint text-brand-forest font-black flex items-center justify-center text-xs">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900">{member.name}</h4>
                  <div className="text-[11px] text-slate-500">
                    <span>Joined {member.joinedDate}</span>
                    {member.referredBy && <span> • Via {member.referredBy}</span>}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-extrabold text-emerald-700">
                  +₹{member.commissionEarned}
                </div>
                <div className="text-[10px] text-slate-400">
                  Spend: ₹{member.monthlySpend}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Commission settled to wallet 48h after delivery</span>
        </span>
        <span className="font-bold text-brand-forest">Active Status: 100% Qualified</span>
      </div>

    </div>
  );
};
