'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  CheckCircle2, 
  ShoppingBag, 
  Tag, 
  Wallet, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { CartItem } from '@/lib/types';

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
  const [applyCredits, setApplyCredits] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Shiv Shanti Heights, Civil Lines, Nagpur');

  if (!isOpen) return null;

  const totalMRP = cartItems.reduce((acc, item) => acc + item.product.mrp * item.quantity, 0);
  const totalBachatPrice = cartItems.reduce((acc, item) => acc + item.product.bachatPrice * item.quantity, 0);
  const shoppingSavings = totalMRP - totalBachatPrice;

  // Max wallet credit that can be applied (up to 50% of order or available balance)
  const maxCreditToUse = Math.min(walletBalance, Math.round(totalBachatPrice * 0.4));
  const creditDeduction = applyCredits ? maxCreditToUse : 0;
  const finalPayable = Math.max(0, totalBachatPrice - creditDeduction);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      onOrderSuccess({
        totalMRP,
        totalBachatPrice,
        shoppingSavings,
        creditDeduction,
        finalPayable,
        itemsCount: cartItems.length,
      });
      onClearCart();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header (Mockup replica) */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <span>Cart</span>
                <span className="text-xs font-bold bg-brand-orange text-white px-2 py-0.5 rounded-full">
                  {cartItems.length}
                </span>
              </h2>
            </div>

            {cartItems.length > 0 && (
              <button
                onClick={onClearCart}
                className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                title="Clear Cart"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
              cartItems.map((item) => (
                <div 
                  key={item.product.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center space-x-3 shadow-sm hover:border-slate-300 transition"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {item.product.unit} {item.product.isSHG && <span className="text-emerald-700 font-bold">• SHG Direct</span>}
                    </p>

                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹ {item.product.bachatPrice}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹ {item.product.mrp}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Save {item.product.discountPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper (Mockup replica) */}
                  <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold text-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-black text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-200 font-bold text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer & Summary */}
          {cartItems.length > 0 && (
            <div className="border-t border-slate-200 p-6 bg-slate-50/70 space-y-4">
              
              {/* Wallet Credits Redemption Option */}
              {walletBalance > 0 && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Wallet className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Redeem Micro-Credits</p>
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
                  <span>₹ {totalMRP}</span>
                </div>

                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span className="flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Community Bachat Discount</span>
                  </span>
                  <span>- ₹ {shoppingSavings}</span>
                </div>

                {applyCredits && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Micro-Credit Wallet Discount</span>
                    <span>- ₹ {creditDeduction}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
                  <span className="text-sm font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-brand-navy">₹ {finalPayable}</span>
                </div>
              </div>

              {/* Delivery Address Preview */}
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Delivering to: </span>
                <span>{deliveryAddress}</span>
              </div>

              {/* Proceed to Checkout Button (Mockup replica) */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98 text-base"
              >
                {isCheckingOut ? (
                  <span>Processing Smart Order...</span>
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Smart Chain Encrypted & Transparent</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
