import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RefreshCw, ShieldCheck, Clock } from 'lucide-react';

export const metadata = {
  title: 'Refund & Return Policy | MegaBachatMart (mymbmart.com)',
  description: '100% Instant Refund and Return Guarantee details for MegaBachatMart shoppers and merchant partners.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar cartCount={0} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-800">
          
          <div className="border-b border-slate-100 pb-5">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Consumer Trust</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Refund & Return Policy</h1>
            <p className="text-xs text-slate-500 mt-1">100% Customer Satisfaction Guarantee • Instant UPI & Wallet Reversals</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <Clock className="w-6 h-6 text-emerald-700 mx-auto" />
              <h3 className="font-bold text-xs text-slate-900">Spot Verification</h3>
              <p className="text-[11px] text-slate-600">Inspect at doorstep before OTP verification.</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <RefreshCw className="w-6 h-6 text-emerald-700 mx-auto" />
              <h3 className="font-bold text-xs text-slate-900">Instant UPI Reversal</h3>
              <p className="text-[11px] text-slate-600">UPI refunds initiated immediately to source.</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <ShieldCheck className="w-6 h-6 text-emerald-700 mx-auto" />
              <h3 className="font-bold text-xs text-slate-900">No Questions Asked</h3>
              <p className="text-[11px] text-slate-600">On damaged, expired, or incorrect items.</p>
            </div>
          </div>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">1. Spot Doorstep Rejection</h2>
            <p>
              When your 20-minute order arrives, you are entitled to inspect the sealed packages. If any item is damaged, past its expiry date, or differs from your order, hand it back to the rider. The order total will be adjusted instantly or refunded.
            </p>
          </section>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">2. Return Window for Packaged Staples</h2>
            <p>
              Unopened packaged groceries, FMCG goods, spices, and non-perishables have a <strong>24-hour return window</strong> from delivery time. Simply click &quot;Raise Issue&quot; from your active order tracker or email <code>support@mymbmart.com</code> with a photo.
            </p>
          </section>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">3. Refund Processing Timeline</h2>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li><strong>PhonePe / UPI Payments:</strong> Reversed back to your original UPI account (VPA) within 2 to 4 hours.</li>
              <li><strong>MegaBachatMart Wallet Micro-credits:</strong> Credited back to your reward wallet immediately.</li>
              <li><strong>Cash on Delivery (COD):</strong> Rider will not collect payment for rejected items at the door.</li>
            </ul>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
