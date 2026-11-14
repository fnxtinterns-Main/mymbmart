'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DashboardCard } from '@/components/DashboardCard';
import { SavingsOverview } from '@/components/SavingsOverview';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/AuthModal';
import { WithdrawModal } from '@/components/WithdrawModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Footer } from '@/components/Footer';
import { initialUser, initialWallet, initialTransactions, monthlySavings, sampleProducts } from '@/lib/data';
import { CartItem, Transaction, UserProfile, WalletState } from '@/lib/types';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SavingsPage() {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [cartItems] = useState<CartItem[]>([
    { product: sampleProducts[0], quantity: 1 },
    { product: sampleProducts[1], quantity: 1 },
  ]);

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
      <Navbar
        user={user}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-brand-orange" />
              <span>Personal Savings & Micro-Credit Ledger</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              Savings & Wallet Passbook
            </h1>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-orange hover:underline"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DashboardCard
            user={user}
            wallet={wallet}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onViewOrders={() => {}}
            onViewReferrals={() => {}}
          />

          <SavingsOverview
            totalSavings={wallet.totalSavings}
            monthlyData={monthlySavings}
            transactions={transactions}
          />
        </div>
      </main>

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
