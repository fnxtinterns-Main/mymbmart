'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  PiggyBank, 
  CheckCircle, 
  ShieldCheck, 
  ExternalLink,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { Transaction } from '@/lib/types';

interface SavingsOverviewProps {
  totalSavings: number;
  monthlyData: { month: string; amount: number }[];
  transactions: Transaction[];
}

export const SavingsOverview: React.FC<SavingsOverviewProps> = ({
  totalSavings,
  monthlyData,
  transactions,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'ledger'>('chart');
  const maxMonthly = Math.max(...monthlyData.map((d) => d.amount), 1);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-lg shadow-slate-100/80 flex flex-col justify-between space-y-6">
      
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800 font-extrabold text-base sm:text-lg">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span>Savings Overview</span>
          </div>

          {/* Toggle between Analytics and Smart Chain Ledger */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'chart' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'ledger' ? 'bg-white shadow-sm text-brand-forest font-bold' : 'text-slate-500'
              }`}
            >
              Smart Ledger
            </button>
          </div>
        </div>

        {/* Total Savings Display */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Cumulative Savings</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                ₹ {totalSavings.toLocaleString('en-IN')}
              </span>
              {totalSavings > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Bachat Active</span>
                </span>
              )}
            </div>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <PiggyBank className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Main Content: Chart or Ledger */}
      {activeTab === 'chart' ? (
        <div className="space-y-4">
          {monthlyData.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1 text-slate-500">
              <PiggyBank className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-slate-700">No monthly savings recorded yet</p>
              <p className="text-[11px]">Save 5% to 30% on groceries to build your monthly savings history.</p>
            </div>
          ) : (
            <div className="h-44 pt-4 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {monthlyData.map((item) => {
                const heightPercent = Math.round((item.amount / maxMonthly) * 100);
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition">
                      ₹{item.amount}
                    </span>
                    <div className="w-full bg-slate-100 rounded-xl h-28 relative overflow-hidden flex items-end">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300 rounded-xl transition-all duration-500"
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Motivational Green Strip */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center space-x-3 text-emerald-800 text-xs font-bold">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span>Shop daily essentials & save with MEGA BACHAT MART!</span>
          </div>
        </div>
      ) : (
        /* Transparent Smart Chain Ledger */
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {transactions.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">No ledger transactions yet</p>
              <p className="text-[11px]">Completed deliveries will record double-entry audit records here.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                <span>TRANSACTION</span>
                <span>SMART CHAIN HASH</span>
              </div>
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{tx.title}</p>
                    <p className="text-[10px] text-slate-400">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {tx.amount > 0 ? `+₹${tx.amount}` : `₹${Math.abs(tx.amount)}`}
                    </span>
                    <p className="font-mono text-[9px] text-brand-forest font-bold flex items-center justify-end space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>{tx.smartChainHash}</span>
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

    </div>
  );
};
