'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  ShoppingBag, 
  Tag, 
  Wallet, 
  Sparkles,
  ShieldCheck,
  Zap,
  Truck,
  Check,
  QrCode,
  Smartphone,
  Copy,
  CreditCard
} from 'lucide-react';
import { CartItem } from '@/lib/types';
import { getStoredUserSession } from '@/lib/userSession';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  walletBalance: number;
  onOrderSuccess: (orderData: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  walletBalance,
  onOrderSuccess,
}) => {
  const [step, setStep] = useState<'CART' | 'PAYMENT'>('CART');
  const [paymentMode, setPaymentMode] = useState<'PHONEPE_UPI' | 'COD'>('PHONEPE_UPI');
  const [upiUtr, setUpiUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [applyCredits, setApplyCredits] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('Main Road, Ranchi Central, Jharkhand - 834001');

  // Debounced server preview validation (250ms debounce)
  useEffect(() => {
    if (cartItems.length === 0) return;
    const timeout = setTimeout(() => {
      fetch('/api/checkout/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((ci) => ({
            productId: ci.product.id,
            quantity: ci.quantity,
          })),
          fulfilmentType: 'HOME_DELIVERY',
        }),
      }).catch(() => {});
    }, 250);

    return () => clearTimeout(timeout);
  }, [cartItems]);

  if (!isOpen) return null;

  // Split into Quick Commerce vs. Marketplace items
  const quickItems = cartItems.filter((i) => i.product.category !== 'Home & Kitchen');
  const marketplaceItems = cartItems.filter((i) => i.product.category === 'Home & Kitchen');

  const totalMRP = cartItems.reduce((acc, item) => acc + item.product.mrp * item.quantity, 0);
  const totalBachatPrice = cartItems.reduce((acc, item) => acc + item.product.bachatPrice * item.quantity, 0);
  const shoppingSavings = totalMRP - totalBachatPrice;

  const quickSubtotal = quickItems.reduce((acc, item) => acc + item.product.bachatPrice * item.quantity, 0);
  const marketplaceSubtotal = marketplaceItems.reduce((acc, item) => acc + item.product.bachatPrice * item.quantity, 0);

  // Delivery Fees:
  // Quick commerce free above ₹199, else ₹29
  // Marketplace free above ₹499, else ₹49
  const quickDeliveryFee = quickItems.length > 0 ? (quickSubtotal >= 199 ? 0 : 29) : 0;
  const marketplaceDeliveryFee = marketplaceItems.length > 0 ? (marketplaceSubtotal >= 499 ? 0 : 49) : 0;
  const totalDeliveryFee = quickDeliveryFee + marketplaceDeliveryFee;

  // Total Cashback earnable
  const totalCashbackEarnable = cartItems.reduce(
    (acc, item) => acc + (item.product.cashbackAmount || 0) * item.quantity, 
    0
  );

  // Max wallet credit that can be applied (up to 40% of subtotal or available balance)
  const maxCreditToUse = Math.min(walletBalance, Math.round(totalBachatPrice * 0.4));
  const creditDeduction = applyCredits ? maxCreditToUse : 0;
  const finalPayable = Math.max(0, totalBachatPrice + totalDeliveryFee - creditDeduction);

  const handleCopyUpiId = () => {
    navigator.clipboard?.writeText('9801506511@ybl');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  const handlePlaceOrder = async () => {
    setIsCheckingOut(true);
    const session = getStoredUserSession();
    try {
      const res = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((ci) => ({
            productId: ci.product.id,
            quantity: ci.quantity,
          })),
          customerName: session.user?.name || 'Customer',
          customerPhone: session.user?.phone || '+91 98015 06511',
          customerEmail: session.user?.email || '',
          deliveryAddress,
          pincode: '834001',
          paymentMethod: paymentMode,
          upiTransactionId: paymentMode === 'PHONEPE_UPI' ? (upiUtr || `UPI-TXN-${Date.now().toString().slice(-6)}`) : undefined,
          useWalletCredits: applyCredits,
          userWalletBalance: walletBalance,
        }),
      });
      const data = await res.json();
      setIsCheckingOut(false);
      if (data.success && data.order) {
        // Save order to browser storage so admin dashboard & user tracking stay in sync
        try {
          const existing = JSON.parse(localStorage.getItem('mymbmart_placed_orders') || '[]');
          localStorage.setItem('mymbmart_placed_orders', JSON.stringify([data.order, ...existing]));
        } catch {}

        onOrderSuccess(data.order);
        onClearCart();
        setStep('CART');
        onClose();
      } else {
        alert(data.message || 'Unable to place order. Please try again.');
      }
    } catch (e) {
      setIsCheckingOut(false);
      alert('Unable to connect to order server. Please check your network and try again.');
    }
  };

  const renderItemRow = (item: CartItem) => (
    <div 
      key={item.product.id}
      className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center space-x-3 shadow-2xs hover:border-slate-300 transition"
    >
      {/* Thumbnail */}
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
        <Image
          src={item.product.image}
          alt={item.product.name}
          fill
          className="object-cover"
          sizes="56px"
        />
        {item.product.isSHG && (
          <span className="absolute top-1 left-1 bg-brand-forest text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
            SHG
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-900 truncate">
          {item.product.name}
        </h4>
        <p className="text-[11px] text-slate-500">{item.product.unit}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs font-black text-brand-forest">
            ₹{item.product.bachatPrice}
          </span>
          <span className="text-[10px] text-slate-400 line-through">
            ₹{item.product.mrp}
          </span>
          {item.product.cashbackAmount && item.product.cashbackAmount > 0 && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              +₹{item.product.cashbackAmount * item.quantity} back
            </span>
          )}
        </div>
      </div>

      {/* Counter Controls */}
      <div className="flex items-center space-x-1.5 bg-slate-100 rounded-xl p-1 shrink-0">
        <button
          onClick={() => onUpdateQuantity(item.product.id, -1)}
          className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center shadow-xs hover:bg-slate-200 active:scale-95 transition"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-black text-slate-900 w-5 text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.product.id, 1)}
          className="w-6 h-6 rounded-lg bg-brand-orange text-white flex items-center justify-center shadow-xs hover:bg-brand-orange-hover active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div data-testid="cart-drawer" className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-3">
              {step === 'PAYMENT' ? (
                <button 
                  onClick={() => setStep('CART')}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <span>{step === 'PAYMENT' ? 'Scan & Pay' : 'My Cart'}</span>
                <span className="text-xs font-bold bg-brand-orange text-white px-2.5 py-0.5 rounded-full">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
                </span>
              </h2>
            </div>

            {step === 'CART' && cartItems.length > 0 && (
              <button
                onClick={onClearCart}
                className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                title="Clear Cart"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* MAIN BODY: STEP 1 (CART) VS STEP 2 (PAYMENT) */}
          {step === 'PAYMENT' ? (
            /* ========================================================== */
            /* STEP 2: PHONEPE UPI QR CODE & PAYMENT SELECTION */
            /* ========================================================== */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/60">
              
              {/* Payment Mode Selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPaymentMode('PHONEPE_UPI')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
                    paymentMode === 'PHONEPE_UPI'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>PhonePe UPI QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('COD')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
                    paymentMode === 'COD'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Truck className="w-4 h-4 text-slate-600" />
                  <span>Cash on Delivery</span>
                </button>
              </div>

              {/* Amount to Pay Banner */}
              <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">Total Amount Payable</span>
                    <span className="text-3xl font-black text-white mt-0.5 block">₹{finalPayable}</span>
                  </div>
                  <span className="bg-emerald-500/30 text-emerald-100 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-400/40">
                    Saved ₹{shoppingSavings + creditDeduction}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-emerald-700/60 flex items-center justify-between text-[11px] text-emerald-200">
                  <span>Delivering in 20-30 Mins</span>
                  <span className="font-bold text-white">Ranchi Central Hub</span>
                </div>
              </div>

              {paymentMode === 'PHONEPE_UPI' ? (
                /* PhonePe QR Code Container */
                <div className="bg-white rounded-3xl p-5 border-2 border-emerald-500/40 shadow-sm space-y-4 text-center">
                  <div className="inline-flex items-center space-x-1.5 bg-[#5F259F]/10 text-[#5F259F] px-3 py-1 rounded-full text-xs font-black">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Official PhonePe Merchant QR</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Scan with <b>PhonePe</b>, <b>Google Pay</b>, <b>Paytm</b>, or any UPI app to pay instantly.
                  </p>

                  {/* QR Image Preview */}
                  <div className="relative mx-auto w-56 h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-black">
                    <Image
                      src="/images/phonepe-qr.jpg"
                      alt="PhonePe UPI QR Code - FUTURENXT"
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  </div>

                  {/* Merchant Details & UPI Copy */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Merchant Name:</span>
                      <span className="font-bold text-slate-900">FUTURENXT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">UPI ID:</span>
                      <div className="flex items-center space-x-1.5">
                        <code className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          9801506511@ybl
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyUpiId}
                          className="text-slate-400 hover:text-emerald-700 transition"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap Pay via UPI button for Mobile users */}
                  <a
                    href={`upi://pay?pa=9801506511@ybl&pn=FUTURENXT&am=${finalPayable}&cu=INR&tn=MegaBachatMart%20Order`}
                    className="w-full bg-[#5F259F] hover:bg-[#4E1E83] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Open in PhonePe / UPI App</span>
                  </a>

                  {/* UTR Input Field */}
                  <div className="text-left pt-2">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      UPI Ref / UTR Number (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12-digit UTR from payment receipt"
                      value={upiUtr}
                      onChange={(e) => setUpiUtr(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Helps our central dispatch desk auto-verify your payment in 10 seconds.
                    </p>
                  </div>
                </div>
              ) : (
                /* Cash on Delivery Info */
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 text-center">Cash / UPI on Delivery</h4>
                  <p className="text-xs text-slate-600 text-center leading-relaxed">
                    Pay <b>₹{finalPayable}</b> in cash or scan rider's QR code at your doorstep upon receiving your sealed MegaBachatMart package.
                  </p>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-[11px] text-amber-900">
                    💡 <b>Tip:</b> Keep exact change ready for 10-second fast delivery handover!
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Delivering to: </span>
                <span>{deliveryAddress}</span>
              </div>

              {/* Confirm Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isCheckingOut}
                data-testid="confirm-order-btn"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all active:scale-98 text-base cursor-pointer"
              >
                {isCheckingOut ? (
                  <span>Securing Order & Notifying Dark Store...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>
                      {paymentMode === 'PHONEPE_UPI' 
                        ? `I Have Paid ₹${finalPayable} (Confirm Order)` 
                        : `Place COD Order (₹${finalPayable})`}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bank Gateway in review • PhonePe UPI Active & Verified</span>
              </div>

            </div>
          ) : (
            /* ========================================================== */
            /* STEP 1: CART ITEMS & BILL SUMMARY */
            /* ========================================================== */
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Explore fresh farm produce, groceries, and authentic SHG products at community discount prices.
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. Quick Commerce Sub-Order */}
                  {quickItems.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-200">
                        <div className="flex items-center space-x-2 text-xs font-black text-emerald-900">
                          <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600 shrink-0" />
                          <span>Quick Delivery (20–30 Mins)</span>
                        </div>
                        <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-300">
                          Ranchi Dark Store
                        </span>
                      </div>

                      {/* Free Delivery Progress */}
                      {quickSubtotal < 199 ? (
                        <div className="bg-amber-50 text-[11px] text-amber-800 p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                          <span>Add <b>₹{199 - quickSubtotal}</b> more for FREE Delivery!</span>
                          <span className="text-[10px] font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded">
                            Standard Fee: ₹29
                          </span>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 text-[11px] text-emerald-800 p-2 rounded-xl border border-emerald-200 flex items-center space-x-1.5 font-bold">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>You unlocked FREE 20-min Quick Delivery!</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        {quickItems.map(renderItemRow)}
                      </div>
                    </div>
                  )}

                  {/* 2. Standard Marketplace Sub-Order */}
                  {marketplaceItems.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between bg-blue-50/80 p-2.5 rounded-2xl border border-blue-200">
                        <div className="flex items-center space-x-2 text-xs font-black text-blue-900">
                          <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Standard Marketplace (2–4 Days)</span>
                        </div>
                        <span className="text-[10px] font-bold bg-white text-blue-800 px-2 py-0.5 rounded-lg border border-blue-300">
                          Regional Hub
                        </span>
                      </div>

                      {marketplaceSubtotal < 499 ? (
                        <div className="bg-amber-50 text-[11px] text-amber-800 p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                          <span>Add <b>₹{499 - marketplaceSubtotal}</b> more for FREE Delivery!</span>
                          <span className="text-[10px] font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded">
                            Delivery Fee: ₹49
                          </span>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 text-[11px] text-emerald-800 p-2 rounded-xl border border-emerald-200 flex items-center space-x-1.5 font-bold">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>You unlocked FREE Standard Delivery!</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        {marketplaceItems.map(renderItemRow)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* FOOTER ACTIONS (FOR STEP 1) */}
          {step === 'CART' && cartItems.length > 0 && (
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              
              {/* Wallet Credits Redemption Option */}
              {walletBalance > 0 && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Wallet className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Redeem Reward Credits</p>
                      <p className="text-[10px] text-slate-600">Balance: ₹{walletBalance} (Use up to ₹{maxCreditToUse})</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyCredits}
                    onChange={(e) => setApplyCredits(e.target.checked)}
                    className="w-4 h-4 text-brand-orange rounded accent-brand-orange cursor-pointer"
                  />
                </div>
              )}

              {/* Bill Details */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Total MRP</span>
                  <span data-testid="mrp-total">₹{totalMRP}</span>
                </div>

                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>Bachat Subtotal</span>
                  <span data-testid="bachat-total">₹{totalBachatPrice}</span>
                </div>

                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Mega Bachat Discount</span>
                  </span>
                  <span>-₹{shoppingSavings}</span>
                </div>

                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Delivery Charges</span>
                  <span>{totalDeliveryFee === 0 ? <b className="text-emerald-600 uppercase">FREE</b> : `₹${totalDeliveryFee}`}</span>
                </div>

                {applyCredits && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Reward Wallet Deduction</span>
                    <span data-testid="wallet-deduction">-₹{creditDeduction}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
                  <div>
                    <span className="text-sm font-bold block">Total Payable</span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      You save ₹{shoppingSavings + creditDeduction} on this order
                    </span>
                  </div>
                  <span data-testid="gateway-payable" className="text-2xl font-black text-brand-forest">₹{finalPayable}</span>
                </div>
              </div>

              {/* Delivery Address Preview */}
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 truncate">
                <span className="font-bold text-slate-700">Delivering to: </span>
                <span>{deliveryAddress}</span>
              </div>

              {/* Proceed to Payment Button */}
              <button
                onClick={() => setStep('PAYMENT')}
                data-testid="proceed-to-pay-btn"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98 text-base cursor-pointer"
              >
                <span>Proceed to Pay (₹{finalPayable})</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>PhonePe UPI QR • Cash on Delivery Available</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
