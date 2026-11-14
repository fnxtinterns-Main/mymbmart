'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { DashboardCard } from '@/components/DashboardCard';
import { SavingsOverview } from '@/components/SavingsOverview';
import { ReferAndEarn } from '@/components/ReferAndEarn';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/AuthModal';
import { WithdrawModal } from '@/components/WithdrawModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Footer } from '@/components/Footer';

import { 
  initialUser, 
  initialWallet, 
  initialTransactions, 
  monthlySavings, 
  sampleProducts 
} from '@/lib/data';
import { CartItem, ProductItem, Transaction, UserProfile, WalletState } from '@/lib/types';

import { 
  Sparkles, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Tag, 
  Users,
  Store,
  HeartHandshake,
  TrendingUp,
  Percent,
  ChevronRight,
  Gift
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: sampleProducts[0], quantity: 1 },
    { product: sampleProducts[1], quantity: 1 },
  ]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [orderToast, setOrderToast] = useState<string | null>(null);

  const handleAddToCart = (product: ProductItem) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Toast Alert */}
      {orderToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-bold animate-bounce border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{orderToast}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        user={user}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 space-y-12 sm:space-y-16 pb-16">
        
        {/* 1. Hero Section */}
        <HeroSection
          onShopClick={() => {
            window.location.href = '/shop';
          }}
          onJoinClick={() => setIsAuthOpen(true)}
          onSavingsClick={() => {
            window.location.href = '/savings';
          }}
        />

        {/* 2. Visual Dashboard Sneak-Peek (Directly matching your mockup cards) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-8 gap-2">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-brand-orange uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Bachat & Kamai Live Hub</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Your Community Dashboard At A Glance
              </h2>
            </div>
            <Link
              href="/savings"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-navy hover:text-brand-orange transition"
            >
              <span>Full Passbook & Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Member Profile & Wallet */}
            <DashboardCard
              user={user}
              wallet={wallet}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
              onViewOrders={() => { window.location.href = '/shop'; }}
              onViewReferrals={() => { window.location.href = '/refer'; }}
            />

            {/* Card 2: Savings Overview (Monthly chart) */}
            <SavingsOverview
              totalSavings={wallet.totalSavings}
              monthlyData={monthlySavings}
              transactions={transactions}
            />

            {/* Card 3: Refer & Earn (Gift card + WhatsApp quick share) */}
            <ReferAndEarn user={user} />
          </div>
        </section>

        {/* 3. Section 2: Kya Hai MegaBachatMart? (From pitch) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 via-brand-navy to-emerald-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-white/10 px-3 py-1 rounded-full">
                Community E-Commerce Movement
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Kya Hai MegaBachatMart?
              </h2>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                MegaBachatMart ek community e-commerce initiative hai — <strong>ghar ke roz ke kharche par bachat</strong> ke liye.
                Hum bade brands aur bicholiyon ko hatate hain. <strong>Seedha Producer se Consumer tak.</strong>
              </p>
              <p className="text-slate-300 text-xs sm:text-sm">
                Aapka kirana, household essentials, aur authentic local SHG products — ab genuine community discount price par.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/shop"
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold px-6 py-3 rounded-full text-xs sm:text-sm transition flex items-center space-x-2"
                >
                  <span>Explore Community Products</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/producer"
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-full text-xs sm:text-sm border border-white/20 transition"
                >
                  Sell with Us (SHG / Women Makers)
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Section 3: The PROSUMER REVOLUTION (3 Pillars from pitch) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
              Producer + Consumer = Prosumer
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              The PROSUMER REVOLUTION
            </h2>
            <p className="text-sm text-slate-600">
              Aap sirf consumer nahi hain. Aap MegaBachatMart me 3 pillars ke sath jude hain:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900">Producer Consumer</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Women entrepreneurs aur Self Help Groups (SHGs) apne products seedha community ko bech sakte hain. No mandi, no middleman, full respect for their work.
                </p>
              </div>
              <Link
                href="/producer"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
              >
                <span>Learn about SHG marketplace</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center font-black text-lg mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900">Promoter Consumer</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Har member apne referral se micro-credit kamata hai. Aapne jisko joda, uski shopping se aapko fayda. Aapka shopping habit ek chhota income stream banta hai.
                </p>
              </div>
              <Link
                href="/refer"
                className="text-xs font-bold text-brand-orange hover:text-orange-700 flex items-center space-x-1"
              >
                <span>See Referral & Level Plan</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-brand-cyan flex items-center justify-center font-black text-lg mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900">Power Consumer</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Community ki bulk buying power se har household ko 5% - 30% discount milta hai. Jitni badi community, utni badi har ghar ki bachat.
                </p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold text-brand-cyan hover:text-sky-800 flex items-center space-x-1"
              >
                <span>Browse Discounted Products</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </section>

        {/* 5. Trending Products Preview */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Direct From Farm & SHG Artisans
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Popular Daily Essentials
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-bold text-brand-orange hover:underline flex items-center space-x-1"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {sampleProducts.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 hover:shadow-lg transition flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-brand-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {product.discountPercent}% OFF
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{product.unit}</p>
                  <div className="flex items-baseline space-x-2 pt-1">
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      ₹{product.bachatPrice}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      ₹{product.mrp}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full mt-3 bg-slate-900 hover:bg-brand-orange text-white text-xs font-bold py-2 rounded-xl transition"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Section 4: How It Works — 4 Simple Steps */}
        <section className="bg-slate-100 py-12 sm:py-16 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                Simple & Transparent
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                How It Works — 4 Simple Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
                <span className="text-2xl font-black text-brand-orange">01</span>
                <h4 className="text-base font-bold text-slate-900">Join Free</h4>
                <p className="text-xs text-slate-600">
                  Apne mobile ya email OTP se 1 minute me community member banein. Zero hidden charge.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
                <span className="text-2xl font-black text-emerald-600">02</span>
                <h4 className="text-base font-bold text-slate-900">Shop & Save</h4>
                <p className="text-xs text-slate-600">
                  Daily groceries aur SHG authentic food par 5% - 30% community discount paayein.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
                <span className="text-2xl font-black text-sky-600">03</span>
                <h4 className="text-base font-bold text-slate-900">Refer & Earn</h4>
                <p className="text-xs text-slate-600">
                  Apne parivaar aur doston ko WhatsApp par referral code share karke jodein.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-2">
                <span className="text-2xl font-black text-purple-600">04</span>
                <h4 className="text-base font-bold text-slate-900">Grow & Redeem</h4>
                <p className="text-xs text-slate-600">
                  Micro-credit se agli shopping par discount lein ya direct UPI/Bank transfer karein.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 7. Section 5: Kiske Liye Hai? */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Empowerment For Everyone
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Kiske Liye Hai MegaBachatMart?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                ₹
              </div>
              <h4 className="text-lg font-bold text-slate-900">For Households</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Har mahine ke rashan aur daily needs par ₹500 se ₹2,000 tak ki direct bachat ka guaranteed mauka.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-bold">
                ♀
              </div>
              <h4 className="text-lg font-bold text-slate-900">For Women & SHGs</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apna banaya hua papad, pickle, masala, ya craft poore community tak pahunchayein, bina kisi dukaan ya mandi ke.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-brand-cyan flex items-center justify-center font-bold">
                ⚡
              </div>
              <h4 className="text-lg font-bold text-slate-900">For Youth & Promoters</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apne social circle aur digital network se ek regular side micro-credit income stream banayein.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Final CTA (From pitch) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-900 to-brand-navy rounded-3xl p-8 sm:p-14 text-center text-white shadow-2xl space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Aapka Kharcha. Aapki Kamai. Aapki Community.
            </h2>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto">
              Join MegaBachatMart Today. Be a Prosumer. Ghar ka kharcha kam karo, local producer ko aage badhao, aur community ko hi ameer banao.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-extrabold px-8 py-4 rounded-full shadow-lg shadow-orange-500/30 text-sm sm:text-base transition"
              >
                Join Now — It's Free
              </button>
              <Link
                href="/producer"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-full border border-white/30 text-sm sm:text-base transition"
              >
                Become a Seller (SHG / Women Entrepreneur)
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        walletBalance={wallet.balance}
        onOrderSuccess={(orderData) => {
          setOrderToast(`Order Confirmed! You saved ₹${orderData.shoppingSavings}.`);
          setTimeout(() => setOrderToast(null), 4000);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser((p) => ({ ...p, ...u }))}
      />

      {/* Withdrawal Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={wallet.balance}
        onWithdrawSuccess={handleWithdrawSuccess}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Footer */}
      <Footer />

    </div>
  );
}
