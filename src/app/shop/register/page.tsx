'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CheckCircle2, 
  Store, 
  FileText, 
  CreditCard, 
  Upload, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function ShopRegistrationPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Ranchi',
    state: 'Jharkhand',
    pincode: '834001',
    businessType: 'KIRANA_GENERAL',
    yearsInBusiness: 5,
    fssaiNumber: '',
    tradeLicenseNumber: '',
    gstin: '',
    panNumber: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    // Document URLs (Simulated digital upload storage)
    documents: {
      tradeLicenseUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
      fssaiCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      panCardUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
      storePhotoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (currentStep === 1) {
      if (!formData.shopName || !formData.ownerName || !formData.phone || !formData.email || !formData.address) {
        setErrorMsg('Please complete all basic store and contact information.');
        return;
      }
      if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.fssaiNumber || !formData.tradeLicenseNumber || !formData.panNumber) {
        setErrorMsg('FSSAI Registration, Trade License, and PAN Number are mandatory for onboarding.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formData.bankAccountNumber || !formData.ifscCode || !formData.bankName) {
        setErrorMsg('Bank Name, Account Number, and IFSC are required for automated daily payouts.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/shop/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        setSubmittedApp(data.application);
      } else {
        setErrorMsg(data.message || 'Submission failed.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message || 'Error communicating with onboarding server.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <Navbar cartCount={0} onOpenCart={() => {}} onOpenAuth={() => {}} />

      <main className="flex-1 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Header Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 bg-emerald-100 text-[#064E3B] px-3.5 py-1.5 rounded-full text-xs font-black">
              <Store className="w-4 h-4 text-emerald-700" />
              <span>MegaBachatMart Merchant & Kirana Partner Program</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Grow Your Kirana with Hyperlocal Orders
            </h1>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Join Ranchi’s leading zero-commission hyperlocal grocery network. Complete your digital KYC below to receive your Store ID and start listing products.
            </p>
          </div>

          {/* Success Screen after submission */}
          {submittedApp ? (
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-emerald-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#0F172A]">Application Submitted Successfully!</h2>
                <p className="text-sm text-slate-600">
                  Your store registration has been received at the Ranchi Central Onboarding Desk.
                </p>
              </div>

              {/* Reference Badge */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Application Reference</div>
                <div className="font-mono text-xl font-black text-[#064E3B]">{submittedApp.applicationNumber}</div>
                <div className="text-xs text-slate-700">
                  <strong>Store:</strong> {submittedApp.shopName} ({submittedApp.pincode})<br />
                  <strong>Proprietor:</strong> {submittedApp.ownerName}
                </div>
              </div>

              {/* Workflow Next Steps Box */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 max-w-lg mx-auto text-left space-y-3">
                <h4 className="font-extrabold text-xs text-[#064E3B] uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>What Happens Next?</span>
                </h4>
                <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside">
                  <li>Our verification desk reviews your FSSAI license and premises within 2-4 hours.</li>
                  <li>Upon approval, a unique <strong>Store ID & Secure Password</strong> is generated.</li>
                  <li>Your credentials will be dispatched directly to your <strong>WhatsApp (+91 {submittedApp.phone})</strong> and <strong>Email ({submittedApp.email})</strong>.</li>
                  <li>Sign in at the Merchant Portal, download our CSV template, and upload your inventory to go live!</li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/shop/login"
                  className="w-full sm:w-auto bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition"
                >
                  Go to Merchant Portal Login
                </Link>
                <Link
                  href="/shop"
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-2xl text-xs transition"
                >
                  Explore Customer Storefront
                </Link>
              </div>
            </div>
          ) : (
            
            /* Multi-step Application Form Card */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              
              {/* Stepper Progress Bar */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex items-center justify-between text-xs font-bold">
                {[
                  { step: 1, label: 'Store Info' },
                  { step: 2, label: 'Licenses & KYC' },
                  { step: 3, label: 'Bank Payouts' },
                  { step: 4, label: 'Review & Submit' }
                ].map((s) => (
                  <div key={s.step} className="flex items-center space-x-2">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition ${
                        currentStep === s.step
                          ? 'bg-[#064E3B] text-white'
                          : currentStep > s.step
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {currentStep > s.step ? '✓' : s.step}
                    </div>
                    <span className="hidden sm:inline text-slate-800">{s.label}</span>
                  </div>
                ))}
              </div>

              {errorMsg && (
                <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: STORE & OWNER DETAILS */}
              {currentStep === 1 && (
                <form onSubmit={handleNextStep} className="p-6 sm:p-8 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">Step 1: Store & Proprietor Information</h3>
                    <p className="text-xs text-slate-500">Provide the commercial and contact details of your retail store.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Store / Shop Name *</label>
                      <input
                        type="text"
                        name="shopName"
                        required
                        placeholder="e.g. Gupta Kirana & General Store"
                        value={formData.shopName}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Owner / Proprietor Name *</label>
                      <input
                        type="text"
                        name="ownerName"
                        required
                        placeholder="e.g. Rajesh Kumar Gupta"
                        value={formData.ownerName}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Primary Mobile / WhatsApp *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <span className="text-[10px] text-slate-400">Credentials will be sent to this WhatsApp number.</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="merchant@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Shop Address (Street, Landmark) *</label>
                      <input
                        type="text"
                        name="address"
                        required
                        placeholder="e.g. Shop #14, Main Road, Near Overbridge, Hindpiri"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City / District</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        placeholder="834001"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Store Category / Type</label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="KIRANA_GENERAL">Kirana & Daily Grocery</option>
                        <option value="SUPERMARKET">Supermarket / Provision Store</option>
                        <option value="ORGANIC_PRODUCE">Farm Fresh & Organic Vegetables</option>
                        <option value="DAIRY_SWEETS">Dairy & Bakery Products</option>
                        <option value="SHG_COOPERATIVE">SHG Women Cooperative</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Years in Operation</label>
                      <input
                        type="number"
                        name="yearsInBusiness"
                        min="1"
                        value={formData.yearsInBusiness}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Continue to Statutory Licenses</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: LICENSES & KYC */}
              {currentStep === 2 && (
                <form onSubmit={handleNextStep} className="p-6 sm:p-8 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">Step 2: Statutory Licenses & KYC</h3>
                    <p className="text-xs text-slate-500">Provide legal identification numbers to comply with consumer protection regulations.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">FSSAI License / Registration No *</label>
                      <input
                        type="text"
                        name="fssaiNumber"
                        required
                        placeholder="14-digit FSSAI Number"
                        value={formData.fssaiNumber}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <span className="text-[10px] text-slate-400">Required for food and grocery delivery.</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Municipal Trade License No *</label>
                      <input
                        type="text"
                        name="tradeLicenseNumber"
                        required
                        placeholder="e.g. RMC/TL/2025/1042"
                        value={formData.tradeLicenseNumber}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Proprietor / Firm PAN *</label>
                      <input
                        type="text"
                        name="panNumber"
                        required
                        placeholder="ABCDE1234F"
                        value={formData.panNumber}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                      <input
                        type="text"
                        name="gstin"
                        placeholder="20XXXXXXXXXX1ZX"
                        value={formData.gstin}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono"
                      />
                    </div>
                  </div>

                  {/* Document preview simulation */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-800">Digital KYC Document Verification</span>
                    <p className="text-[11px] text-slate-500">
                      Standard Trade License and FSSAI certificate images are pre-linked for demonstration. Official review will verify these on state portals.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Continue to Banking Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: BANKING & PAYOUTS */}
              {currentStep === 3 && (
                <form onSubmit={handleNextStep} className="p-6 sm:p-8 space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">Step 3: Settlement Bank Account</h3>
                    <p className="text-xs text-slate-500">Where customer order earnings will be credited on a daily T+1 basis.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        name="bankName"
                        required
                        placeholder="e.g. State Bank of India, Main Branch Ranchi"
                        value={formData.bankName}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bank Account Number *</label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        required
                        placeholder="Enter 9-18 digit account number"
                        value={formData.bankAccountNumber}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">IFSC Code *</label>
                      <input
                        type="text"
                        name="ifscCode"
                        required
                        placeholder="e.g. SBIN0000167"
                        value={formData.ifscCode}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span>Review Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: REVIEW & FINAL SUBMISSION */}
              {currentStep === 4 && (
                <div className="p-6 sm:p-8 space-y-6 text-xs">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900">Step 4: Review Details & Submit</h3>
                    <p className="text-slate-500">Confirm your application details before sending to the Ranchi admin desk.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                      <div><strong className="text-slate-900">Store Name:</strong> {formData.shopName}</div>
                      <div><strong className="text-slate-900">Owner Name:</strong> {formData.ownerName}</div>
                      <div><strong className="text-slate-900">WhatsApp Mobile:</strong> +91 {formData.phone}</div>
                      <div><strong className="text-slate-900">Email:</strong> {formData.email}</div>
                      <div><strong className="text-slate-900">Address:</strong> {formData.address}, {formData.pincode}</div>
                      <div><strong className="text-slate-900">FSSAI Number:</strong> {formData.fssaiNumber}</div>
                      <div><strong className="text-slate-900">Trade License:</strong> {formData.tradeLicenseNumber}</div>
                      <div><strong className="text-slate-900">PAN Number:</strong> {formData.panNumber}</div>
                      <div><strong className="text-slate-900">Bank:</strong> {formData.bankName} ({formData.ifscCode})</div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-slate-700 space-y-2">
                    <div className="font-bold text-[#064E3B] flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Merchant Partner Agreement</span>
                    </div>
                    <p className="text-[11px]">
                      By submitting this registration, you agree to fulfill fresh grocery orders within 20-30 minutes for customers in your pincode polygon, adhere to fair Bachat pricing, and honor FEFO hygiene standards.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-[#16A34A] hover:bg-[#15803d] text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs shadow-lg shadow-emerald-700/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{submitting ? 'Submitting Application...' : 'Submit Application for Admin Review'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
