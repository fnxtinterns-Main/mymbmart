'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShieldCheck, 
  HeartHandshake, 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Lock
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-forest text-emerald-100 pt-12 pb-24 lg:pb-12 border-t border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand info */}
          <div className="space-y-4">
            <div className="relative w-44 h-12 bg-white p-2 rounded-xl">
              <Image
                src="/images/LOgo.jpeg"
                alt="MEGA BACHAT MART"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-xs text-emerald-200 leading-relaxed">
              India's Prosumer Community Movement. Turning household expenses into community income, 
              direct-from-producer savings, and grassroot women empowerment.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Transparent Smart Finance Ledger</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              Quick Links
            </h4>
            <ul className="space-y-2 text-emerald-200">
              <li><Link href="/shop" className="hover:text-white transition">Community Store</Link></li>
              <li><Link href="/partners" className="hover:text-white transition font-bold text-emerald-300">Partner Hub & Shops</Link></li>
              <li><Link href="/producer" className="hover:text-white transition">Producer & SHG Portal</Link></li>
              <li><Link href="/savings" className="hover:text-white transition">Savings & Passbook</Link></li>
              <li><Link href="/refer" className="hover:text-white transition">Referral & Level Plan</Link></li>
            </ul>
          </div>

          {/* Community FAQ */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              Community FAQ
            </h4>
            <div className="space-y-2 text-emerald-200">
              <div>
                <p className="font-bold text-white">Q: How soon do I recover my savings?</p>
                <p className="text-[11px] text-emerald-300/90">A: On a ₹5,000/mo grocery budget with 10% savings, you save ₹500/mo, achieving full recovery within months.</p>
              </div>
              <div>
                <p className="font-bold text-white">Q: Is this a job or an investment?</p>
                <p className="text-[11px] text-emerald-300/90">A: No. It is an authentic community e-commerce platform offering direct producer discounts and referral rewards.</p>
              </div>
            </div>
          </div>

          {/* Corporate Support */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              Corporate Affiliation
            </h4>
            <p className="text-emerald-200 leading-relaxed">
              Powered by <strong className="text-white">FutureNxt E-Commerce</strong><br />
              Digital Support by <strong className="text-emerald-300">TechNxtAI</strong><br />
              Transparent Digital Chain Architecture
            </p>
            <div className="pt-2 text-[11px] text-emerald-300/80 space-y-1">
              <p>Email: <a href="mailto:support@mymbmart.com" className="hover:text-white underline">support@mymbmart.com</a></p>
              <p>Helpline: +91 9801506511</p>
              <p>UPI Account: 9801506511@ybl</p>
              <p>Headquarters: Ranchi Central, Jharkhand</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-emerald-800/80 text-center text-xs text-emerald-300/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MEGA BACHAT MART (mymbmart.com). All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px]">
            <Link href="/about" className="hover:text-white transition">About Us</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link>
            <Link href="/refund-policy" className="hover:text-white transition">Refund & Returns</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
