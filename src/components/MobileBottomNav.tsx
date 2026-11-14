'use client';

import React from 'react';
import { 
  Home, 
  ShoppingBag, 
  Wallet, 
  Share2, 
  MoreHorizontal 
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 z-40 lg:hidden shadow-lg ios-safe-bottom">
      <div className="flex items-center justify-around">
        
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'home' ? 'text-brand-navy font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-brand-navy' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Shop */}
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'shop' ? 'text-brand-navy font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${activeTab === 'shop' ? 'text-brand-navy' : 'text-slate-400'}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-brand-orange text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Shop</span>
        </button>

        {/* Wallet / Savings */}
        <button
          onClick={() => setActiveTab('savings')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'savings' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Wallet className={`w-5 h-5 ${activeTab === 'savings' ? 'text-emerald-700' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5">Wallet</span>
        </button>

        {/* Refer & Earn */}
        <button
          onClick={() => setActiveTab('refer')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'refer' ? 'text-brand-orange font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Share2 className={`w-5 h-5 ${activeTab === 'refer' ? 'text-brand-orange' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5">Refer</span>
        </button>

        {/* More / Producer */}
        <button
          onClick={() => setActiveTab('producer')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'producer' ? 'text-brand-navy font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 ${activeTab === 'producer' ? 'text-brand-navy' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5">Producer</span>
        </button>

      </div>
    </nav>
  );
};
