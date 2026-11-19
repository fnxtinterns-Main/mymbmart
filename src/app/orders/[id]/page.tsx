'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CheckCircle2, Clock, MapPin, Truck, Sparkles, ShoppingBag } from 'lucide-react';

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params }: OrderConfirmationPageProps) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id || 'MBM-2026-ORDER';

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
              Thank You for Your Order!
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

          {/* Delivery & Tracking Details */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Delivery ETA</span>
              </div>
              <p className="text-xs font-black text-emerald-950 mt-1">20–30 Minutes</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Fulfilment</span>
              </div>
              <p className="text-xs font-black text-blue-950 mt-1">Ranchi Central Hub</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/shop"
              className="flex-1 bg-brand-forest hover:bg-emerald-950 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
            <Link
              href="/savings"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-xs transition flex items-center justify-center"
            >
              <span>View Passbook</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
