import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeartHandshake, Zap, Store } from 'lucide-react';

export const metadata = {
  title: 'About Us | MegaBachatMart (mymbmart.com)',
  description: 'Empowering local shop owners, Self Help Groups (SHGs), and neighborhood shoppers with 20-min delivery, zero commissions, and community savings.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar cartCount={0} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Our Purpose & Movement
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              About <span className="text-[#064E3B]">MegaBachatMart</span>
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Bachat Bhi. Kamai Bhi. Apni Community Ke Saath. India&apos;s first prosumer e-commerce platform built to protect local shop merchants and empower village women producers.
            </p>
          </div>

          {/* Mission Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">0% Commission for Shops</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Predatory quick-commerce platforms charge 20% to 30% cut. We aggregate existing mom-and-pop shops at zero commission, driving sales directly to local neighborhoods.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Direct SHG & Farmer Market</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empowering women Self-Help Groups (SHGs) and tribal cooperatives to sell authentic honey, pickles, cold-pressed oils, and spices with zero middlemen.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">20–30 Min EV Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean, silent electric scooter delivery networks routing orders to the closest verified neighborhood shop or dark store within 3 km polygons.
              </p>
            </div>
          </div>

          {/* Headquarters & Operational Hub */}
          <div className="bg-gradient-to-br from-[#064E3B] to-emerald-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl space-y-4">
            <h2 className="text-2xl font-black">Headquarters & Central Operations</h2>
            <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
              MegaBachatMart Technologies Private Limited operates its primary pilot fulfillment network and dispatch dark store out of Ranchi Central, Jharkhand.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs text-emerald-200">
              <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-700/50">
                <span className="font-bold text-white block mb-1">Corporate HQ</span>
                <p>Birsa Munda Chowk, Main Road, Ranchi Central, Jharkhand - 834001</p>
              </div>
              <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-700/50">
                <span className="font-bold text-white block mb-1">Support & Verification</span>
                <p>Email: support@mymbmart.com</p>
                <p>Helpline: +91 9801506511 (8 AM - 10 PM IST)</p>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/shop"
              className="bg-[#064E3B] hover:bg-emerald-900 text-white font-bold px-6 py-3 rounded-2xl text-xs transition"
            >
              Explore Storefront
            </Link>
            <Link
              href="/partners"
              className="bg-white hover:bg-slate-100 text-slate-800 font-bold px-6 py-3 rounded-2xl text-xs border border-slate-300 transition"
            >
              Partner With Us
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
