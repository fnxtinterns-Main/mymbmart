'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Navbar 
} from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { DashboardCard } from '@/components/DashboardCard';
import { SavingsOverview } from '@/components/SavingsOverview';
import { ReferAndEarn } from '@/components/ReferAndEarn';
import { StoreCatalog } from '@/components/StoreCatalog';
import { CartDrawer } from '@/components/CartDrawer';
import { ProducerSection } from '@/components/ProducerSection';
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
  Coins, 
  Tag, 
  Gift, 
  Wallet,
  Smartphone,
  ChevronRight,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  
  // Initialize cart with the two items from user's mockup:
  // Fresh Vegetables (1 kg) ₹40 and Premium Rice (5 kg) ₹450 -> Total ₹490
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: sampleProducts[0], quantity: 1 },
    { product: sampleProducts[1], quantity: 1 },
  ]);

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [orderToast, setOrderToast] = useState<string | null>(null);

  // Cart operations
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
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => setCartItems([]);

  // Order Placement & Smart Chain Transaction Simulation
  const handleOrderSuccess = (orderData: {
    totalMRP: number;
    totalBachatPrice: number;
    shoppingSavings: number;
    creditDeduction: number;
    finalPayable: number;
  }) => {
    // Generate Smart Chain Hash
    const randomHash = '0x' + Math.random().toString(16).substring(2, 8) + '...' + Math.random().toString(16).substring(2, 6);
    const orderNumber = 'MB-' + Math.floor(1000 + Math.random() * 9000);

    // Update Wallet and Savings
    const cashbackEarned = Math.round(orderData.finalPayable * 0.05); // 5% cashback
    const newSavings = wallet.totalSavings + orderData.shoppingSavings;
    const newBalance = wallet.balance - orderData.creditDeduction + cashbackEarned;

    setWallet((prev) => ({
      ...prev,
      balance: newBalance,
      totalSavings: newSavings,
      actualCashback: prev.actualCashback + cashbackEarned,
      lifetimeEarned: prev.lifetimeEarned + cashbackEarned,
    }));

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      date: 'Just now',
      title: `Order ${orderNumber} Completed`,
      type: 'ACTUAL_CASHBACK',
      amount: cashbackEarned,
      status: 'COMPLETED',
      smartChainHash: randomHash,
      description: `Saved ₹${orderData.shoppingSavings} on shopping + ₹${cashbackEarned} cashback credited`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setOrderToast(`Order #${orderNumber} Confirmed! You saved ₹${orderData.shoppingSavings} and earned ₹${cashbackEarned} cashback.`);
    setTimeout(() => setOrderToast(null), 5000);
  };

  // Withdrawal Simulation
  const handleWithdrawSuccess = (amount: number, payoutInfo: string) => {
    const randomHash = '0x' + Math.random().toString(16).substring(2, 8) + '...' + Math.random().toString(16).substring(2, 6);
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance - amount,
    }));

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      date: 'Just now',
      title: 'Withdrawal to ' + (payoutInfo.includes('@') ? 'UPI' : 'Bank'),
      type: 'WITHDRAWAL',
      amount: -amount,
      status: 'COMPLETED',
      smartChainHash: randomHash,
      description: `Transferred ₹${amount} to ${payoutInfo}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Main UI Content (can render full width or inside the Mobile Device Frame)
  const renderCoreContent = () => (
    <div className="space-y-10 sm:space-y-14">
      
      {/* 1. Hero Section */}
      {activeTab === 'home' && (
        <HeroSection
          onShopClick={() => {
            const el = document.getElementById('store');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else setActiveTab('shop');
          }}
          onJoinClick={() => setIsAuthOpen(true)}
          onSavingsClick={() => {
            const el = document.getElementById('dashboard-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else setActiveTab('savings');
          }}
        />
      )}

      {/* 2. Three Core Experiences Section (Design Layout matching mockup) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="dashboard-section">
        
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-8 gap-2">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-orange uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>3 Core Experiences: Save • Earn • Grow</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              My Mega Bachat Dashboard & Hub
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Real-time Smart Chain Sync • ID: <strong className="text-brand-navy">{user.memberId}</strong>
          </span>
        </div>

        {/* 3 Interactive Cards Grid (Mockup direct replica) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1: My Dashboard & 4-Tier Rewards Separation */}
          <DashboardCard
            user={user}
            wallet={wallet}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onViewOrders={() => setActiveTab('shop')}
            onViewReferrals={() => setActiveTab('refer')}
          />

          {/* Card 2: Savings Overview (Monthly bar chart + Smart Ledger) */}
          <SavingsOverview
            totalSavings={wallet.totalSavings}
            monthlyData={monthlySavings}
            transactions={transactions}
          />

          {/* Card 3: Refer & Earn (Gift box + WhatsApp share + Calculator) */}
          <ReferAndEarn user={user} />

        </div>
      </section>

      {/* 3. Community Store & Catalog */}
      <StoreCatalog
        products={sampleProducts}
        onAddToCart={handleAddToCart}
      />

      {/* 4. Producer & SHG Empowerment Portal */}
      <ProducerSection />

    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Toast Alert */}
      {orderToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs sm:text-sm font-bold animate-bounce border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{orderToast}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        user={user}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWithdraw={() => setIsWithdrawOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobilePreview={isMobilePreview}
        setIsMobilePreview={setIsMobilePreview}
      />

      {/* Main Body */}
      <main className="flex-1">
        {isMobilePreview ? (
          /* iOS / Android Native Mobile Device Preview Frame */
          <div className="py-8 px-4 flex flex-col items-center justify-center bg-slate-900/90 min-h-screen">
            <div className="text-center mb-4 text-white">
              <span className="bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                iOS & Android Mobile Simulator
              </span>
              <p className="text-xs text-slate-300 mt-1">
                Viewing the exact native app layout with iOS notch, safe areas & bottom navigation
              </p>
            </div>

            {/* Smartphone Mockup Frame */}
            <div className="w-full max-w-[390px] h-[844px] bg-slate-100 rounded-[50px] shadow-2xl border-[10px] border-slate-800 overflow-hidden relative flex flex-col">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-0 inset-x-0 h-10 bg-slate-100 z-50 flex items-center justify-between px-7 pt-2 text-[11px] font-bold text-slate-900">
                <span>9:41</span>
                <div className="w-24 h-5 bg-black rounded-full mx-auto"></div>
                <div className="flex items-center space-x-1.5 text-xs">
                  <span>5G</span>
                  <div className="w-4 h-2.5 border border-slate-800 rounded-xs p-0.5">
                    <div className="w-full h-full bg-slate-800"></div>
                  </div>
                </div>
              </div>

              {/* Scrollable Mobile Screen Content */}
              <div className="flex-1 overflow-y-auto pt-10 pb-16">
                {renderCoreContent()}
              </div>

              {/* Native iOS Bottom Bar */}
              <MobileBottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                onOpenCart={() => setIsCartOpen(true)}
              />

              {/* Home Indicator line */}
              <div className="absolute bottom-1 inset-x-0 flex justify-center z-50 pointer-events-none">
                <div className="w-32 h-1 bg-slate-900 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Full Responsive Web Application */
          <>
            {renderCoreContent()}
          </>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        walletBalance={wallet.balance}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Auth Modal (OTP + Password/Google/Apple) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => {
          setUser((prev) => ({ ...prev, ...u }));
        }}
      />

      {/* Withdrawal Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={wallet.balance}
        onWithdrawSuccess={handleWithdrawSuccess}
      />

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens) */}
      {!isMobilePreview && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      {/* Footer */}
      <Footer />

    </div>
  );
}
