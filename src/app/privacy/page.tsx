import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy | MegaBachatMart (mymbmart.com)',
  description: 'Digital Personal Data Protection (DPDP) Act 2023 compliance, data retention, and consumer privacy terms for MegaBachatMart.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar cartCount={0} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-800">
          
          <div className="border-b border-slate-100 pb-5">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Data Protection</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Privacy Policy</h1>
            <p className="text-xs text-slate-500 mt-1">Compliant with the Digital Personal Data Protection Act (DPDP), 2023</p>
          </div>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              We collect minimal personal data essential to fulfilling hyperlocal grocery deliveries and executing partner merchant payouts:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li><strong>Customer Profiles:</strong> Name, mobile phone number, delivery address, geolocation/pincode, and order history.</li>
              <li><strong>Merchant & Producer Partners:</strong> Trade name, owner PAN, FSSAI registration, GSTIN (optional), bank account number, and store coordinate location.</li>
              <li><strong>Rider Fleet:</strong> Live delivery telemetry and GPS coordinates exclusively during active assigned order dispatches.</li>
            </ul>
          </section>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">2. How We Use Your Data</h2>
            <p>
              Your data is utilized strictly for:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600">
              <li>Executing 20-minute hyperlocal order routing and dark store dispatch.</li>
              <li>Sending SMS / Email / WhatsApp order status alerts, delivery OTPs, and partner login credentials.</li>
              <li>Auditing referral reward micro-credits and community savings ledgers.</li>
              <li>Preventing fraudulent stock reservation and double-spend exploits.</li>
            </ul>
          </section>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">3. Zero Third-Party Advertising Sale</h2>
            <p>
              <strong>We never sell, rent, or trade your personal data</strong> to third-party ad networks, telemetry trackers, or credit aggregators. All authentication tokens use secure HTTP-only cookies and cryptographic JWT encryption.
            </p>
          </section>

          <section className="space-y-3 text-xs leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">4. Your Data Rights</h2>
            <p>
              Under Indian data protection regulations, you have the right to review, rectify, or request complete deletion of your customer profile by emailing our grievance desk at <a href="mailto:support@mymbmart.com" className="text-emerald-700 underline font-bold">support@mymbmart.com</a>.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
