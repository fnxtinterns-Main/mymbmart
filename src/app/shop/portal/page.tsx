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
  Check,
  Camera,
  Image as ImageIcon,
  Bike,
  PackageCheck,
  PackageOpen,
  QrCode,
  MapPin,
  Phone,
  User,
  Play
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import type { CsvProductRow } from '@/lib/shopPartnerStore';
import { productImageLibrary } from '@/lib/productImageLibrary';
import { generateShopReportCsv, triggerCsvDownload } from '@/lib/reportGenerator';

export default function ShopPartnerPortalPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Photo Upload States
  const [photoToast, setPhotoToast] = useState<string | null>(null);
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);

  // Generate and Download Shop Report (Sales, Refunds, Credit Line)
  const handleDownloadShopReport = () => {
    if (!partner) return;
    const csv = generateShopReportCsv({
      shopId: partner.shopId,
      shopName: partner.shopName,
      ownerName: partner.ownerName,
      pincode: partner.pincode,
      dateRange: 'Live Operational Shift',
      grossSales: 4890,
      totalOrders: partner.totalOrdersFulfilled || 14,
      refundsDeducted: 140,
      creditLineLimit: 100000,
      creditLineUtilized: 24500,
      creditLineAvailable: 75500,
      commissionSaved: 1220,
      netPayoutTransferred: 4750,
    });
    triggerCsvDownload(`MBM_Shop_Financial_Report_${partner.shopId}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  // CSV States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CsvProductRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Storefront products uploaded by this partner
  const [myProducts, setMyProducts] = useState<any[]>([]);

  // Live Store Order Management State
  const [storeOrders, setStoreOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activePortalTab, setActivePortalTab] = useState<'orders' | 'inventory' | 'finance'>('orders');
  const [orderActionMsg, setOrderActionMsg] = useState<string | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<any | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const refreshStoreOrders = async () => {
    try {
      const res = await fetch('/api/store/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setStoreOrders(data.orders);
      }
    } catch (e) {
      console.error('Failed to fetch store orders:', e);
    }
  };

  useEffect(() => {
    refreshStoreOrders();
    const interval = setInterval(refreshStoreOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderStatusUpdate = async (orderId: string, action: string, extra: any = {}) => {
    try {
      const res = await fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action, ...extra }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderActionMsg(data.message);
        setTimeout(() => setOrderActionMsg(null), 4000);
        refreshStoreOrders();
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    }
  };

  const handleVerifyPickupHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingOrder) return;
    setOtpError('');
    try {
      const res = await fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: verifyingOrder.id,
          action: 'VERIFY_PICKUP',
          pickupCode: otpInput.trim(),
          paymentCollected: true,
          staffName: partner?.ownerName || 'Store Counter Staff',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyingOrder(null);
        setOtpInput('');
        setOrderActionMsg(data.message);
        setTimeout(() => setOrderActionMsg(null), 4000);
        refreshStoreOrders();
      } else {
        setOtpError(data.error || 'Invalid OTP code. Please check with customer.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed');
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mbm_shop_partner');
      if (saved) {
        setPartner(JSON.parse(saved));
      } else {
        // Fallback for demonstration if direct link opened
        const fallback = {
          shopId: 'MBM-SHP-834006-03',
          shopName: 'Chotanagpur Tribal & Retail Hub',
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
      const explicitImg = getColVal('imageUrl');
      const img = explicitImg && explicitImg.length > 5 && !explicitImg.includes('photo-1540420773420-3366772f4999')
        ? explicitImg
        : productImageLibrary.resolveImage({
            productId: pid,
            productName: name,
            category: cat,
          });
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

  // Upload or Change Real Photo for a Product
  const handleUploadProductPhoto = async (productId: string, productName: string, file: File) => {
    setUploadingPhotoFor(productId);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const res = await fetch('/api/products/image-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            productName,
            imageData: base64,
          }),
        });
        const data = await res.json();
        setUploadingPhotoFor(null);
        if (data.success) {
          // Update live state
          setMyProducts((prev) =>
            prev.map((item) => (item.id === productId ? { ...item, image: data.imageUrl } : item))
          );
          setPhotoToast(`📸 Photo updated and permanently saved for "${productName}"! You will not need to upload it again when restocking.`);
          setTimeout(() => setPhotoToast(null), 6000);
        } else {
          alert(data.message || 'Failed to upload photo.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingPhotoFor(null);
      alert('Photo upload failed: ' + err.message);
    }
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
                <button
                  onClick={handleDownloadShopReport}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-4 py-2.5 rounded-2xl text-xs transition flex items-center space-x-1.5 shadow-md shadow-emerald-950/20 cursor-pointer"
                  title="Download Sales, Refunds, and Credit Line Audit CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Generate Shop Report</span>
                </button>

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

          {/* Order Action Feedback Notification */}
          {orderActionMsg && (
            <div className="bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                <span>{orderActionMsg}</span>
              </div>
              <button onClick={() => setOrderActionMsg(null)} className="text-emerald-200 hover:text-white">✕</button>
            </div>
          )}

          {/* Photo Upload Toast Notification */}
          {photoToast && (
            <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{photoToast}</span>
              </div>
              <button onClick={() => setPhotoToast(null)} className="text-emerald-200 hover:text-white ml-3">
                ✕
              </button>
            </div>
          )}

          {/* Navigation Tabs for Partner Operations */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActivePortalTab('orders')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
                activePortalTab === 'orders'
                  ? 'bg-[#064E3B] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PackageOpen className="w-4 h-4" />
              <span>Live Orders & Packing Desk</span>
              {storeOrders.filter((o) => ['PLACED', 'CONFIRMED', 'PACKING', 'PROCESSING'].includes(o.status)).length > 0 && (
                <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                  {storeOrders.filter((o) => ['PLACED', 'CONFIRMED', 'PACKING', 'PROCESSING'].includes(o.status)).length} TO PACK
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActivePortalTab('inventory')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
                activePortalTab === 'inventory'
                  ? 'bg-[#064E3B] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Inventory & Bulk CSV Upload ({myProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePortalTab('finance')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
                activePortalTab === 'finance'
                  ? 'bg-[#064E3B] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Financial Cockpit & Khata (₹75,500)</span>
            </button>
          </div>

          {/* TAB 1: LIVE ORDERS & PACKING DESK */}
          {activePortalTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                      <PackageOpen className="w-4 h-4 text-emerald-600" />
                      <span>Store Fulfilment Center</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Live Orders & Packing Queue</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Orders routed to {partner?.shopName} ({partner?.pincode}). Pack items promptly for Customer Self-Pickup or Rider Delivery.
                    </p>
                  </div>

                  <button
                    onClick={refreshStoreOrders}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Queue</span>
                  </button>
                </div>

                {storeOrders.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-3">
                    <PackageOpen className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-600">No active orders right now.</p>
                    <p className="text-xs text-slate-400">
                      Keep your store status ONLINE. When a customer orders items in {partner?.pincode}, your screen will update automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {storeOrders.map((order: any) => {
                      const isPickup = order.fulfilmentType === 'SELF_PICKUP';
                      return (
                        <div
                          key={order.id}
                          className="border-2 border-slate-200 hover:border-emerald-400 rounded-3xl p-5 sm:p-6 bg-white transition space-y-4 shadow-sm"
                        >
                          {/* Header: Order Number, Fulfilment Type Badge, Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-base font-black text-slate-900">
                                #{order.orderNumber || order.id}
                              </span>
                              {isPickup ? (
                                <span className="inline-flex items-center space-x-1 text-[11px] font-black uppercase text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                  <Store className="w-3 h-3 text-blue-600" />
                                  <span>🛍️ Customer Self-Pickup</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[11px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                  <Bike className="w-3 h-3 text-emerald-600" />
                                  <span>🛵 Delivery Rider Dispatch</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-400 font-mono">
                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                                order.status === 'PLACED' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                ['CONFIRMED', 'PROCESSING', 'PACKING'].includes(order.status) ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                                ['READY_FOR_PICKUP', 'READY_FOR_DISPATCH'].includes(order.status) ? 'bg-teal-100 text-teal-900 border border-teal-300' :
                                order.status === 'OUT_FOR_DELIVERY' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
                                'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}>
                                {order.status === 'PLACED' ? 'NEW ORDER (ACTION NEEDED)' :
                                 order.status === 'CONFIRMED' ? 'ORDER ACCEPTED' :
                                 ['PROCESSING', 'PACKING'].includes(order.status) ? 'PACKING IN PROGRESS' :
                                 order.status === 'READY_FOR_PICKUP' ? 'READY AT COUNTER' :
                                 order.status === 'READY_FOR_DISPATCH' ? 'READY FOR RIDER' :
                                 order.status}
                              </span>
                            </div>
                          </div>

                          {/* Customer Details & Handover Instructions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>{order.userName || order.customerName || 'Registered Customer'}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-slate-500 font-mono">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{order.userPhone || 'Provided in app'}</span>
                              </div>
                              <div className="flex items-start space-x-1.5 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span>{order.deliveryAddress || 'Ranchi Central, Jharkhand'} (Pincode: {order.pincode || '834001'})</span>
                              </div>
                            </div>

                            <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 md:pl-4 pt-2 md:pt-0">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Status</span>
                                <span className="font-bold text-slate-800 text-xs">
                                  ₹{order.totalPayable} • {order.paymentMethod || 'Online'} ({order.paymentStatus || 'PAID'})
                                </span>
                              </div>
                              <div className="mt-2 text-[11px] text-slate-600 font-semibold">
                                {isPickup ? (
                                  <span className="text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded-md">
                                    Customer collects in-store with 4-Digit Pickup OTP
                                  </span>
                                ) : (
                                  <span className="text-emerald-900 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                                    Ranchi Central Rider Fleet will pick up from your counter
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Items to Pack Checklist */}
                          <div className="space-y-2">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                              Items to Pack ({order.items?.length || 1}):
                            </span>
                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                              {order.items && order.items.map((item: any, idx: number) => (
                                <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                  <div className="flex items-center space-x-3">
                                    {item.image && (
                                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0" />
                                    )}
                                    <div>
                                      <p className="font-extrabold text-slate-900">{item.name}</p>
                                      <p className="text-[11px] text-slate-500 font-mono">Unit Price: ₹{item.unitPrice || item.price}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="bg-emerald-100 text-[#064E3B] font-black px-2.5 py-1 rounded-xl text-xs">
                                      QTY: {item.quantity || 1}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Workflow Action Buttons */}
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            {order.status === 'PLACED' && (
                              <button
                                type="button"
                                onClick={() => handleOrderStatusUpdate(order.id, 'CONFIRM')}
                                className="bg-[#16A34A] hover:bg-[#15803D] text-white px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                <span>Accept Order & Lock Inventory</span>
                              </button>
                            )}

                            {order.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                onClick={() => handleOrderStatusUpdate(order.id, 'PROCESS')}
                                className="bg-[#0284C7] hover:bg-sky-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                              >
                                <PackageCheck className="w-4 h-4" />
                                <span>Start Packing Items</span>
                              </button>
                            )}

                            {['PROCESSING', 'PACKING'].includes(order.status) && (
                              isPickup ? (
                                <button
                                  type="button"
                                  onClick={() => handleOrderStatusUpdate(order.id, 'READY_FOR_PICKUP')}
                                  className="bg-[#064E3B] hover:bg-emerald-950 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Bag Packed & Ready for Customer Pickup</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOrderStatusUpdate(order.id, 'PACK')}
                                  className="bg-[#064E3B] hover:bg-emerald-950 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Bag Packed & Ready for Delivery Rider</span>
                                </button>
                              )
                            )}

                            {isPickup && ['READY_FOR_PICKUP', 'AWAITING_COLLECTION'].includes(order.status) && (
                              <button
                                type="button"
                                onClick={() => { setVerifyingOrder(order); setOtpInput(''); setOtpError(''); }}
                                className="bg-[#FF5722] hover:bg-orange-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-1.5 shadow-md shadow-orange-700/20 cursor-pointer"
                              >
                                <QrCode className="w-4 h-4" />
                                <span>Customer Arrived: Verify OTP & Handover</span>
                              </button>
                            )}

                            {!isPickup && order.status === 'READY_FOR_DISPATCH' && (
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3.5 py-2 rounded-xl flex items-center space-x-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Awaiting Ranchi Central Delivery Rider Fleet Pickup</span>
                              </span>
                            )}

                            {['DELIVERED', 'COLLECTED'].includes(order.status) && (
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3.5 py-2 rounded-xl flex items-center space-x-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Handover Complete & Fulfilled</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & BULK CSV UPLOAD */}
          {activePortalTab === 'inventory' && (
            <div className="space-y-6">
              {/* Educational Banner: Smart Auto-Image Bank */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 border border-emerald-200/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-emerald-950 flex items-center space-x-2">
                      <span>Smart Product Image Bank & Persistent Photos Active</span>
                      <span className="bg-emerald-200/60 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                        Zero Hassle
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-800/90 leading-relaxed max-w-3xl">
                      <strong>You never have to copy-paste image URLs!</strong> Our system automatically links verified high-resolution photos for standard items (Fortune Oil, Tata Tea, Aashirvaad Atta, Dettol, Biscuits, Dal, SHG items). When you upload custom photos for any product below, they are <strong>permanently remembered</strong> so you won&apos;t have to re-upload photos every time you restock.
                    </p>
                  </div>
                </div>
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

          {/* TAB 3: FINANCIAL COCKPIT: SALES, REFUND, AND WORKING CAPITAL CREDIT LINE */}
          {activePortalTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Today's Sales & GMV */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Today&apos;s Store Sales</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">₹4,890.00</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                    12 Orders Delivered
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Monthly Gross GMV</span>
                  <span className="font-bold text-slate-900">₹34,500.00</span>
                </div>
                <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-semibold flex items-center justify-between">
                  <span>0% Commission Kept:</span>
                  <span className="font-bold">₹1,220 saved today</span>
                </div>
              </div>

              {/* Card 2: B2B Working Capital Credit Line */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Working Capital Credit Line</span>
                    <span className="text-2xl font-black text-teal-800 mt-1 block">₹75,500 Avail.</span>
                  </div>
                  <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-teal-200">
                    0% Interest (14 Days)
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Approved Khata Limit</span>
                  <span className="font-bold text-slate-900">₹1,00,000.00</span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>In-Use for Wholesale Restock:</span>
                  <span className="font-bold text-amber-700">₹24,500.00</span>
                </div>
              </div>

              {/* Card 3: Refunds & Net Payout */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Customer Refunds</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">₹140.00</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                    0.28% Return Rate
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Next Bank Payout (T+1)</span>
                  <span className="font-black text-emerald-700">₹4,750.00 Tomorrow</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadShopReport}
                  className="w-full text-center py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download Itemized Tax & Audit CSV ↓</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY & BULK CSV UPLOAD */}
          {activePortalTab === 'inventory' && (
            <div className="space-y-6">
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
                  <div key={p.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white hover:border-emerald-300 transition shadow-2xs">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 group">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        <label 
                          className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Click to change photo"
                        >
                          <Camera className="w-4 h-4" />
                          <span className="text-[8px] font-bold mt-0.5">Edit</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingPhotoFor === p.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadProductPhoto(p.id, p.name, file);
                            }}
                          />
                        </label>
                      </div>
                      <div className="truncate flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                        <span className="text-[10px] text-slate-500">{p.unit} • {p.category}</span>
                        <div className="mt-1 flex items-center space-x-1.5">
                          <span className="text-slate-400 line-through text-[10px]">₹{p.mrp}</span>
                          <span className="font-black text-slate-900 text-xs">₹{p.bachatPrice}</span>
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {p.discountPercent}% OFF
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <label className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-200 transition cursor-pointer">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{uploadingPhotoFor === p.id ? 'Saving Photo...' : 'Upload / Change Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPhotoFor === p.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadProductPhoto(p.id, p.name, file);
                          }}
                        />
                      </label>
                      <span className="font-mono text-[10px] text-slate-400">{p.sku || p.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
            </div>
          )}

          {/* CUSTOMER PICKUP OTP HANDOVER VERIFICATION MODAL */}
          {verifyingOrder && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-5 h-5 text-[#064E3B]" />
                    <h3 className="text-base font-black text-slate-900">Verify Customer Pickup OTP</h3>
                  </div>
                  <button onClick={() => setVerifyingOrder(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <p className="text-xs text-slate-600">
                  Ask customer <strong>{verifyingOrder.userName || 'Customer'}</strong> for the 4-digit Secret Code displayed on their phone screen.
                </p>

                <form onSubmit={handleVerifyPickupHandover} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Enter 4-Digit Customer OTP:</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="e.g. 7445"
                      className="w-full text-center tracking-widest text-2xl font-mono font-black py-3 border-2 border-slate-200 rounded-2xl focus:border-emerald-600 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {otpError && (
                    <p className="text-xs font-bold text-rose-600">{otpError}</p>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setVerifyingOrder(null)}
                      className="flex-1 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white text-xs font-black shadow-lg shadow-emerald-700/20 cursor-pointer"
                    >
                      Verify & Handover Bag
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
