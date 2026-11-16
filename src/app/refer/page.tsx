'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ReferAndEarn } from '@/components/ReferAndEarn';
import { PromoterTeamView } from '@/components/PromoterTeamView';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/AuthModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Footer } from '@/components/Footer';
import { initialUser, initialWallet, sampleProducts } from '@/lib/data';
import { CartItem, UserProfile } from '@/lib/types';
import { Sparkles, Users, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ReferPage() {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('mymbmart_cart');
      if (saved) setCartItems(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar
        user={user.phone ? user : null}
        isLoggedIn={Boolean(user.phone)}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-orange-800 bg-orange-100 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Promoter Consumer Movement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Refer & Earn Micro-Credit
          </h1>
          <p className="text-sm text-slate-600">
            Shopping is no longer an expense — it is an income opportunity. Earn transparent micro-credits through direct referrals and 3-tier community shopping networks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-6">
            <ReferAndEarn user={user} />
            <PromoterTeamView />
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-brand-navy" />
                <span>How Multi-Level Referral Works</span>
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-1">
                  <h4 className="font-bold text-orange-950">1. DIRECT REFERRAL (Level 1)</h4>
                  <p className="text-slate-600 text-xs">
                    When you invite neighbors or friends and they place their first order, you receive instant direct micro-credit rewards.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1">
                  <h4 className="font-bold text-sky-950">2. COMMUNITY TEAM INCOME (Level 2 & 3)</h4>
                  <p className="text-slate-600 text-xs">
                    When members invited by your network purchase everyday staples, you continue earning recurring community micro-credits.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                  <h4 className="font-bold text-emerald-950">3. COMMUNITY-FIRST ETHOS</h4>
                  <p className="text-slate-600 text-xs">
                    Zero spam, zero pressure. Connect households who genuinely want to save on groceries and support local women entrepreneurs.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Every transaction is recorded transparently on the smart chain ledger.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={() => {}}
        onRemoveItem={() => {}}
        onClearCart={() => {}}
        walletBalance={initialWallet.balance}
        onOrderSuccess={() => {}}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser((p) => ({ ...p, ...u }))}
      />

      <MobileBottomNav
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <Footer />
    </div>
  );
}
