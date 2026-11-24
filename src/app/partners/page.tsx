'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  Users, 
  Sprout, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  FileSpreadsheet, 
  Download, 
  Lock, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  ExternalLink, 
  Phone, 
  Mail, 
  MapPin, 
  Eye, 
  EyeOff, 
  Table, 
  FileText, 
  Camera, 
  Upload, 
  Plus
} from 'lucide-react';
import { Footer } from '@/components/Footer';
import { productImageLibrary } from '@/lib/productImageLibrary';

export default function PartnersHomePage() {
  const router = useRouter();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // CSV table view toggle: 'preview' (realistic spreadsheet) vs 'spec' (data dictionary)
  const [activeCsvTab, setActiveCsvTab] = useState<'preview' | 'spec'>('preview');

  // Interactive CSV Ingestion & Direct Photo Upload States
  const [csvRows, setCsvRows] = useState<any[]>([
    {
      productId: 'RCH-KRN-101',
      productName: 'Fortune Sunlite Refined Sunflower Oil',
      category: 'Groceries',
      unit: '1 Litre Pouch',
      mrp: 160,
      bachatPrice: 138,
      stockQuantity: 60,
      expiryDate: '2027-04-15',
      batchNumber: 'BCH-FTN-2026-A1',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&auto=format&fit=crop&q=80',
      isReturnable: true,
    },
    {
      productId: 'RCH-KRN-102',
      productName: 'Tata Tea Gold Premium Assam Blended Tea',
      category: 'Daily Essentials',
      unit: '500 g',
      mrp: 330,
      bachatPrice: 285,
      stockQuantity: 40,
      expiryDate: '2027-08-20',
      batchNumber: 'BCH-TTG-2026-X4',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80',
      isReturnable: true,
    },
    {
      productId: 'RCH-KRN-103',
      productName: 'Aashirvaad Superior MP Sharbati Whole Wheat Atta',
      category: 'Groceries',
      unit: '5 kg Pack',
      mrp: 295,
      bachatPrice: 249,
      stockQuantity: 50,
      expiryDate: '2026-12-10',
      batchNumber: 'BCH-ASH-2026-M2',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80',
      isReturnable: true,
    },
    {
      productId: 'RCH-KRN-104',
      productName: 'Britannia Good Day Butter Cookies Family Pack',
      category: 'Daily Essentials',
      unit: '600 g (Pack of 5)',
      mrp: 120,
      bachatPrice: 96,
      stockQuantity: 75,
      expiryDate: '2027-02-28',
      batchNumber: 'BCH-BRT-2026-K9',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&auto=format&fit=crop&q=80',
      isReturnable: false,
    },
    {
      productId: 'RCH-KRN-105',
      productName: 'Dettol Original Germ Protection Antiseptic Liquid',
      category: 'Daily Essentials',
      unit: '550 ml Bottle',
      mrp: 215,
      bachatPrice: 189,
      stockQuantity: 35,
      expiryDate: '2028-06-30',
      batchNumber: 'BCH-DTL-2026-D3',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80',
      isReturnable: true,
    },
    {
      productId: 'RCH-KRN-106',
      productName: 'Handcrafted Organic Chana Dal Badi (Vadi)',
      category: 'SHG Specials',
      unit: '400 g Pack',
      mrp: 180,
      bachatPrice: 140,
      stockQuantity: 45,
      expiryDate: '2026-11-30',
      batchNumber: 'BCH-VAD-2026-S1',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&auto=format&fit=crop&q=80',
      isReturnable: true,
    },
  ]);

  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const [uploadingRowIdx, setUploadingRowIdx] = useState<number | null>(null);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<any | null>(null);
  const [csvUploadNotice, setCsvUploadNotice] = useState<string | null>(null);

  // Direct Photo Upload for a row in CSV
  const handleUploadRowPhoto = async (idx: number, file: File) => {
    const row = csvRows[idx];
    if (!row) return;
    setUploadingRowIdx(idx);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const res = await fetch('/api/products/image-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: row.productId,
            productName: row.productName,
            category: row.category,
            imageData: base64,
          }),
        });
        const data = await res.json();
        setUploadingRowIdx(null);
        if (data.success && data.imageUrl) {
          setCsvRows((prev) =>
            prev.map((r, i) => (i === idx ? { ...r, image: data.imageUrl, imageUrl: data.imageUrl } : r))
          );
          productImageLibrary.saveProductImage(row.productId, data.imageUrl);
          productImageLibrary.saveProductImage(row.productName, data.imageUrl);
          setUploadToast(`📸 Real photo attached for "${row.productName}"! It will be shown on the live store when published.`);
          setTimeout(() => setUploadToast(null), 5000);
        } else {
          alert(data.message || 'Failed to upload photo.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingRowIdx(null);
      alert('Photo upload failed: ' + err.message);
    }
  };

  // Batch upload multiple image files directly from device and map them to CSV rows
  const handleBatchImageUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || csvRows.length === 0) return;
    setIsBatchUploading(true);
    let matched = 0;
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const cleanName = file.name.toLowerCase().replace(/\.[^/.]+$/, '').trim();
      const targetIdx = csvRows.findIndex((row) => {
        const pid = row.productId.toLowerCase().trim();
        const pName = row.productName.toLowerCase().trim();
        return pid === cleanName || cleanName.includes(pid) || pName.includes(cleanName) || (row.imageFile && row.imageFile.toLowerCase().includes(cleanName));
      });

      if (targetIdx !== -1) {
        matched++;
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            try {
              const res = await fetch('/api/products/image-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productId: csvRows[targetIdx].productId,
                  productName: csvRows[targetIdx].productName,
                  imageData: base64,
                }),
              });
              const data = await res.json();
              if (data.success && data.imageUrl) {
                setCsvRows((prev) =>
                  prev.map((r, i) => (i === targetIdx ? { ...r, image: data.imageUrl, imageUrl: data.imageUrl } : r))
                );
                productImageLibrary.saveProductImage(csvRows[targetIdx].productId, data.imageUrl);
                productImageLibrary.saveProductImage(csvRows[targetIdx].productName, data.imageUrl);
              }
            } catch {}
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }

    setIsBatchUploading(false);
    if (matched > 0) {
      setUploadToast(`✓ Successfully matched and attached ${matched} photos directly to your products!`);
      setTimeout(() => setUploadToast(null), 6000);
    } else {
      alert(`Uploaded ${fileArray.length} photos, but could not auto-match by SKU or filename. You can use the "+ Add Image" button on each row!`);
    }
  };

  // CSV file drag & browse uploader
  const handleCsvFileInput = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length < 2) {
        alert('CSV file is empty or missing headers.');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const getIdx = (col: string) => headers.indexOf(col.toLowerCase());
      const parsed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length < 2) continue;
        const pid = (getIdx('productid') >= 0 ? parts[getIdx('productid')] : '') || `SKU-${i}`;
        const name = (getIdx('productname') >= 0 ? parts[getIdx('productname')] : '') || `Product ${i}`;
        const cat = (getIdx('category') >= 0 ? parts[getIdx('category')] : 'Groceries');
        const unit = (getIdx('unit') >= 0 ? parts[getIdx('unit')] : '1 Unit');
        const mrp = parseFloat(getIdx('mrp') >= 0 ? parts[getIdx('mrp')] : '0') || 0;
        const bachat = parseFloat(getIdx('bachatprice') >= 0 ? parts[getIdx('bachatprice')] : '0') || mrp;
        const stock = parseInt(getIdx('stockquantity') >= 0 ? parts[getIdx('stockquantity')] : '0', 10) || 0;
        const exp = (getIdx('expirydate') >= 0 ? parts[getIdx('expirydate')] : '') || 'Not Available';
        const batch = (getIdx('batchnumber') >= 0 ? parts[getIdx('batchnumber')] : `BCH-${Date.now()}`);
        const imgCol = getIdx('image') >= 0 ? parts[getIdx('image')] : (getIdx('imageurl') >= 0 ? parts[getIdx('imageurl')] : '');
        const ret = getIdx('isreturnable') >= 0 ? parts[getIdx('isreturnable')].toLowerCase() !== 'false' : true;

        parsed.push({
          productId: pid,
          productName: name,
          category: cat,
          unit,
          mrp,
          bachatPrice: bachat,
          stockQuantity: stock,
          expiryDate: exp,
          batchNumber: batch,
          image: imgCol.startsWith('http') || imgCol.startsWith('/uploads/') ? imgCol : productImageLibrary.resolveImage({ productId: pid, productName: name, category: cat as any }),
          imageFile: imgCol,
          isReturnable: ret,
        });
      }
      if (parsed.length > 0) {
        setCsvRows(parsed);
        setPublishSuccess(null);
        setCsvUploadNotice(`✓ Loaded ${parsed.length} products from ${file.name}. You can add photos below before publishing!`);
        setTimeout(() => setCsvUploadNotice(null), 6000);
      }
    };
    reader.readAsText(file);
  };

  // Publish products to live storefront catalog
  const handlePublishToLiveStore = async () => {
    if (csvRows.length === 0) return;
    setIsPublishing(true);
    setPublishSuccess(null);
    try {
      const res = await fetch('/api/v1/shop/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: 'MBM-SHP-834006-03',
          rows: csvRows.map((r) => ({
            ...r,
            imageUrl: r.image,
          })),
        }),
      });
      const data = await res.json();
      setIsPublishing(false);
      if (data.success) {
        setPublishSuccess({
          success: true,
          count: data.importedCount || csvRows.length,
          message: `All ${data.importedCount || csvRows.length} products have been published to the live customer store!`,
        });
      } else {
        alert(data.message || 'Failed to publish products.');
      }
    } catch (err: any) {
      setIsPublishing(false);
      alert('Publishing failed: ' + err.message);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0F172A]">
      
      {/* ============================================================== */}
      {/* B2B DEDICATED PARTNER HEADER (REPLACES CONSUMER NAVBAR)        */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Logo & Hub Badge */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="relative w-40 sm:w-52 h-10 sm:h-12 block group" aria-label="MegaBachatMart Home">
                <Image
                  src="/images/LOgo.jpeg"
                  alt="MegaBachatMart"
                  fill
                  priority
                  className="object-contain object-left group-hover:scale-102 transition-transform"
                />
              </Link>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Partner Hub</span>
              </span>
            </div>

            {/* B2B Portal Navigation */}
            <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-600">
              <Link href="/" className="hover:text-emerald-700 transition flex items-center space-x-1">
                <span>← Customer Store</span>
              </Link>
              <a href="#partner-matrix" className="hover:text-emerald-700 transition">
                Who We Help
              </a>
              <a href="#listing-guide" className="hover:text-emerald-700 transition">
                CSV Listing
              </a>
              <a href="#partner-support" className="hover:text-emerald-700 transition">
                Support & Helpline
              </a>
            </nav>

            {/* Portal Action CTAs */}
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <Link
                href="/shop/register"
                className="bg-[#16A34A] hover:bg-[#15803d] text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-100" />
                <span>Join as Partner (KYC)</span>
              </Link>
              <Link
                href="/shop/portal"
                className="border border-slate-200 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 bg-white"
              >
                <Store className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Partner</span>
                <span>Portal</span>
              </Link>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1 pb-16">
        
        {/* ============================================================== */}
        {/* HERO SECTION                                                  */}
        {/* ============================================================== */}
        <section className="bg-[#064E3B] text-white pt-10 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
          {/* Ambient Lighting & Glow Accents */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-emerald-950/40 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            {/* Left Column: Vision & Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center space-x-2 bg-emerald-800/80 border border-emerald-400/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-200 backdrop-blur-xs">
                <Store className="w-4 h-4 text-emerald-300" />
                <span>partners.mymbmart.com • Dedicated Merchant & SHG Hub</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Empowering Shops, SHG Women & Farmers
              </h1>

              <p className="text-sm sm:text-base text-emerald-100 leading-relaxed max-w-xl">
                Protect your store from predatory quick-commerce dark stores. MegaBachatMart connects local neighborhood merchants to digital shoppers with <strong>zero unfair commissions</strong>, <strong>20-minute local delivery</strong>, and <strong>guaranteed daily bank payouts</strong>.
              </p>

              {/* Key Trust Stats Glassmorphic Cards */}
              <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 text-center hover:bg-white/15 transition shadow-lg shadow-black/10">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300">0%</div>
                  <div className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-1">Platform Commission</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 text-center hover:bg-white/15 transition shadow-lg shadow-black/10">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300">20–30m</div>
                  <div className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-1">Delivery Radius</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 text-center hover:bg-white/15 transition shadow-lg shadow-black/10">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300">Daily T+1</div>
                  <div className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-1">Direct Bank Payouts</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/shop/register"
                  className="bg-[#16A34A] hover:bg-[#15803d] text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-950/30 transition flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Join as Partner (KYC)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#partner-matrix"
                  className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border border-emerald-600/40 transition flex items-center space-x-1.5"
                >
                  <span>Explore What You Need To Do</span>
                </a>

                <a
                  href="/api/v1/shop/template-csv"
                  download="megabachatmart_inventory_template.csv"
                  className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border border-emerald-600/40 transition flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Download Inventory CSV</span>
                </a>
              </div>

            </div>

            {/* Right Column: Clean, Focused Partner Sign In Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 text-[#0F172A] shadow-2xl border border-emerald-100 space-y-5">
                
                {/* Clean Header */}
                <div className="border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-[#064E3B] uppercase tracking-wider mb-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Partner Authentication</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Sign In to Partner Portal</h3>
                  <p className="text-[11px] text-slate-500">Access store inventory, order dispatch, and live fulfillment desk</p>
                </div>

                {/* SIGN IN FORM */}
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Dispatched to your registered WhatsApp upon KYC approval
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

                  {/* Clean, Non-bloated KYC Link Footer */}
                  <div className="pt-2 text-center text-xs">
                    <span className="text-slate-500">New merchant, SHG, or farmer? </span>
                    <Link
                      href="/shop/register"
                      className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center"
                    >
                      <span>Apply for Partner KYC</span>
                      <ArrowRight className="w-3 h-3 ml-0.5 inline" />
                    </Link>
                  </div>

                  {/* Quick Demo Fill Shortcut (Development / Testing Only) */}
                  {process.env.NODE_ENV !== 'production' && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                        Quick Fill Approved Test Accounts (Dev Only)
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickDemoFill('MBM-SHP-834001-23', 'MBM#Test001@2026')}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700 text-[11px] transition flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-emerald-800">Test Store (Prop: RAJ)</span>
                            <span className="text-slate-500 block text-[10px]">ID: MBM-SHP-834001-23 • Pwd: MBM#Test001@2026</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            Fill
                          </span>
                        </button>

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
                            Fill
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>

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
                  href="/shop/register?category=FARM_DIRECT"
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
        {/* HOW TO LIST PRODUCTS (CSV INGESTION EXPLAINER + TOGGLE)        */}
        {/* ============================================================== */}
        <section className="bg-slate-100/80 py-16 px-4 sm:px-6" id="listing-guide">
          <div className="max-w-5xl mx-auto space-y-8">
            
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-200/70 px-3 py-1 rounded-full">
                Step-by-Step Listing
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                How to Add Products to the Main Site
              </h2>
              <p className="text-xs text-slate-600">
                You don’t need complex software. Upload hundreds of products with our simple spreadsheet template.
              </p>
            </div>

            {/* 4-Step Process Cards */}
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

            {/* CSV Interactive Table Box (Preview Toggle & Specification) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      Inventory CSV Structure & Sample
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Switch between the spreadsheet preview and column data dictionary.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* View Mode Toggle Buttons */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveCsvTab('preview')}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                        activeCsvTab === 'preview'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      <span>Spreadsheet Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCsvTab('spec')}
                      className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                        activeCsvTab === 'spec'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Column Schema</span>
                    </button>
                  </div>

                  {/* Action Buttons: Add 1 Product, Batch Upload, Upload CSV, Download Template, Publish */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Add 1 Product with Image Button */}
                    <Link
                      href="/shop/portal"
                      className="inline-flex items-center space-x-1.5 text-xs font-bold bg-[#064E3B] hover:bg-emerald-950 text-white px-3 py-1.5 rounded-xl transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-300" />
                      <span>+ Add 1 Product with Image</span>
                    </Link>

                    {/* Upload CSV Button */}
                    <label className="inline-flex items-center space-x-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Upload CSV</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleCsvFileInput(e.target.files[0]);
                        }}
                      />
                    </label>

                    {/* Batch Upload Images */}
                    <label className="inline-flex items-center space-x-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-300 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs">
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isBatchUploading ? 'Uploading Photos...' : 'Batch Upload Images'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        disabled={isBatchUploading}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) handleBatchImageUpload(e.target.files);
                        }}
                      />
                    </label>

                    {/* Download Template Button */}
                    <a
                      href="/api/v1/shop/template-csv"
                      download="megabachatmart_inventory_template.csv"
                      className="inline-flex items-center space-x-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl transition"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-700" />
                      <span>Download .CSV</span>
                    </a>

                    {/* Publish to Storefront Button */}
                    <button
                      type="button"
                      onClick={handlePublishToLiveStore}
                      disabled={isPublishing}
                      className="inline-flex items-center space-x-1.5 text-xs font-black bg-[#16A34A] hover:bg-[#15803d] text-white px-3.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isPublishing ? 'Publishing...' : 'Publish to Live Store'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Toast & Status Alerts */}
              {uploadToast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadToast}</span>
                  </div>
                  <button onClick={() => setUploadToast(null)} className="text-emerald-700 hover:text-emerald-950 font-black cursor-pointer">✕</button>
                </div>
              )}

              {csvUploadNotice && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between">
                  <span>{csvUploadNotice}</span>
                  <button onClick={() => setCsvUploadNotice(null)} className="text-blue-700 font-black cursor-pointer">✕</button>
                </div>
              )}

              {publishSuccess && (
                <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl text-slate-900 space-y-2.5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center space-x-2 text-emerald-800 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{publishSuccess.message}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    All products with your uploaded real photos are now live on the MegaBachatMart storefront and immediately visible to customer pincodes.
                  </p>
                  <div className="pt-1">
                    <Link
                      href="/shop"
                      target="_blank"
                      className="inline-flex items-center space-x-2 bg-[#16A34A] hover:bg-[#15803d] text-white font-black px-4 py-2 rounded-xl text-xs shadow-sm transition"
                    >
                      <span>View Live Products on Storefront (mymbmart.com/shop)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* TAB 1: SPREADSHEET PREVIEW & INTERACTIVE BULK PHOTO ATTACH */}
              {activeCsvTab === 'preview' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto text-[11px] rounded-xl border border-slate-200">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5 w-32 text-center bg-emerald-50/60 font-extrabold text-[#064E3B]">Image (Add Photo)</th>
                          <th className="p-2.5">Product Name & SKU</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Packaging Unit</th>
                          <th className="p-2.5 text-right">MRP</th>
                          <th className="p-2.5 text-right">Bachat Price</th>
                          <th className="p-2.5 text-center">In-Stock</th>
                          <th className="p-2.5">Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {csvRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition">
                            <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                            
                            {/* Dedicated Image Column with Live Photo Attach */}
                            <td className="p-2.5 bg-emerald-50/20 text-center">
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-emerald-200 group shadow-2xs">
                                  <img 
                                    src={row.image} 
                                    alt={row.productName} 
                                    className="w-full h-full object-cover" 
                                  />
                                  <label 
                                    className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                    title="Click to change photo"
                                  >
                                    <Camera className="w-3.5 h-3.5 text-emerald-300" />
                                    <span className="text-[7px] font-bold mt-0.5">Change</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={uploadingRowIdx === idx}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadRowPhoto(idx, file);
                                      }}
                                    />
                                  </label>
                                </div>

                                <label 
                                  className={`inline-flex items-center space-x-1 text-[9px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer shadow-2xs ${
                                    row.image?.includes('/uploads/') || row.image?.startsWith('data:')
                                      ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                      : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                                  }`}
                                  title="Upload or change image for this product"
                                >
                                  <Camera className="w-2.5 h-2.5" />
                                  <span>
                                    {uploadingRowIdx === idx 
                                      ? 'Uploading...' 
                                      : row.image?.includes('/uploads/') || row.image?.startsWith('data:')
                                      ? '✓ Uploaded' 
                                      : '+ Add Image'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingRowIdx === idx}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadRowPhoto(idx, file);
                                    }}
                                  />
                                </label>
                              </div>
                            </td>

                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{row.productName}</div>
                              <div className="font-mono text-[10px] text-slate-400">SKU: {row.productId}</div>
                            </td>
                            <td className="p-2.5">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700">
                                {row.category}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-600">{row.unit}</td>
                            <td className="p-2.5 text-right line-through text-slate-400">₹{row.mrp}</td>
                            <td className="p-2.5 text-right font-extrabold text-[#16A34A]">₹{row.bachatPrice}</td>
                            <td className="p-2.5 text-center">
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                {row.stockQuantity} units
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">{row.expiryDate || 'Not Available'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Notice for Storekeepers:</strong> You do not need image hosting or web URLs! In place of image URLs, put your image file name (e.g. <code>RCH-KRN-101.jpg</code>) or leave it blank. You can directly upload product photos from your mobile camera or computer right here or in your Merchant Portal!
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: COLUMN SPECIFICATION / DATA DICTIONARY */}
              {activeCsvTab === 'spec' && (
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Column Header</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Required?</th>
                        <th className="p-2.5">Example Value</th>
                        <th className="p-2.5 font-sans">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-[#064E3B]">productId</td>
                        <td className="p-2.5 text-slate-500 font-mono">Text</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Required</span></td>
                        <td className="p-2.5 font-mono">RCH-KRN-101</td>
                        <td className="p-2.5">Unique SKU code in your store</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-[#064E3B]">productName</td>
                        <td className="p-2.5 text-slate-500 font-mono">Text</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Required</span></td>
                        <td className="p-2.5">Fortune Sunlite Sunflower Oil</td>
                        <td className="p-2.5">Item title shown on customer app</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-[#064E3B]">category</td>
                        <td className="p-2.5 text-slate-500 font-mono">Enum</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Required</span></td>
                        <td className="p-2.5">Groceries</td>
                        <td className="p-2.5">Groceries, Daily Essentials, SHG Specials, Farm Direct</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-[#064E3B]">unit</td>
                        <td className="p-2.5 text-slate-500 font-mono">Text</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Required</span></td>
                        <td className="p-2.5">1 Litre Pouch</td>
                        <td className="p-2.5">Packaging volume, weight, or count</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-[#064E3B]">mrp</td>
                        <td className="p-2.5 text-slate-500 font-mono">Number</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Required</span></td>
                        <td className="p-2.5 font-mono">160</td>
                        <td className="p-2.5">Printed Maximum Retail Price (₹)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-[#064E3B]">bachatPrice</td>
                        <td className="p-2.5 text-slate-500 font-mono">Number</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Required</span></td>
                        <td className="p-2.5 font-mono font-bold text-[#16A34A]">138</td>
                        <td className="p-2.5">Customer discounted selling price (≤ MRP)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-[#064E3B]">stockQuantity</td>
                        <td className="p-2.5 text-slate-500 font-mono">Integer</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Required</span></td>
                        <td className="p-2.5 font-mono">60</td>
                        <td className="p-2.5">Live stock quantity available on shelves</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-[#064E3B]">expiryDate</td>
                        <td className="p-2.5 text-slate-500 font-mono">Date</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Optional</span></td>
                        <td className="p-2.5 font-mono">2027-04-15</td>
                        <td className="p-2.5">YYYY-MM-DD format for FEFO rotation safety</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-[#064E3B]">image</td>
                        <td className="p-2.5 text-slate-500 font-mono">Image / File</td>
                        <td className="p-2.5"><span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Optional</span></td>
                        <td className="p-2.5 font-mono text-[10px] text-slate-500">RCH-KRN-101.jpg or camera upload</td>
                        <td className="p-2.5">Add image directly from phone camera or PC in the Merchant Portal. No image URL needed!</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* PARTNER SUPPORT & LOCAL ONBOARDING HELPLINE                   */}
        {/* (REPLACES OLD INTERNAL HOSTING / SUBDOMAIN FILEPATHS)         */}
        {/* ============================================================== */}
        <section className="py-14 px-4 sm:px-6 max-w-5xl mx-auto" id="partner-support">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Ranchi Partner Support Desk
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Partner Support & Local Onboarding Helpline
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Need help registering your shop, verifying licenses, or uploading your first inventory CSV? Our Ranchi team is on standby.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SLA: 2–4 Hr KYC Approval</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: WhatsApp & Phone */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Phone className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Direct Partner Helpline</h4>
                <p className="text-xs text-slate-600">
                  Call or WhatsApp our merchant onboarding desk for instant assistance with KYC or portal credentials.
                </p>
                <div className="pt-1 space-y-1">
                  <a
                    href="tel:+919431109876"
                    className="text-xs font-mono font-bold text-emerald-800 hover:underline block"
                  >
                    +91 94311 09876
                  </a>
                  <span className="text-[11px] text-slate-500 block">Mon–Sat, 7:00 AM – 9:00 PM IST</span>
                </div>
              </div>

              {/* Card 2: Central Hub & Dispatch Center */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Central Depot & Ingestion Desk</h4>
                <p className="text-xs text-slate-600">
                  In-person merchant verification, crate drops for SHG & farmers, and physical onboarding assistance.
                </p>
                <div className="pt-1">
                  <span className="text-xs font-medium text-slate-700 block">
                    MegaBachatMart Central Dark Depot, Kokar Industrial Area, Ranchi, Jharkhand – 834001
                  </span>
                </div>
              </div>

              {/* Card 3: Digital Inquiries */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">Merchant Desk Email</h4>
                <p className="text-xs text-slate-600">
                  Send bulk inventory sheets, municipal trade inquiries, or partnership proposals.
                </p>
                <div className="pt-1 space-y-1">
                  <a
                    href="mailto:partners@mymbmart.com"
                    className="text-xs font-mono font-bold text-emerald-800 hover:underline block"
                  >
                    partners@mymbmart.com
                  </a>
                  <span className="text-[11px] text-slate-500 block">Typical response within 2 hours</span>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Frequently Asked Merchant Questions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-900 block">Is there any setup fee or security deposit?</span>
                  <p className="text-[11px] leading-relaxed">
                    No. Registration, catalog listing, and onboarding are 100% free with zero security deposits or advance payments.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-900 block">How do daily bank payouts work?</span>
                  <p className="text-[11px] leading-relaxed">
                    All orders fulfilled by your store today are settled to your bank account via automated IMPS/NEFT by 11:00 AM the following morning (T+1).
                  </p>
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
