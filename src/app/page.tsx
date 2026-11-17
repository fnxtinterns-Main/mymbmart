'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/AuthModal';
import { OrderTrackingModal } from '@/components/OrderTrackingModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Footer } from '@/components/Footer';

import { initialUser, initialWallet, sampleProducts } from '@/lib/data';
import { CartItem, ProductItem, UserProfile } from '@/lib/types';
import { OrderRecord, ordersStore } from '@/lib/ordersStore';

import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  Plus,
  Check,
  Tag,
  ShieldCheck,
  HeartHandshake,
  Users,
  Store,
  Clock
} from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load persisted cart from localStorage on mount (starts empty if none)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('mymbmart_cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save cart changes to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('mymbmart_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [orderToast, setOrderToast] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

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
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-orange selection:text-white">
      
      {/* Toast Alert */}
      {orderToast && (
        <div className="fixed top-20 right-4 z-50 bg-brand-forest text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-bold animate-bounce border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{orderToast}</span>
        </div>
      )}

      {/* Main Navbar (Unauthenticated state by default) */}
      <Navbar
        user={user}
        isLoggedIn={isLoggedIn}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 space-y-12 sm:space-y-16 pb-16">
        
        {/* 1. Hero Section (Fresh Green + Saffron Orange + Mint) */}
        <HeroSection
          onShopClick={() => {
            window.location.href = '/shop';
          }}
          onJoinClick={() => setIsAuthOpen(true)}
          onSavingsClick={() => {
            window.location.href = '/savings';
          }}
        />

        {/* 2. Visual Categories & Plus Benefits Row (Matching Picture 5 Exactly) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left 8 Cols: Shop By Category & Big Savings Card */}
            <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
              
              {/* Shop by Category */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-brand-orange text-lg">❖</span>
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Shop by Category</h3>
                  </div>
                  <Link href="/shop" className="text-xs font-bold text-brand-green hover:underline">
                    View All →
                  </Link>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3 text-center">
                  {[
                    { label: 'Grocers', emoji: '🌾', href: '/shop?cat=Groceries' },
                    { label: 'Fruits & Veggies', emoji: '🥦', href: '/shop?cat=Fruits%20%26%20Vegetables' },
                    { label: 'Dairy & Bakery', emoji: '🥛', href: '/shop?cat=Dairy%20%26%20Bakery' },
                    { label: 'FMCG Foods', emoji: '🍿', href: '/shop?cat=FMCG' },
                    { label: 'Consumables', emoji: '🧴', href: '/shop?cat=Consumables' },
                    { label: 'Stationery', emoji: '📚', href: '/shop?cat=Stationery' },
                    { label: 'Bullion (Gold)', emoji: '🪙', href: '/shop?cat=Bullion' },
                    { label: 'SHG Specials', emoji: '🍯', href: '/shop?cat=SHG%20Specials' },
                  ].map((cat, i) => (
                    <Link
                      key={i}
                      href={cat.href}
                      className="group flex flex-col items-center p-2.5 sm:p-3 rounded-2xl bg-slate-50 hover:bg-brand-mint/60 border border-slate-100 hover:border-emerald-300 transition-all shadow-2xs hover:shadow-xs"
                    >
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform mb-1.5">
                        {cat.emoji}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 line-clamp-1 group-hover:text-brand-forest">
                        {cat.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Big Savings On Every Purchase Card */}
              <div className="bg-gradient-to-r from-sky-50 via-emerald-50 to-orange-50 rounded-3xl p-6 border border-sky-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md shadow-orange-500/20">
                    %
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-brand-orange tracking-wider">
                      Community Bulk Power
                    </span>
                    <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                      Big Savings on Every Purchase
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Save directly from local producers & earn micro-credit on every order.
                    </p>
                  </div>
                </div>

                <Link
                  href="/shop"
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full shadow-md shadow-orange-500/20 whitespace-nowrap transition active:scale-95"
                >
                  Shop Deals →
                </Link>
              </div>

            </div>

            {/* Right 4 Cols: MegaBachatMart Plus Benefits (Picture 5 replica) */}
            <div className="lg:col-span-4 bg-gradient-to-b from-brand-mint via-white to-emerald-50/50 rounded-3xl p-6 sm:p-7 border border-emerald-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-green bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                    Prosumer Privilege
                  </span>
                  <h3 className="text-xl font-black text-brand-forest mt-2">
                    MegaBachatMart Plus Benefits
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Free community membership that pays you back as you shop.
                  </p>
                </div>

                <ul className="space-y-3 pt-2">
                  {[
                    'Exclusive Producer Discounts (5% - 30%)',
                    'Higher Cumulative Savings on Staples',
                    'Multi-Level Referral Micro-Credit Rewards',
                    'Priority Local Delivery & Support',
                    'Smart Chain Transparent Earnings Ledger',
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center space-x-2.5 text-xs font-semibold text-slate-800">
                      <div className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center space-x-2 active:scale-95 text-sm"
              >
                <span>Join Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </section>

        {/* 3. Section 3: What is MegaBachatMart? */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-brand-mint via-white to-emerald-50/60 rounded-3xl p-8 sm:p-12 border border-emerald-200/90 shadow-sm relative overflow-hidden">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-brand-forest bg-white/90 border border-emerald-200 px-3.5 py-1 rounded-full shadow-2xs">
                Community E-Commerce Movement
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-forest tracking-tight leading-tight">
                What is MegaBachatMart?
              </h2>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                <strong>MegaBachatMart</strong> is a community-driven e-commerce initiative designed to reduce everyday household consumption expenditure.
                We eliminate corporate middlemen and excessive distribution margins, connecting consumers directly to local producers.
              </p>
              <p className="text-slate-600 text-xs sm:text-sm">
                Your monthly groceries, pantry staples, and authentic handcrafted items from Self Help Groups (SHGs) — now delivered at genuine community bulk prices.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/shop"
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold px-6 py-3 rounded-full text-xs sm:text-sm shadow-md shadow-orange-500/20 transition flex items-center space-x-2"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/producer"
                  className="bg-white hover:bg-brand-mint text-brand-forest font-bold px-6 py-3 rounded-full text-xs sm:text-sm border border-emerald-600 transition"
                >
                  Sell with Us (SHG / Women Makers)
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Section 3: The PROSUMER REVOLUTION (3 Pillars) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
              Producer + Consumer = Prosumer
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-forest tracking-tight">
              The PROSUMER REVOLUTION
            </h2>
            <p className="text-sm text-slate-600">
              You are not just a passive consumer. In MegaBachatMart, you participate in 3 core pillars:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl p-7 border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-mint text-brand-forest flex items-center justify-center font-black text-lg mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900">Producer Consumer</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Women entrepreneurs and Self Help Groups (SHGs) sell their products directly to the community. No wholesale agents, no mandi commissions, and full respect for authentic artisanal craft.
                </p>
              </div>
              <Link
                href="/producer"
                className="text-xs font-bold text-brand-forest hover:text-brand-green flex items-center space-x-1"
              >
                <span>Learn about SHG marketplace</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center font-black text-lg mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900">Promoter Consumer</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Every member can share and promote. Earn transparent micro-credits on direct referrals and multi-level community shopping habits. Your grocery run becomes an earning avenue.
                </p>
              </div>
              <Link
                href="/refer"
                className="text-xs font-bold text-brand-orange hover:text-orange-700 flex items-center space-x-1"
              >
                <span>See Referral & Level Rewards</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl p-7 border border-sky-100 shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-300 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-blue-light text-brand-blue flex items-center justify-center font-black text-lg mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900">Power Consumer</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Harness the collective purchasing power of thousands of households to secure 5% to 30% direct discounts on daily essentials. The larger our community, the greater your savings.
                </p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold text-brand-blue hover:text-sky-800 flex items-center space-x-1"
              >
                <span>Browse Discounted Products</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </section>

        {/* 4. Popular Daily Essentials (Blinkit Style Quick-Commerce Clean Layout) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-brand-green uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Fast Local Delivery • Direct From Farm & SHG Artisans</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Popular Daily Essentials
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-bold text-brand-orange hover:underline flex items-center space-x-1"
            >
              <span>Explore All Categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {sampleProducts.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-104 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-brand-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      {product.discountPercent}% OFF
                    </div>
                    {product.isSHG && (
                      <div className="absolute bottom-2 left-2 bg-brand-forest/90 text-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        SHG Handcrafted
                      </div>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{product.unit}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                  <div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        ₹{product.bachatPrice}
                      </span>
                      <span className="text-[11px] text-slate-400 line-through">
                        ₹{product.mrp}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-green block">
                      Save ₹{product.mrp - product.bachatPrice}
                    </span>
                  </div>

                  {/* Blinkit style ADD button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                      addedId === product.id
                        ? 'bg-brand-green text-white border-brand-green'
                        : 'bg-emerald-50 hover:bg-brand-green hover:text-white text-brand-forest border-emerald-300 shadow-2xs active:scale-95'
                    }`}
                  >
                    {addedId === product.id ? 'ADDED' : '+ ADD'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Section 4: How It Works — 4 Simple Steps */}
        <section className="bg-brand-mint/30 py-12 sm:py-16 border-y border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-brand-forest uppercase tracking-wider">
                Transparent & Rewarding
              </span>
              <h2 className="text-3xl font-black text-brand-forest tracking-tight">
                How It Works — 4 Simple Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-2 hover:border-emerald-300 transition">
                <span className="text-2xl font-black text-brand-orange">01</span>
                <h4 className="text-base font-bold text-slate-900">Join Free</h4>
                <p className="text-xs text-slate-600">
                  Register in 1 minute using Mobile or Email OTP. Zero registration fees, zero hidden deductions.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-2 hover:border-emerald-300 transition">
                <span className="text-2xl font-black text-brand-green">02</span>
                <h4 className="text-base font-bold text-slate-900">Shop & Save</h4>
                <p className="text-xs text-slate-600">
                  Save 5% to 30% instantly on groceries, pantry staples, and authentic SHG regional products.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-2 hover:border-emerald-300 transition">
                <span className="text-2xl font-black text-brand-blue">03</span>
                <h4 className="text-base font-bold text-slate-900">Refer & Earn</h4>
                <p className="text-xs text-slate-600">
                  Share your referral link with family, neighbors, and friends directly on WhatsApp.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-2 hover:border-emerald-300 transition">
                <span className="text-2xl font-black text-purple-600">04</span>
                <h4 className="text-base font-bold text-slate-900">Grow & Redeem</h4>
                <p className="text-xs text-slate-600">
                  Redeem earned micro-credits on subsequent orders or withdraw earnings straight to your UPI or bank.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 6. Section 5: Who is MegaBachatMart For? */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-brand-forest uppercase tracking-wider">
              Empowerment For Every Community Segment
            </span>
            <h2 className="text-3xl font-black text-brand-forest tracking-tight">
              Who is MegaBachatMart For?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-3 hover:border-emerald-300 transition">
              <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-green flex items-center justify-center font-bold">
                ₹
              </div>
              <h4 className="text-lg font-bold text-slate-900">For Everyday Households</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Save between ₹500 and ₹2,000 every month on your essential grocery basket through direct-from-source community pricing.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-xs space-y-3 hover:border-orange-300 transition">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-bold">
                ♀
              </div>
              <h4 className="text-lg font-bold text-slate-900">For Women & SHGs</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take your home-made spices, pickles, snacks, and crafts to thousands of active community buyers with zero upfront store costs.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-xs space-y-3 hover:border-sky-300 transition">
              <div className="w-10 h-10 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center font-bold">
                ⚡
              </div>
              <h4 className="text-lg font-bold text-slate-900">For Youth & Promoters</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Turn your digital network into a dependable side micro-credit income stream by building an active neighborhood prosumer cluster.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Final Call to Action */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-brand-forest to-emerald-900 rounded-3xl p-8 sm:p-14 text-center text-white shadow-xl space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Your Spending. Your Earnings. Your Community.
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base max-w-2xl mx-auto">
              Join <strong>MegaBachatMart</strong> today. Be a Prosumer. Lower household expenditure, empower local makers, and build community prosperity together.
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
                Become a Producer (SHG / Women Entrepreneur)
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
        walletBalance={initialWallet.balance}
        onOrderSuccess={(orderData) => {
          setActiveOrder(orderData);
          setIsTrackingOpen(true);
          setOrderToast(`Order #${orderData.orderNumber || ''} Confirmed! Secret OTP: ${orderData.deliveryOtp || ''}`);
          setTimeout(() => setOrderToast(null), 5000);
        }}
      />

      {/* Live Order Tracking & Dispatch Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        order={activeOrder}
        onOrderUpdated={(updated) => setActiveOrder(updated)}
      />

      {/* Auth Modal (Sign In / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => {
          setUser({ ...initialUser, ...u });
          setIsLoggedIn(true);
        }}
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
