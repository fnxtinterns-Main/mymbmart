'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Customer',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar cartCount={0} />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              We&apos;re Here to Help
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Contact MegaBachatMart
            </h1>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Have questions about your order, merchant onboarding, or SHG partnership? Reach out to our 24/7 dedicated support team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Official Email</h3>
              <p className="text-xs text-slate-500">support@mymbmart.com</p>
              <p className="text-[11px] text-emerald-700 font-semibold">Average reply: &lt; 15 mins</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Helpline & WhatsApp</h3>
              <p className="text-xs text-slate-500">+91 9801506511</p>
              <p className="text-[11px] text-slate-400">8:00 AM – 10:00 PM IST</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Central Hub</h3>
              <p className="text-xs text-slate-500">Main Road, Ranchi Central</p>
              <p className="text-[11px] text-slate-400">Jharkhand - 834001, India</p>
            </div>
          </div>

          {/* Contact & Inquiry Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            {submitted ? (
              <div className="text-center py-10 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Message Received!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Thank you for reaching out. Our Ranchi Operations desk has logged your request and will get back to you shortly at {formData.email || formData.phone}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" data-toolname="submit_support_ticket" data-tooldescription="Submit inquiry to customer service or merchant onboarding">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Send an Instant Inquiry</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. ramesh@gmail.com"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile / WhatsApp No.</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9801506511"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Inquiry Type</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                    >
                      <option value="Customer">Customer Order & Delivery</option>
                      <option value="Shop_Partner">Local Shop Onboarding</option>
                      <option value="SHG_Producer">SHG & Farmer Supplier</option>
                      <option value="Delivery_Fleet">Delivery Rider Application</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Your Message / Query</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your inquiry..."
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#064E3B] hover:bg-emerald-900 text-white font-bold px-6 py-3 rounded-2xl text-xs flex items-center space-x-2 transition shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
