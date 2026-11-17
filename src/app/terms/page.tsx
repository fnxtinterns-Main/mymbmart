import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'Terms & Conditions | MegaBachatMart (mymbmart.com)',
  description: 'Terms of Service, Partner Onboarding Agreement, and Marketplace Governance rules for MegaBachatMart.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar cartCount={0} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-800">
          
          <div className="border-b border-slate-100 pb-5">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Legal Governance</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Terms & Conditions</h1>
            <p className="text-xs text-slate-500 mt-1">Last updated: November 2026 • Effective immediately</p>
          </div>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">1. Introduction & Overview</h2>
            <p>
              Welcome to MegaBachatMart (mymbmart.com), operated by FutureNxt E-Commerce and affiliated corporate partners. By accessing our platform, browsing the storefront, downloading the mobile progressive web application, or listing goods as a partner merchant, you agree to be bound by these Terms.
            </p>
          </section>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">2. Hyperlocal Marketplace & Merchant SLA</h2>
            <p>
              MegaBachatMart functions as a hyperlocal fulfillment aggregator connecting local verified retail shops, Self-Help Groups (SHGs), and primary agricultural cooperatives to neighborhood consumers. Merchants agree to maintain authentic, unadulterated stock with valid FSSAI licenses where applicable.
            </p>
            <p>
              Order fulfillment SLAs require merchants to accept or route assigned neighborhood orders within 2 minutes during active store operating hours.
            </p>
          </section>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">3. Pricing, Offers & Closed-Loop Wallet</h2>
            <p>
              Offered &quot;Bachat Prices&quot; reflect genuine promotional and community discounts below Maximum Retail Price (MRP). Closed-loop wallet micro-credits and referral reward points are non-transferable to outside bank accounts, non-monetizable, and redeemable solely for purchase deductions up to a 40% cap on qualifying grocery baskets in compliance with RBI Prepaid Payment Instrument (PPI) directives.
            </p>
          </section>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">4. UPI Payments & Escrow Settlement</h2>
            <p>
              Instant payments processed via PhonePe UPI (merchant account: <code>9801506511@ybl</code> / FUTURENXT) or future payment gateway integrations are recorded directly on our append-only SmartChain audit ledger. Partner payouts are disbursed on guaranteed Daily T+1 settlement cycles into verified merchant bank accounts.
            </p>
          </section>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">5. Limitation of Liability</h2>
            <p>
              MegaBachatMart maintains strict quality screening but acts solely as a technological and logistical enabler. Product manufacturer warranties, batch expiry integrity, and packaging standards remain the legal responsibility of the respective manufacturing or retailing partner.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            For legal inquiries or partner contract questions, contact our legal counsel at <a href="mailto:support@mymbmart.com" className="text-emerald-700 underline font-bold">support@mymbmart.com</a>.
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
