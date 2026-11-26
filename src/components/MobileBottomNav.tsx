'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShoppingBag, 
  Wallet, 
  Share2, 
  MoreHorizontal 
} from 'lucide-react';

interface MobileBottomNavProps {
  cartCount: number;
  onOpenCart?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  onOpenCart: _onOpenCart,
}) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-[1px] border-slate-200 py-[0.375rem] px-[0.75rem] z-40 lg:hidden shadow-lg ios-safe-bottom w-[100vw] max-w-[100vw]">
      <div className="flex items-center justify-around w-[100%]">
        
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-[0.25rem] px-[0.5rem] rounded-[0.75rem] transition ${
            isActive('/') ? 'text-brand-forest font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className={`w-[1.25rem] h-[1.25rem] ${isActive('/') ? 'text-brand-forest' : 'text-slate-400'}`} />
          <span className="text-[0.625rem] mt-[0.125rem]">Home</span>
        </Link>

        {/* Shop */}
        <Link
          href="/shop"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isActive('/shop') ? 'text-brand-green font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${isActive('/shop') ? 'text-brand-green' : 'text-slate-400'}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-brand-orange text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Shop</span>
        </Link>

        {/* Wallet / Savings */}
        <Link
          href="/savings"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isActive('/savings') ? 'text-brand-forest font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Wallet className={`w-5 h-5 ${isActive('/savings') ? 'text-brand-forest' : 'text-slate-400'}`} />
          </div>
          <span className="text-[10px] mt-0.5">Savings</span>
        </Link>

        {/* Refer & Earn */}
        <Link
          href="/refer"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isActive('/refer') ? 'text-brand-orange font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Share2 className={`w-5 h-5 ${isActive('/refer') ? 'text-brand-orange' : 'text-slate-400'}`} />
          </div>
          <span className="text-[10px] mt-0.5">Refer</span>
        </Link>

        {/* Producer */}
        <Link
          href="/producer"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isActive('/producer') ? 'text-brand-blue font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 ${isActive('/producer') ? 'text-brand-blue' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5">Producer</span>
        </Link>

      </div>
    </nav>
  );
};
