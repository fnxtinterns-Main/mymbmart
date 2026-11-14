'use client';

import React from 'react';
import Image from 'next/image';
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
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-24 lg:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand info */}
          <div className="space-y-4">
            <div className="relative w-44 h-12 bg-white/90 p-2 rounded-xl">
              <Image
                src="/images/LOgo.jpeg"
                alt="mymbmart.com"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's Prosumer Community Movement. Turning household expenses into community income, 
              direct-from-producer savings, and women empowerment.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Smart Chain Verified Transparent Finance</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              Quick Links
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#store" className="hover:text-white transition">Community Store</a></li>
              <li><a href="#producer" className="hover:text-white transition">Producer & SHG Portal</a></li>
              <li><a href="#savings" className="hover:text-white transition">Savings & Smart Ledger</a></li>
              <li><a href="#refer" className="hover:text-white transition">Referral & Level Rewards</a></li>
              <li><span className="text-slate-500">Student & Family Membership Tiers</span></li>
            </ul>
          </div>

          {/* FAQ & Guidelines (From Marketing Flyer) */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              Community FAQ
            </h4>
            <div className="space-y-2 text-slate-400">
              <div>
                <p className="font-bold text-slate-200">Q: Paisa kab vasool hoga?</p>
                <p className="text-[11px] text-slate-400">A: ₹5000/month par 10% bachat = ₹500/mo. ~6 mahine me total recovery.</p>
              </div>
              <div>
                <p className="font-bold text-slate-200">Q: Kya ye job ya investment hai?</p>
                <p className="text-[11px] text-slate-400">A: Nahi. Ye community e-commerce + discount + referral benefit hai.</p>
              </div>
            </div>
          </div>

          {/* Corporate Support */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">
              Powered By
            </h4>
            <p className="text-slate-400 leading-relaxed">
              <strong className="text-white">FutureNxt E-Commerce</strong><br />
              Digital Support by <strong className="text-emerald-400">TechNxtAI</strong><br />
              Transparent Smart Chain Architecture
            </p>
            <div className="pt-2 text-[11px] text-slate-500 space-y-1">
              <p>Email: support@mymbmart.com</p>
              <p>Website: www.mymbmart.com</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MegaBachatMart (mymbmart.com). All rights reserved.</p>
          <div className="flex space-x-6 text-[11px]">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms & Conditions</span>
            <span className="hover:text-slate-400 cursor-pointer">Community Rules</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
