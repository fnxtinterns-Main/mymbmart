'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Store, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShoppingBag, 
  Tag, 
  Plus, 
  Layers, 
  Calendar, 
  Trash2, 
  ExternalLink,
  LogOut,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CsvProductRow } from '@/lib/shopPartnerStore';

export default function ShopPartnerPortalPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // CSV States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CsvProductRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Storefront products uploaded by this partner
  const [myProducts, setMyProducts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mbm_shop_partner');
      if (saved) {
        setPartner(JSON.parse(saved));
      } else {
        // Fallback for demonstration if direct link opened
        const fallback = {
          shopId: 'MBM-SHP-834006-03',
          shopName: 'Chotanagpur Tribal & Kirana Hub',
          ownerName: 'Sunita Soren',
          phone: '9431109876',
          email: 'chotanagpurtribalhub@gmail.com',
          pincode: '834006',
          address: 'B-9, Kanke Road, Near Birsa Agricultural Univ Gate, Ranchi',
          status: 'ACTIVE',
          totalProductsListed: 3,
          totalStockUnits: 150,
          totalOrdersFulfilled: 14,
          rating: 4.9,
        };
        setPartner(fallback);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current store products from API
  const refreshStoreProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && partner) {
        const matching = data.products.filter(
          (p: any) => p.producerName && p.producerName.includes(partner.shopName)
        );
        setMyProducts(matching);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (partner) {
      refreshStoreProducts();
    }
  }, [partner]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('mbm_shop_partner');
    } catch (e) {}
    router.push('/shop/login');
  };

  // Client-side CSV parser
  const processCsvText = (text: string) => {
    setParseErrors([]);
    setUploadSuccess(null);

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setParseErrors(['CSV file is empty or missing data rows.']);
      setParsedRows([]);
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const expectedHeaders = ['productid', 'productname', 'category', 'unit', 'mrp', 'bachatprice', 'stockquantity'];
    const missing = expectedHeaders.filter((exp) => !header.includes(exp));

    if (missing.length > 0) {
      setParseErrors([`CSV is missing mandatory columns: ${missing.join(', ')}`]);
      setParsedRows([]);
      return;
    }

    const getIdx = (name: string) => header.indexOf(name.toLowerCase());
    const rows: CsvProductRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols: string[] = [];
      let inQuotes = false;
      let cur = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      cols.push(cur.trim());

      const getColVal = (name: string, fallback = '') => {
        const idx = getIdx(name);
        return idx >= 0 && idx < cols.length ? cols[idx].replace(/^"|"$/g, '').trim() : fallback;
      };

      const pid = getColVal('productId') || `SKU-${Date.now()}-${i}`;
      const name = getColVal('productName');
      const cat = (getColVal('category') || 'Groceries') as any;
      const unit = getColVal('unit') || '1 Unit';
      const mrp = parseFloat(getColVal('mrp')) || 0;
      const bachatPrice = parseFloat(getColVal('bachatPrice')) || mrp;
      const stock = parseInt(getColVal('stockQuantity'), 10) || 10;
      const expiry = getColVal('expiryDate') || '2027-12-31';
      const batch = getColVal('batchNumber') || `BATCH-${Date.now()}`;
      const img = getColVal('imageUrl') || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80';
      const ret = getColVal('isReturnable').toLowerCase() !== 'false';

      if (!name) {
        errors.push(`Row ${i + 1}: Missing product name.`);
        continue;
      }
      if (mrp <= 0) {
        errors.push(`Row ${i + 1} (${name}): MRP must be greater than ₹0.`);
        continue;
      }
      if (bachatPrice > mrp) {
        errors.push(`Row ${i + 1} (${name}): Offered Bachat Price (₹${bachatPrice}) cannot exceed MRP (₹${mrp}).`);
        continue;
      }

      rows.push({
        productId: pid,
        productName: name,
        category: cat,
        unit,
        mrp,
        bachatPrice,
        stockQuantity: stock,
        expiryDate: expiry,
        batchNumber: batch,
        imageUrl: img,
        isReturnable: ret,
      });
    }

    setParseErrors(errors);
    setParsedRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) processCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) processCsvText(text);
      };
      reader.readAsText(file);
    } else {
      setParseErrors(['Please upload a valid .csv spreadsheet file.']);
    }
  };

  // Load sample demo CSV directly
  const handleLoadSampleCsv = async () => {
    try {
      const res = await fetch('/api/v1/shop/template-csv');
      const text = await res.text();
      processCsvText(text);
    } catch (e: any) {
      alert('Error fetching sample template: ' + e.message);
    }
  };

  // Publish products to live storefront catalog
  const handlePublishProducts = async () => {
    if (!partner || parsedRows.length === 0) return;
    setIsUploading(true);
    setUploadSuccess(null);

    try {
      const res = await fetch('/api/v1/shop/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: partner.shopId,
          rows: parsedRows,
        }),
      });

      const data = await res.json();
      setIsUploading(false);

      if (data.success) {
        setUploadSuccess(data);
        setParsedRows([]);
        setCsvFile(null);
        refreshStoreProducts();
      } else {
        setParseErrors([data.message || 'Failed to publish products to storefront.']);
      }
    } catch (err: any) {
      setIsUploading(false);
      setParseErrors([err.message || 'Network error during upload.']);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <Navbar cartCount={0} onOpenCart={() => {}} onOpenAuth={() => {}} />

      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Store Partner Top Banner */}
          {partner && (
            <div className="bg-[#064E3B] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center space-x-2 bg-emerald-800/80 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Store Status: ONLINE (Receiving 20-min Quick Orders)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{partner.shopName}</h1>
                <p className="text-xs text-emerald-200">
                  Merchant ID: <code className="bg-emerald-950/60 font-mono px-2 py-0.5 rounded font-bold">{partner.shopId}</code> • Pincode: <strong>{partner.pincode}</strong> • Prop: {partner.ownerName}
                </p>
                <p className="text-[11px] text-emerald-300/80">
                  📍 {partner.address}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 relative z-10">
                <Link
                  href="/shop"
                  target="_blank"
                  className="bg-[#16A34A] hover:bg-[#15803d] text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-900/30"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Live Consumer Store</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="bg-emerald-900/80 hover:bg-emerald-900 text-emerald-200 hover:text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 border border-emerald-700/50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catalog Items</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{myProducts.length} Listed</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Live on MegaBachatMart</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In-Stock Units</span>
              <div className="text-2xl font-black text-[#16A34A] mt-1">{partner?.totalStockUnits || 150}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Ready for 20-min dispatch</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Orders Fulfilled</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{partner?.totalOrdersFulfilled || 14}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Zero cancellation record</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Store Rating</span>
              <div className="text-2xl font-black text-amber-500 mt-1">★ {partner?.rating || 4.9}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified Ranchi customers</p>
            </div>
          </div>

          {/* SECTION: BULK CSV INVENTORY UPLOAD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            {/* Header & Template Download */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Direct Inventory Ingestion</span>
                </div>
                <h2 className="text-xl font-black text-slate-900">Bulk Product Upload via CSV</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload your spreadsheet containing product ID, name, expiry date, MRP, and your offered Bachat Price.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href="/api/v1/shop/template-csv"
                  download="megabachatmart_inventory_template.csv"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 border border-slate-200"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Download CSV Template</span>
                </a>

                <button
                  type="button"
                  onClick={handleLoadSampleCsv}
                  className="bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 border border-emerald-200 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Load 6 Demo FMCG Items</span>
                </button>
              </div>
            </div>

            {/* Success Alert */}
            {uploadSuccess && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-900 space-y-2 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center space-x-2 text-emerald-800 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{uploadSuccess.message}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All <strong>{uploadSuccess.importedCount} products</strong> have been successfully registered into the MegaBachatMart inventory store and added to the live consumer catalog for <strong>{partner?.pincode}</strong> polygon customers.
                </p>
                <div className="pt-2 flex items-center space-x-3">
                  <Link
                    href="/shop"
                    target="_blank"
                    className="bg-[#16A34A] hover:bg-[#15803d] text-white px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5"
                  >
                    <span>View Newly Added Items on Storefront →</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Error Alerts */}
            {parseErrors.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                <div className="font-extrabold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>CSV Validation Notice:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 pt-1 text-[11px]">
                  {parseErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dropzone & File Input */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition flex flex-col items-center justify-center space-y-3 cursor-pointer ${
                dragActive
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {csvFile ? `Selected: ${csvFile.name}` : 'Drag & Drop your completed CSV file here'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supports .csv with productId, productName, category, unit, mrp, bachatPrice, stockQuantity, expiryDate
                </p>
              </div>

              <label className="bg-[#064E3B] hover:bg-emerald-950 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer">
                <span>Browse File from Computer</span>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {/* PREVIEW & IMPORT TABLE */}
            {parsedRows.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Validated Products Preview ({parsedRows.length} items ready to import)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verify original MRP and your offered Bachat Price before publishing to live shoppers.
                    </p>
                  </div>

                  <button
                    onClick={handlePublishProducts}
                    disabled={isUploading}
                    className="bg-[#16A34A] hover:bg-[#15803d] text-white font-black px-6 py-3 rounded-2xl text-xs shadow-lg shadow-emerald-700/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isUploading ? 'Publishing to Storefront...' : 'Publish & Add to Main Site'}</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Item</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Pack Unit</th>
                          <th className="py-3 px-4">Original MRP</th>
                          <th className="py-3 px-4">Bachat Price (Offered)</th>
                          <th className="py-3 px-4">Customer Bachat</th>
                          <th className="py-3 px-4">Stock Qty</th>
                          <th className="py-3 px-4">Expiry Date</th>
                          <th className="py-3 px-4 text-right">Batch</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, idx) => {
                          const savings = row.mrp - row.bachatPrice;
                          const discPct = Math.round((savings / row.mrp) * 100);

                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                  <img 
                                    src={row.imageUrl} 
                                    alt={row.productName} 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{row.productName}</div>
                                  <div className="font-mono text-[10px] text-slate-400">{row.productId}</div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  {row.category}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-slate-700 font-medium">{row.unit}</td>

                              <td className="py-3 px-4 text-slate-400 line-through">₹{row.mrp}</td>

                              <td className="py-3 px-4 font-black text-slate-900">
                                ₹{row.bachatPrice}
                              </td>

                              <td className="py-3 px-4">
                                <span className="inline-block bg-emerald-50 text-emerald-700 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">
                                  Save ₹{savings} ({discPct}% OFF)
                                </span>
                              </td>

                              <td className="py-3 px-4 font-bold text-slate-900">{row.stockQuantity} Units</td>

                              <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{row.expiryDate}</td>

                              <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                                {row.batchNumber}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => { setParsedRows([]); setCsvFile(null); }}
                    className="text-xs text-rose-600 hover:underline flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear and re-upload</span>
                  </button>

                  <button
                    onClick={handlePublishProducts}
                    disabled={isUploading}
                    className="bg-[#16A34A] hover:bg-[#15803d] text-white font-black px-6 py-3 rounded-2xl text-xs shadow-lg shadow-emerald-700/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isUploading ? 'Publishing to Storefront...' : 'Publish & Add to Main Site'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* SECTION: CURRENT STOREFRONT INVENTORY LISTED BY THIS PARTNER */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Currently Live Products on MegaBachatMart Storefront
                </h3>
                <p className="text-xs text-slate-500">
                  Products listed by {partner?.shopName} visible to local buyers.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshStoreProducts}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                  title="Refresh Live Products"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Link
                  href="/shop"
                  target="_blank"
                  className="bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                >
                  <span>Open Customer Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {myProducts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No products uploaded yet. Download our CSV template above, fill your items, and click Publish!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {myProducts.map((p) => (
                  <div key={p.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white hover:border-emerald-300 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                        <span className="text-[10px] text-slate-500">{p.unit} • {p.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 line-through text-[11px]">₹{p.mrp}</span>
                        <span className="font-black text-slate-900 ml-1.5">₹{p.bachatPrice}</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {p.discountPercent}% OFF
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Status: <strong className="text-emerald-700">IN STOCK</strong></span>
                      <span className="font-mono text-slate-400">{p.sku}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
