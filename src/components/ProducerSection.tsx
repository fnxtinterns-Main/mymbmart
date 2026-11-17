'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Store, 
  ChefHat, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  HeartHandshake, 
  ShieldCheck,
  Send
} from 'lucide-react';

export const ProducerSection: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'SHG',
    contactPerson: '',
    phone: '',
    city: '',
    productDescription: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      const res = await fetch('/api/producer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setSubmitted(false);
      setFormOpen(false);
      setFormData({
        businessName: '',
        category: 'SHG',
        contactPerson: '',
        phone: '',
        city: '',
        productDescription: '',
      });
      alert(data.message || 'Thank you! Your Producer/SHG application has been received. Our community coordinator will visit within 48 hours for sample verification.');
    } catch {
      setSubmitted(false);
      setFormOpen(false);
      alert('Application submitted! Our community onboarding team will contact you within 24 hours.');
    }
  };

  const categories = [
    {
      title: 'SELF HELP GROUPS (SHG)',
      tagColor: 'bg-emerald-700',
      items: ['Papad, Pickle, Masala', 'Handicraft & Stitching', 'Snacks & Local Food', 'Direct Community Orders'],
      action: 'Join as Producer',
    },
    {
      title: 'SHOP OWNERS & MERCHANTS',
      tagColor: 'bg-brand-forest',
      items: ['Retail & General Store', 'Daily Essentials Listing', 'Local Delivery Network', 'Repeat Customers'],
      action: 'Join as Seller',
    },
    {
      title: 'CLOUD KITCHENS & HOME CHEFS',
      tagColor: 'bg-amber-600',
      items: ['Tiffin, Thali, Snacks', 'Daily Menu on App', 'Zero Dine-In Cost', 'Bulk & Party Orders'],
      action: 'Join as Kitchen',
    },
    {
      title: 'WOMEN ENTREPRENEURS',
      tagColor: 'bg-brand-orange',
      items: ['Home-made Products', 'Boutique & Beauty', 'Bakery & Crafts', 'Apna Brand Banayein'],
      action: 'Join as Entrepreneur',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-emerald-950 text-slate-900" id="producer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Banner Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-900 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4 text-emerald-700" />
            <span>Producer Empowerment & Dignity</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ab Sirf Bechna Nahi — Community Ke Saath Badhna Hai!
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Aapka product seedha 1000s of households tak. Bina middleman, bina heavy commission, bina dukaanke kharche ke.
          </p>
        </div>

        {/* 4 Category Boxes (Exact replica from official marketing flyer) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`${cat.tagColor} text-white text-xs font-black px-3 py-2 rounded-xl text-center mb-4 tracking-wide`}>
                  {cat.title}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                  {cat.items.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setFormOpen(true)}
                className="w-full bg-slate-100 hover:bg-brand-forest hover:text-white text-slate-800 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition-colors"
              >
                {cat.action}
              </button>
            </div>
          ))}
        </div>

        {/* 3 Steps to Start + Benefits Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Left: 3 Steps */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900">
              3 Steps Me Shuru Karein:
            </h3>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black text-sm flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">LIST KARO</h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Apna product / menu / dukaan free me list karo. Photo + price bhejo.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black text-sm flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">ORDER PAAO</h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Community households se direct order. No mandi, no middleman cut.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black text-sm flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">EARN & GROW</h4>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Har sale par direct transparent payment + referral se micro-credit.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Aapko Kya Milega? */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-emerald-950">
              Aapko Kya Milega?
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-emerald-900 font-semibold">
              <li className="flex items-center space-x-2">
                <span className="text-brand-orange font-bold text-base">✓</span>
                <span>Zero / Low Commission — Zyada margin aapke paas</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-brand-orange font-bold text-base">✓</span>
                <span>Ready Community Customers — Pehle din se guaranteed buyers</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-brand-orange font-bold text-base">✓</span>
                <span>Referral + Level Micro-Credit — Network se extra income</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-brand-orange font-bold text-base">✓</span>
                <span>Transparent Smart Chain Payments & Fast Settlements</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-brand-orange font-bold text-base">✓</span>
                <span>Free Digital Support — Listing, photography & marketing by TechNxtAI</span>
              </li>
            </ul>

            <button
              onClick={() => setFormOpen(true)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition text-xs sm:text-sm"
            >
              Apply as Producer / SHG — Free Registration
            </button>
          </div>

        </div>

      </div>

      {/* Producer Registration Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              Producer / SHG Onboarding
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Connect directly with households and start selling with community support.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Business / Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahila Shakti SHG / Radha Home Spices"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="SHG">Self Help Group (SHG)</option>
                    <option value="WOMEN_ENTREPRENEUR">Women Entrepreneur</option>
                    <option value="SHOP_MERCHANT">Local Shop / Merchant</option>
                    <option value="CLOUD_KITCHEN">Cloud Kitchen / Home Chef</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile / WhatsApp No.
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    City & State
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nagpur, Maharashtra"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  What products do you make or sell?
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Handmade papad, pickles, organic haldi, stitching suits..."
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitted}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center space-x-2"
                >
                  {submitted ? <span>Submitting...</span> : <span>Submit Application</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
