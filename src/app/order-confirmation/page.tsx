'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckCircle2, Clock, Truck, Sparkles, ShoppingBag } from 'lucide-react';

export default function OrderConfirmationPage() {
  const [orderId, setOrderId] = useState('MBM-2026-ORDER');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('orderId') || params.get('id');
      if (id) setOrderId(id);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-8 flex items-center justify-center">
        <div className="bg-white w-full rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-center">
          
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              <span>Order Placed Successfully</span>
            </span>
            <h1 className="text-2xl font-black text-slate-900">
              Order Confirmed!
            </h1>
            <p className="text-xs text-slate-500">
              Your order has been routed to Ranchi Central Dark Store for 20-30 min hyper-local dispatch.
            </p>
          </div>

          {/* Order ID Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Order Reference Number
            </span>
            <span 
              data-testid="order-id" 
              className="font-mono text-lg sm:text-xl font-black text-brand-forest mt-1 block"
            >
              {orderId}
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/shop"
              className="flex-1 bg-brand-forest hover:bg-emerald-950 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
