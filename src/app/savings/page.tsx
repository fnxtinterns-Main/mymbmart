'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/AuthModal';
import { WithdrawModal } from '@/components/WithdrawModal';
import { SmartChainExplorerModal } from '@/components/SmartChainExplorerModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Footer } from '@/components/Footer';
import { initialUser, initialWallet, initialTransactions, monthlySavings, sampleProducts } from '@/lib/data';
import { CartItem, Transaction, UserProfile, WalletState } from '@/lib/types';
import { getStoredUserSession } from '@/lib/userSession';
import { 
  PiggyBank, 
  Wallet, 
  Users, 
  Package, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Tag, 
  Coins, 
  Gift, 
  ShieldCheck,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

export default function SavingsPage() {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [placedOrdersCount, setPlacedOrdersCount] = useState<number>(0);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('mymbmart_cart');
      if (saved) setCartItems(JSON.parse(saved));

      const orders = JSON.parse(localStorage.getItem('mymbmart_placed_orders') || '[]');
      if (Array.isArray(orders)) {
        setPlacedOrdersCount(orders.length);
      }

      // Hydrate user session from cookie or localStorage
      const session = getStoredUserSession();
      if (session.isLoggedIn && session.user) {
        setUser(session.user);
        const walletBal = session.user.walletBalance;
        if (typeof walletBal === 'number') {
          setWallet((prev) => ({ ...prev, balance: walletBal }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleWithdrawSuccess = (amount: number, payoutInfo: string) => {
    setWallet((prev) => ({ ...prev, balance: prev.balance - amount }));
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      date: 'Just now',
      title: 'Withdrawal to ' + (payoutInfo.includes('@') ? 'UPI' : 'Bank'),
      type: 'WITHDRAWAL',
      amount: -amount,
      status: 'COMPLETED',
      smartChainHash: '0x' + Math.random().toString(16).substring(2, 8),
      description: `Transferred ₹${amount} to ${payoutInfo}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-orange selection:text-white">
      <Navbar
        user={(user.phone || user.email) ? user : null}
        isLoggedIn={Boolean(user.phone || user.email)}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-green uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Personal Savings & Micro-Credit Passbook</span>
            </div>
            <h1 className="text-3xl font-black text-brand-forest tracking-tight mt-1">
              Member Savings Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500">
              Member ID: <strong className="text-brand-forest font-mono">{user.memberId && user.memberId !== 'Guest Member' ? user.memberId : (user.phone || user.email ? 'MBM' + (user.phone ? user.phone.slice(-6) : '782910') : 'Guest Member')}</strong>
            </span>
            <span className="bg-brand-mint text-brand-forest text-xs font-extrabold px-3 py-1 rounded-full">
              {user.level || 'Silver'}
            </span>
          </div>
        </div>

        {/* Dashboard Layout Matching Picture 3 Exactly */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (8 cols): 4 Stat Cards + Categories & Offers */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 4 Top Horizontal Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Card 1: My Savings */}
              <div className="bg-white rounded-2xl border border-emerald-200/90 overflow-hidden shadow-xs hover:shadow-md transition">
                <div className="bg-brand-forest text-white text-[11px] font-bold px-3 py-2 flex items-center space-x-1.5">
                  <PiggyBank className="w-3.5 h-3.5" />
                  <span>My Savings</span>
                </div>
                <div className="p-3.5 space-y-2">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-black text-slate-900">
                      ₹{wallet.totalSavings.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold text-brand-green bg-brand-mint px-1.5 py-0.5 rounded">
                      ↑ 12%
                    </span>
                  </div>
                  <Link href="#breakdown" className="text-[11px] font-bold text-brand-green hover:underline flex items-center space-x-0.5">
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Wallet Balance */}
              <div className="bg-white rounded-2xl border border-orange-200/90 overflow-hidden shadow-xs hover:shadow-md transition">
                <div className="bg-brand-orange text-white text-[11px] font-bold px-3 py-2 flex items-center space-x-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Wallet Balance</span>
                </div>
                <div className="p-3.5 space-y-2">
                  <div className="text-xl font-black text-slate-900">
                    ₹{wallet.balance.toLocaleString('en-IN')}
                  </div>
                  <button 
                    onClick={() => setIsWithdrawOpen(true)}
                    className="text-[11px] font-bold text-brand-orange hover:underline flex items-center space-x-0.5"
                  >
                    <span>Withdraw</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card 3: Referral Rewards */}
              <div className="bg-white rounded-2xl border border-sky-200/90 overflow-hidden shadow-xs hover:shadow-md transition">
                <div className="bg-brand-blue text-white text-[11px] font-bold px-3 py-2 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Referral Rewards</span>
                </div>
                <div className="p-3.5 space-y-2">
                  <div className="text-xl font-black text-slate-900">
                    {user.totalTeamCount} Members
                  </div>
                  <Link href="/refer" className="text-[11px] font-bold text-brand-blue hover:underline flex items-center space-x-0.5">
                    <span>View Referrals</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Card 4: My Orders */}
              <div className="bg-white rounded-2xl border border-emerald-200/90 overflow-hidden shadow-xs hover:shadow-md transition">
                <div className="bg-brand-green text-white text-[11px] font-bold px-3 py-2 flex items-center space-x-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>My Orders</span>
                </div>
                <div className="p-3.5 space-y-2">
                  <div className="text-xl font-black text-slate-900">
                    {placedOrdersCount} {placedOrdersCount === 1 ? 'Order' : 'Orders'}
                  </div>
                  <Link href="/shop" className="text-[11px] font-bold text-brand-green hover:underline flex items-center space-x-0.5">
                    <span>Track Order</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>

            {/* Shop by Category & Big Savings Promo (Matching Picture 3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Category Circle Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                    <span>Shop by Category</span>
                  </h3>
                  <Link href="/shop" className="text-[11px] font-bold text-brand-orange hover:underline">
                    View All →
                  </Link>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center pt-2">
                  <Link href="/shop" className="group">
                    <div className="w-11 h-11 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg group-hover:scale-110 transition border border-emerald-100">
                      🥗
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 block mt-1 truncate">Groceries</span>
                  </Link>

                  <Link href="/shop" className="group">
                    <div className="w-11 h-11 mx-auto rounded-full bg-orange-50 text-brand-orange flex items-center justify-center text-lg group-hover:scale-110 transition border border-orange-100">
                      🏺
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 block mt-1 truncate">SHG Food</span>
                  </Link>

                  <Link href="/shop" className="group">
                    <div className="w-11 h-11 mx-auto rounded-full bg-sky-50 text-brand-blue flex items-center justify-center text-lg group-hover:scale-110 transition border border-sky-100">
                      🧂
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 block mt-1 truncate">Spices</span>
                  </Link>

                  <Link href="/shop" className="group">
                    <div className="w-11 h-11 mx-auto rounded-full bg-purple-50 text-purple-700 flex items-center justify-center text-lg group-hover:scale-110 transition border border-purple-100">
                      👜
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 block mt-1 truncate">Crafts</span>
                  </Link>

                  <Link href="/shop" className="group">
                    <div className="w-11 h-11 mx-auto rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold group-hover:scale-110 transition border border-slate-200">
                      •••
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 block mt-1">More</span>
                  </Link>
                </div>
              </div>

              {/* Big Savings Promo Card */}
              <div className="bg-gradient-to-r from-orange-50 to-brand-mint-light rounded-2xl border border-orange-200 p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange bg-white px-2 py-0.5 rounded-full border border-orange-200">
                    Community Special
                  </span>
                  <h4 className="text-base font-black text-slate-900 leading-tight">
                    Big Savings On Every Purchase
                  </h4>
                  <p className="text-xs text-slate-600">Save 5% to 30% direct from producer</p>
                  <Link
                    href="/shop"
                    className="inline-flex items-center space-x-1 text-xs font-black bg-brand-orange hover:bg-brand-orange-hover text-white px-3.5 py-1.5 rounded-xl shadow-xs transition"
                  >
                    <span>Shop Deals</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-white text-brand-orange flex items-center justify-center text-3xl shadow-xs border border-orange-100">
                  🛒
                </div>
              </div>

            </div>

            {/* Separated 4-Stream Rewards Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4" id="breakdown">
              <h3 className="text-base font-bold text-brand-forest">
                4-Stream Transparent Financial Ledger
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-brand-mint border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Tag className="w-4 h-4 text-brand-green" />
                      <span>Shopping Discounts</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Instant checkout price drops</p>
                  </div>
                  <span className="text-base font-black text-brand-forest">₹{wallet.totalSavings}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Coins className="w-4 h-4 text-brand-blue" />
                      <span>Actual Cashback</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Withdrawable to bank / UPI</p>
                  </div>
                  <span className="text-base font-black text-brand-blue">₹{wallet.actualCashback}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Wallet className="w-4 h-4 text-amber-600" />
                      <span>Wallet Credits</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Store purchase micro-credits</p>
                  </div>
                  <span className="text-base font-black text-amber-700">₹{wallet.walletCredits}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Gift className="w-4 h-4 text-brand-orange" />
                      <span>Referral Rewards</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Direct & team level commissions</p>
                  </div>
                  <span className="text-base font-black text-brand-orange">₹{wallet.referralRewards}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (4 cols): MegaBachatMart Plus Benefits (Picture 3) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Plus Benefits Card */}
            <div className="bg-gradient-to-b from-brand-forest to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-emerald-200 px-2.5 py-0.5 rounded-full">
                  Membership Club
                </span>
                <h3 className="text-2xl font-black tracking-tight mt-1">
                  MegaBachatMart Plus Benefits
                </h3>
              </div>

              <ul className="space-y-3 text-xs text-emerald-100 font-semibold">
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 fill-white" />
                  <span>Exclusive Community Discounts (Up to 30%)</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 fill-white" />
                  <span>Higher Direct Cashback on Essentials</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 fill-white" />
                  <span>Level 1, 2 & 3 Referral Rewards</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 fill-white" />
                  <span>Priority Local Hub Delivery & Support</span>
                </li>
              </ul>

              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-md transition text-xs sm:text-sm flex items-center justify-center space-x-1.5"
              >
                <span>Join Plus Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Smart Chain Verified Passbook */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-green" />
                <span>Recent Smart Ledger Entries</span>
              </h4>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 text-xs">
                {transactions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700">No passbook entries yet</p>
                    <p className="text-[10px] leading-relaxed">
                      Transactions and cryptographic hashes will appear here automatically as you shop or earn referral rewards.
                    </p>
                  </div>
                ) : (
                  transactions.slice(0, 4).map((tx) => (
                    <div key={tx.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 truncate max-w-[160px]">{tx.title}</p>
                        <p className="text-[10px] text-slate-400">{tx.date}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-black ${tx.amount > 0 ? 'text-brand-green' : 'text-slate-800'}`}>
                          {tx.amount > 0 ? `+₹${tx.amount}` : `₹${Math.abs(tx.amount)}`}
                        </span>
                        <p className="font-mono text-[9px] text-slate-400">{tx.smartChainHash}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setIsExplorerOpen(true)}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <span>Inspect Merkle Blocks & Audit Proofs →</span>
              </button>
            </div>

          </div>

        </div>

      </main>

      <SmartChainExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={() => {}}
        onRemoveItem={() => {}}
        onClearCart={() => {}}
        walletBalance={wallet.balance}
        onOrderSuccess={() => {}}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser((p) => ({ ...p, ...u }))}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={wallet.balance}
        onWithdrawSuccess={handleWithdrawSuccess}
      />

      <MobileBottomNav
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <Footer />
    </div>
  );
}
