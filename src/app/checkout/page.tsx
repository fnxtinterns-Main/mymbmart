'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { initialUser, initialWallet, sampleProducts } from '@/lib/data';
import { CartItem, UserProfile } from '@/lib/types';
import { calculateSplitPayment } from '@/lib/securityUtils';
import { getStoredUserSession } from '@/lib/userSession';
import { 
  ShieldCheck, 
  Wallet, 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  ShoppingBag,
  MapPin,
  Tag
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [applyCredits, setApplyCredits] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('Main Road, Ranchi Central, Jharkhand - 834001');
  const [paymentMode, setPaymentMode] = useState<'PHONEPE_UPI' | 'COD'>('PHONEPE_UPI');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mymbmart_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCartItems(parsed);
        } else {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }

      const session = getStoredUserSession();
      if (session.isLoggedIn && session.user) {
        setUser(session.user);
        const bal = session.user.walletBalance;
        if (typeof bal === 'number') {
          setWalletBalance(bal);
          if (bal > 0) {
            setApplyCredits(true);
          }
        }
      }
    } catch {
      setCartItems([]);
    }
  }, []);

  const totalMRP = cartItems.reduce((acc, item) => acc + item.product.mrp * item.quantity, 0);
  const totalBachatPrice = cartItems.reduce((acc, item) => acc + item.product.bachatPrice * item.quantity, 0);
  const shoppingSavings = totalMRP - totalBachatPrice;

  // Use real calculateSplitPayment utility function
  const requestedCredits = applyCredits ? walletBalance : 0;
  const splitResult = calculateSplitPayment(totalBachatPrice, requestedCredits, walletBalance);
  const walletAmt = splitResult.walletDeducted;
  const payableAmt = splitResult.gatewayPayable;

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((ci) => ({
            productId: ci.product.id,
            quantity: ci.quantity,
          })),
          deliveryAddress,
          pincode: '834001',
          paymentMethod: paymentMode,
          useWalletCredits: applyCredits,
          userWalletBalance: walletBalance,
          customerName: user.name || 'Customer',
          customerPhone: user.phone || '',
        }),
      });

      const data = await res.json();
      setIsPlacingOrder(false);

      if (data.success && data.order) {
        localStorage.removeItem('mymbmart_cart');
        try {
          const existing = JSON.parse(localStorage.getItem('mymbmart_placed_orders') || '[]');
          localStorage.setItem('mymbmart_placed_orders', JSON.stringify([data.order, ...existing]));
        } catch {}
        const orderId = data.order.orderNumber || data.order.id;
        router.push(`/orders/${orderId}`);
      } else {
        alert(data.message || 'Order failed. Please retry.');
      }
    } catch {
      setIsPlacingOrder(false);
      alert('Network error while placing order. Please check your connection.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar
        user={(user.phone || user.email) ? user : null}
        isLoggedIn={Boolean(user.phone || user.email)}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Checkout & Split Payment
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Guaranteed 20-30 min hyper-local dispatch from Ranchi Central Dark Store.
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
            SmartChain Protected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Items & Address */}
          <div className="md:col-span-2 space-y-4">
            {/* Delivery Address Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                <MapPin className="w-4 h-4 text-brand-green" />
                <span>Delivery Address (Ranchi Pilot Zone)</span>
              </div>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-green bg-slate-50"
              />
            </div>

            {/* Cart Items Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Order Items ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
              </h3>
              <div className="divide-y divide-slate-100">
                {cartItems.map((ci) => (
                  <div key={ci.product.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{ci.product.name}</p>
                      <p className="text-[11px] text-slate-400">Qty: {ci.quantity} • ₹{ci.product.bachatPrice}/unit</p>
                    </div>
                    <span className="text-xs font-black text-slate-900">
                      ₹{ci.product.bachatPrice * ci.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Select Payment Mode
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('PHONEPE_UPI')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 ${
                    paymentMode === 'PHONEPE_UPI'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>PhonePe UPI QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('COD')}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 ${
                    paymentMode === 'COD'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-slate-600" />
                  <span>Cash on Delivery</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Split Payment Bill Summary */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
              <h3 className="text-sm font-black text-slate-900">Bill & Payment Split</h3>

              {/* Wallet Credits Toggle */}
              {walletBalance > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-950">Use Reward Credits</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={applyCredits}
                      onChange={(e) => setApplyCredits(e.target.checked)}
                      className="w-4 h-4 accent-brand-orange cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-amber-800">
                    Balance: ₹{walletBalance} • Max 40% cap: ₹{Math.round(totalBachatPrice * 0.4)}
                  </p>
                </div>
              )}

              {/* Bill Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Total MRP</span>
                  <span className="line-through">₹{totalMRP}</span>
                </div>

                <div className="flex justify-between text-slate-800 font-bold">
                  <span>Bachat Subtotal</span>
                  <span>₹{totalBachatPrice}</span>
                </div>

                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Total Savings</span>
                  <span>-₹{shoppingSavings}</span>
                </div>

                {applyCredits && walletAmt > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold border-t border-slate-100 pt-2">
                    <span>Wallet Credit Deduction</span>
                    <span data-testid="wallet-deduction">-₹{walletAmt}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                  <span>Gateway Payable</span>
                  <span data-testid="gateway-payable" className="text-brand-forest text-base font-black">
                    ₹{payableAmt}
                  </span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full bg-brand-forest hover:bg-emerald-950 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <span>Securing Order...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Place Order (Pay Now ₹{payableAmt})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by MegaBachatMart Smart Ledger</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
