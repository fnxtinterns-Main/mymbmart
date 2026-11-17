'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Store, 
  Users, 
  Sprout, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  FileSpreadsheet, 
  Download, 
  TrendingUp, 
  Truck, 
  Lock, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  DollarSign, 
  Award,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function PartnersHomePage() {
  const router = useRouter();
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Quick Register form state
  const [quickReg, setQuickReg] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    pincode: '834001',
    address: '',
    partnerType: 'KIRANA_GENERAL',
    fssaiNumber: '',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState<any | null>(null);
  const [regError, setRegError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/v1/shop/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      });
      const data = await res.json();
      setLoginLoading(false);

      if (data.success && data.account) {
        localStorage.setItem('mbm_shop_partner', JSON.stringify(data.account));
        router.push('/shop/portal');
      } else {
        setLoginError(data.message || 'Invalid Store ID or password.');
      }
    } catch (err: any) {
      setLoginLoading(false);
      setLoginError(err.message || 'Login failed.');
    }
  };

  const handleQuickDemoFill = (id: string, pwd: string) => {
    setLoginIdentifier(id);
    setLoginPassword(pwd);
  };

  const handleQuickRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');

    try {
      const res = await fetch('/api/v1/shop/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quickReg,
          businessType: quickReg.partnerType,
          tradeLicenseNumber: 'PENDING_VERIF',
          panNumber: 'PENDING',
          bankAccountNumber: '0000000000',
          ifscCode: 'SBIN000000',
        }),
      });

      const data = await res.json();
      setRegLoading(false);

      if (data.success) {
        setRegSuccess(data);
      } else {
        setRegError(data.message || 'Registration failed.');
      }
    } catch (err: any) {
      setRegLoading(false);
      setRegError(err.message || 'Error submitting registration.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0F172A]">
      <Navbar cartCount={0} onOpenCart={() => {}} onOpenAuth={() => {}} />

      <main className="flex-1 pb-16">
        
        {/* ============================================================== */}
        {/* HERO SECTION                                                  */}
        {/* ============================================================== */}
        <section className="bg-gradient-to-b from-[#064E3B] via-[#043d2e] to-[#064E3B] text-white pt-12 pb-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            {/* Left Column: Vision & Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center space-x-2 bg-emerald-800/80 border border-emerald-400/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-300">
                <Store className="w-4 h-4 text-emerald-300" />
                <span>partners.mymbmart.com • Dedicated Merchant & SHG Hub</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Empowering Shops, SHG Women & Farmers
              </h1>

              <p className="text-sm sm:text-base text-emerald-100 leading-relaxed max-w-xl">
                Protect your store from predatory quick-commerce dark stores. MegaBachatMart connects local neighborhood merchants to digital shoppers with <strong>zero unfair commissions</strong>, <strong>20-minute local delivery</strong>, and <strong>guaranteed daily bank payouts</strong>.
              </p>

              {/* Key Trust Stats Pill Row */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                <div className="bg-emerald-950/50 border border-emerald-800/60 rounded-2xl p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-300">0%</div>
                  <div className="text-[10px] sm:text-xs text-emerald-200 mt-0.5">Platform Commission</div>
                </div>

                <div className="bg-emerald-950/50 border border-emerald-800/60 rounded-2xl p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-300">20–30m</div>
                  <div className="text-[10px] sm:text-xs text-emerald-200 mt-0.5">Delivery Radius</div>
                </div>

                <div className="bg-emerald-950/50 border border-emerald-800/60 rounded-2xl p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-300">Daily T+1</div>
                  <div className="text-[10px] sm:text-xs text-emerald-200 mt-0.5">Direct Bank Payouts</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#partner-matrix"
                  className="bg-[#16A34A] hover:bg-[#15803d] text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-950/30 transition flex items-center space-x-2"
                >
                  <span>Explore What You Need To Do</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="/api/v1/shop/template-csv"
                  download="megabachatmart_inventory_template.csv"
                  className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border border-emerald-700/50 transition flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Download Inventory CSV Template</span>
                </a>
              </div>

            </div>

            {/* Right Column: Interactive Login & Quick Apply Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 text-[#0F172A] shadow-2xl border border-emerald-100 space-y-5">
                
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
                  <button
                    onClick={() => setAuthTab('LOGIN')}
                    className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      authTab === 'LOGIN'
                        ? 'bg-[#064E3B] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Partner Sign In</span>
                  </button>

                  <button
                    onClick={() => setAuthTab('REGISTER')}
                    className={`py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      authTab === 'REGISTER'
                        ? 'bg-[#064E3B] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Join as Partner</span>
                  </button>
                </div>

                {/* TAB 1: LOGIN FORM */}
                {authTab === 'LOGIN' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Sign In to Partner Portal</h3>
                      <p className="text-[11px] text-slate-500">Access store inventory, order dispatch, and CSV upload</p>
                    </div>

                    {loginError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Store ID / Mobile Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MBM-SHP-834006-03 or 9431109876"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Dispatched to your WhatsApp upon KYC approval
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold py-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>{loginLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Quick Demo Fill Shortcut */}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-1.5">
                        Test Partner Account (Ranchi Central)
                      </p>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoFill('MBM-SHP-834006-03', 'MBM#Chot834@2026')}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 text-[11px] transition flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-emerald-800">Chotanagpur Tribal Hub</span>
                          <span className="text-slate-500 block text-[10px]">ID: MBM-SHP-834006-03</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Pre-Approved
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: REGISTER QUICK FORM */}
                {authTab === 'REGISTER' && (
                  <div>
                    {regSuccess ? (
                      <div className="space-y-4 text-center py-2 animate-in fade-in zoom-in duration-150">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">Application Received!</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Reference: <strong>{regSuccess.applicationNumber}</strong></p>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Our Ranchi verification desk will review your details and send your Store ID & Password to your WhatsApp within 2-4 hours.
                        </p>
                        <Link
                          href="/shop/register"
                          className="inline-block bg-[#064E3B] text-white text-xs font-bold px-4 py-2 rounded-xl"
                        >
                          Complete Full KYC Documentation →
                        </Link>
                      </div>
                    ) : (
                      <form onSubmit={handleQuickRegisterSubmit} className="space-y-3 text-xs">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm">Apply for Merchant Onboarding</h3>
                          <p className="text-[11px] text-slate-500">Fast-track onboarding for Ranchi shopkeepers & SHGs</p>
                        </div>

                        {regError && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{regError}</span>
                          </div>
                        )}

                        <div>
                          <label className="block font-bold text-slate-700 mb-0.5">Store / Business Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Verma Daily Mart or Mahila Shakti SHG"
                            value={quickReg.shopName}
                            onChange={(e) => setQuickReg({ ...quickReg, shopName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-slate-700 mb-0.5">Owner / Leader Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="Full Name"
                              value={quickReg.ownerName}
                              onChange={(e) => setQuickReg({ ...quickReg, ownerName: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-0.5">WhatsApp Mobile *</label>
                            <input
                              type="tel"
                              required
                              placeholder="10-digit number"
                              value={quickReg.phone}
                              onChange={(e) => setQuickReg({ ...quickReg, phone: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-slate-700 mb-0.5">Partner Type</label>
                            <select
                              value={quickReg.partnerType}
                              onChange={(e) => setQuickReg({ ...quickReg, partnerType: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                            >
                              <option value="KIRANA_GENERAL">Retail Shop / Store</option>
                              <option value="SHG_COOPERATIVE">SHG Women Cooperative</option>
                              <option value="ORGANIC_PRODUCE">Farmer / Fresh Produce</option>
                              <option value="DAIRY_SWEETS">Dairy & Bakery</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-0.5">Store PIN Code</label>
                            <input
                              type="text"
                              required
                              placeholder="834001"
                              value={quickReg.pincode}
                              onChange={(e) => setQuickReg({ ...quickReg, pincode: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-0.5">FSSAI License / Registration No</label>
                          <input
                            type="text"
                            required
                            placeholder="14-digit FSSAI Number"
                            value={quickReg.fssaiNumber}
                            onChange={(e) => setQuickReg({ ...quickReg, fssaiNumber: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={regLoading}
                          className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white font-extrabold py-3 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <span>{regLoading ? 'Submitting Application...' : 'Submit Quick Application'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="text-center pt-1">
                          <Link href="/shop/register" className="text-[11px] text-slate-500 hover:text-emerald-800 underline">
                            Or open Full Multi-Step KYC Form with Document Uploads →
                          </Link>
                        </div>
                      </form>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* HOW WE ARE HELPING YOU & WHAT YOU NEED TO DO MATRIX            */}
        {/* ============================================================== */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-12" id="partner-matrix">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Partner Empowerment Model
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              How We Help You & What You Need To Do
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Clear commitments, transparent rules, and zero hidden platform charges for every partner category.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* PERSONA 1: KIRANA & RETAIL SHOPS */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md hover:border-emerald-300 transition flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                
                {/* Badge & Icon */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064E3B] flex items-center justify-center font-bold">
                    <Store className="w-6 h-6" />
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">
                    Neighborhood Retail
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Local Shops</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Grocery, Provision & Supermarkets</p>
                </div>

                {/* How We Help Them */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black text-[#064E3B] uppercase tracking-wider flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>How We Help You:</span>
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>0% Commission:</strong> Keep 100% of your retail margins on essential staples.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>20-Min Delivery Fleet:</strong> MBM EV riders handle all doorstep delivery so you don’t hire staff.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Daily Bank Payouts:</strong> T+1 automated NEFT/IMPS settlement for all orders fulfilled.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Compete with Dark Stores:</strong> Sell to a 3-5 km neighborhood radius.</span>
                    </li>
                  </ul>
                </div>

                {/* What You Need To Do */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>What You Need To Do:</span>
                  </h4>
                  <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside">
                    <li>Submit FSSAI & Municipal Trade License for KYC verification.</li>
                    <li>Upload inventory using our 1-click CSV template or partner portal.</li>
                    <li>Pack customer orders within <strong>5–7 minutes</strong> of order arrival.</li>
                    <li>Hand over parcel to MBM delivery partner with secret OTP confirmation.</li>
                  </ol>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/shop/register"
                  className="w-full bg-[#064E3B] hover:bg-emerald-950 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                >
                  <span>Apply as Shop Partner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* PERSONA 2: SHG WOMEN & ARTISANAL PRODUCERS */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md hover:border-emerald-300 transition flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                
                {/* Badge & Icon */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF5722] flex items-center justify-center font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="bg-orange-50 text-orange-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-orange-200">
                    Women Empowerment
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">SHG Women Cooperatives</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Artisanal, Handcrafted & Organic Foods</p>
                </div>

                {/* How We Help Them */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black text-[#064E3B] uppercase tracking-wider flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>How We Help You:</span>
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>No Middlemen Cuts:</strong> Sell directly to urban Ranchi households without wholesale cuts.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Dedicated SHG Specials Shelf:</strong> Premium homepage and catalog banner visibility.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Packaging & Branding:</strong> Standardized barcode labelling and moisture-proof packaging guidance.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Guaranteed Procurement:</strong> Predictable recurring bulk purchase orders from MBM Dark Store.</span>
                    </li>
                  </ul>
                </div>

                {/* What You Need To Do */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>What You Need To Do:</span>
                  </h4>
                  <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside">
                    <li>Register SHG group with leader Aadhaar and joint bank passbook.</li>
                    <li>List handcrafted products (Aam ka Achaar, Badi, Bilona Ghee, Honey, Cold-Pressed Mustard Oil).</li>
                    <li>Adhere to FEFO manufacturing batch dates and hygiene standards.</li>
                    <li>Supply ordered lots to Ranchi Central Hub collection depot.</li>
                  </ol>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/producer"
                  className="w-full bg-[#FF5722] hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-orange-500/20"
                >
                  <span>Join as SHG Producer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* PERSONA 3: FARMERS & FRESH GROWERS */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md hover:border-emerald-300 transition flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                
                {/* Badge & Icon */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <span className="bg-blue-50 text-blue-800 font-bold text-[10px] px-2.5 py-1 rounded-full border border-blue-200">
                    Farm Direct
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Farmers & Growers</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Fresh Vegetables, Grains & Pulses</p>
                </div>

                {/* How We Help Them */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black text-[#064E3B] uppercase tracking-wider flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>How We Help You:</span>
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Farm-Gate Procurement:</strong> Offtake from Kanke, Khunti, Ormanjhi, and Namkum farming clusters.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Zero Mandi Distress Sales:</strong> Pre-committed purchase prices for seasonal vegetables.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Zero Weight Pilferage:</strong> Electronic weighment and digital receipt at depot.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Direct DBT Transfers:</strong> Same-day credit to Kisan bank account.</span>
                    </li>
                  </ul>
                </div>

                {/* What You Need To Do */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>What You Need To Do:</span>
                  </h4>
                  <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside">
                    <li>Register your Kisan Mandal or farming cooperative details.</li>
                    <li>Update seasonal harvest schedules (potatoes, tomatoes, green vegetables).</li>
                    <li>Grade produce (A-grade fresh harvest) before morning delivery.</li>
                    <li>Deliver crates to Ranchi Central dark depot by 6:00 AM daily.</li>
                  </ol>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/shop/register"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20"
                >
                  <span>Register as Grower Partner</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </section>

        {/* ============================================================== */}
        {/* HOW TO LIST PRODUCTS (CSV INGESTION EXPLAINER)                 */}
        {/* ============================================================== */}
        <section className="bg-slate-100 py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-200 px-3 py-1 rounded-full">
                Step-by-Step Listing
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                How to Add Products to the Main Site
              </h2>
              <p className="text-xs text-slate-600">
                You don’t need complex software. Upload hundreds of products with our simple spreadsheet template.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064E3B] font-black flex items-center justify-center text-xs">
                  1
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Download Template</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Download our official CSV template with standard product ID, MRP, offered price, and stock columns.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064E3B] font-black flex items-center justify-center text-xs">
                  2
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Enter Your Stock</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fill in your products, available quantity, expiry dates, and your offered Bachat discount price.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064E3B] font-black flex items-center justify-center text-xs">
                  3
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Upload in 1 Click</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Drag and drop the CSV into the Merchant Portal. Our validator checks all rows instantly.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#16A34A] text-white font-black flex items-center justify-center text-xs">
                  4
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">Live on Storefront</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Products are automatically pushed to the customer storefront with your store badge so locals can start buying!
                </p>
              </div>
            </div>

            {/* CSV Format Table Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  <h4 className="text-sm font-black text-slate-900">Standard CSV Column Structure</h4>
                </div>
                <a
                  href="/api/v1/shop/template-csv"
                  download="megabachatmart_inventory_template.csv"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample (.csv)</span>
                </a>
              </div>

              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Column Header</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Example Value</th>
                      <th className="p-2">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                    <tr>
                      <td className="p-2 font-mono font-bold text-[#064E3B]">productId</td>
                      <td className="p-2 text-slate-500">Text</td>
                      <td className="p-2 font-mono">RCH-KRN-101</td>
                      <td className="p-2">Unique identifier for your SKU</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-[#064E3B]">productName</td>
                      <td className="p-2 text-slate-500">Text</td>
                      <td className="p-2">Fortune Sunlite Sunflower Oil</td>
                      <td className="p-2">Full item name displayed on app</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-[#064E3B]">category</td>
                      <td className="p-2 text-slate-500">Enum</td>
                      <td className="p-2">Groceries</td>
                      <td className="p-2">Groceries, Daily Essentials, SHG Specials</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-[#064E3B]">unit</td>
                      <td className="p-2 text-slate-500">Text</td>
                      <td className="p-2">1 Litre Pouch</td>
                      <td className="p-2">Packaging weight or volume</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-[#064E3B]">mrp</td>
                      <td className="p-2 text-slate-500">Number</td>
                      <td className="p-2 font-mono">160</td>
                      <td className="p-2">Original Printed Price (₹)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-[#064E3B]">bachatPrice</td>
                      <td className="p-2 text-slate-500">Number</td>
                      <td className="p-2 font-mono font-bold text-[#16A34A]">138</td>
                      <td className="p-2">Offered price to customers (≤ MRP)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-[#064E3B]">stockQuantity</td>
                      <td className="p-2 text-slate-500">Integer</td>
                      <td className="p-2 font-mono">60</td>
                      <td className="p-2">Number of units in your store shelf</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-[#064E3B]">expiryDate</td>
                      <td className="p-2 text-slate-500">Date</td>
                      <td className="p-2 font-mono">2027-04-15</td>
                      <td className="p-2">Used for FEFO stock safety</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* SUBDOMAIN ARCHITECTURE & DEPLOYMENT INFO                       */}
        {/* ============================================================== */}
        <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-[#064E3B]">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black uppercase tracking-wider">Production Subdomain Architecture</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              MegaBachatMart uses dedicated subdomains to isolate partner operations, administrative controls, and consumer shopping:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-mono font-bold text-emerald-800 text-[11px] block">
                  partners.mymbmart.com
                </span>
                <p className="text-[11px] text-slate-600">
                  <strong>Partner Hub:</strong> Homepage, Shop onboarding, SHG portal, CSV inventory uploader, and order fulfillment.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Directory: <code>/public_html/partners</code>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-mono font-bold text-blue-800 text-[11px] block">
                  admin.mymbmart.com
                </span>
                <p className="text-[11px] text-slate-600">
                  <strong>Admin HQ:</strong> KYC review queue, Master Catalogue, dispatch board, staff roles with 2FA, and pilot playbook.
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Directory: <code>/public_html/admin</code>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
