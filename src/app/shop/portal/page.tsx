'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Plus, 
  Trash2, 
  ExternalLink,
  LogOut,
  RefreshCw,
  Clock,
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
  Printer,
  Volume2,
  VolumeX
} from 'lucide-react';
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

  // Live Store Order Management State
  const [storeOrders, setStoreOrders] = useState<any[]>([]);
  const [activePortalTab, setActivePortalTab] = useState<'orders' | 'inventory' | 'finance'>('orders');
  const [orderActionMsg, setOrderActionMsg] = useState<string | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<any | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);

  // Real Computed Financial Stats (Zero Fake Data)
  const deliveredOrders = storeOrders.filter((o) => o.status === 'DELIVERED');
  const realTodaySales = deliveredOrders.reduce((sum, o) => sum + (o.totalPayable || o.total || 0), 0);
  const realDeliveredCount = deliveredOrders.length;

  // Generate and Download Shop Report (Sales, Refunds, Credit Line)
  const handleDownloadShopReport = () => {
    if (!partner) return;
    const csv = generateShopReportCsv({
      shopId: partner.shopId,
      shopName: partner.shopName,
      ownerName: partner.ownerName,
      pincode: partner.pincode,
      dateRange: 'Live Operational Shift',
      grossSales: realTodaySales,
      totalOrders: realDeliveredCount > 0 ? realDeliveredCount : (partner.totalOrdersFulfilled && partner.totalOrdersFulfilled !== 14 ? partner.totalOrdersFulfilled : 0),
      refundsDeducted: partner.refundsDeducted || 0,
      creditLineLimit: partner.creditLineLimit || 0,
      creditLineUtilized: partner.creditLineUtilized || 0,
      creditLineAvailable: partner.creditLineAvailable || 0,
      commissionSaved: 0,
      netPayoutTransferred: realTodaySales,
    });
    triggerCsvDownload(`MBM_Shop_Financial_Report_${partner.shopId}_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  // Inventory Ingestion Mode: 'bulk' CSV or 'single' 1-product at a time
  const [uploadMethod, setUploadMethod] = useState<'bulk' | 'single'>('bulk');

  // Single Product Upload State
  const [singleProduct, setSingleProduct] = useState({
    name: '',
    category: 'Groceries',
    unit: '1 kg',
    mrp: '',
    bachatPrice: '',
    stockQuantity: '10',
    sku: '',
    expiryDate: '',
    batchNumber: '',
    isReturnable: true,
  });
  const [singleImageFile, setSingleImageFile] = useState<File | null>(null);
  const [singleImagePreview, setSingleImagePreview] = useState<string>('');
  const [isPublishingSingle, setIsPublishingSingle] = useState(false);
  const [singleProductError, setSingleProductError] = useState<string | null>(null);

  // CSV States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CsvProductRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Storefront products uploaded by this partner
  const [myProducts, setMyProducts] = useState<any[]>([]);

  // Real Computed Store Metrics (Zero Fake Data - Defaults to 0 until updated)
  const liveStockUnits = myProducts.reduce((sum, p) => sum + (Number(p.stockQuantity) || 0), 0);
  const displayStockUnits = liveStockUnits > 0 ? liveStockUnits : (Number(partner?.totalStockUnits) || 0);
  const displayOrdersFulfilled = realDeliveredCount > 0 ? realDeliveredCount : (Number(partner?.totalOrdersFulfilled) || 0);
  const displayRating = partner?.rating && Number(partner.rating) > 0 ? `★ ${Number(partner.rating).toFixed(1)}` : '0';

  const knownOrderIdsRef = React.useRef<Set<string>>(new Set());
  const initialOrdersLoadedRef = React.useRef(false);

  const playOrderChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // First beep: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // Second beep: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } catch (err) {
      console.warn('AudioContext chime error:', err);
    }
  };

  const handlePrintPackingSlip = (order: any) => {
    const isPickup = order.fulfilmentType === 'SELF_PICKUP';
    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (!printWindow) {
      alert('Please allow popups to print packing slips.');
      return;
    }
    const itemsHtml = (order.items || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 4px 0; border-bottom: 1px dashed #ccc;">${item.name}</td>
          <td style="padding: 4px 0; text-align: center; border-bottom: 1px dashed #ccc; font-weight: bold;">x${item.quantity || 1}</td>
          <td style="padding: 4px 0; text-align: right; border-bottom: 1px dashed #ccc;">₹${(item.unitPrice || item.price || 0) * (item.quantity || 1)}</td>
        </tr>`
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Packing Slip - #${order.orderNumber || order.id}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 4px;
            color: #000;
            font-size: 12px;
            line-height: 1.3;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 15px; font-weight: 900; letter-spacing: 1px; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .divider-double { border-top: 2px solid #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .badge { display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; border: 1px solid #000; margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">MEGABACHATMART</div>
          <div style="font-size: 10px;">Hyperlocal Quick Commerce</div>
          <div class="divider"></div>
          <div class="badge">${isPickup ? 'STORE SELF-PICKUP' : 'DOORSTEP DELIVERY'}</div>
          <div class="bold" style="font-size: 14px;">ORDER #${order.orderNumber || order.id}</div>
          <div style="font-size: 10px;">${new Date(order.createdAt || Date.now()).toLocaleString()}</div>
        </div>
        <div class="divider"></div>
        <div>
          <div><span class="bold">Customer:</span> ${order.userName || order.customerName || 'Customer'}</div>
          <div><span class="bold">Phone:</span> ${order.userPhone || order.customerPhone || 'N/A'}</div>
          ${order.deliveryAddress ? `<div><span class="bold">Address:</span> ${order.deliveryAddress}</div>` : ''}
          ${isPickup ? `<div class="bold" style="font-size: 11px; margin-top: 3px; border: 1px dashed #000; padding: 2px; text-align: center;">HANDOVER SECURITY: VERIFY 4-DIGIT PIN ON CUSTOMER PHONE</div>` : ''}
        </div>
        <div class="divider-double"></div>
        <div class="bold center">PACKING LIST</div>
        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; padding-bottom: 2px;">Item</th>
              <th style="text-align: center; padding-bottom: 2px;">Qty</th>
              <th style="text-align: right; padding-bottom: 2px;">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="divider"></div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;" class="bold">
          <span>TOTAL PAYABLE:</span>
          <span>₹${order.totalPayable || order.total || 0}</span>
        </div>
        <div style="font-size: 10px; margin-top: 4px;">Payment: ${(order.paymentStatus || 'PREPAID').toUpperCase()} (${order.paymentMethod || 'ONLINE'})</div>
        <div class="divider"></div>
        <div class="center" style="font-size: 10px; margin-top: 8px;">
          Packed with care at Ranchi Central Store<br/>
          Thank you for shopping on MegaBachatMart!
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const refreshStoreOrders = async () => {
    try {
      const res = await fetch('/api/store/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        if (initialOrdersLoadedRef.current) {
          const hasNewOrder = data.orders.some(
            (o: any) => !knownOrderIdsRef.current.has(o.id) && ['PLACED', 'CONFIRMED'].includes(o.status)
          );
          if (hasNewOrder && soundAlertsEnabled) {
            playOrderChime();
          }
        } else {
          initialOrdersLoadedRef.current = true;
        }

        const newSet = new Set<string>();
        data.orders.forEach((o: any) => newSet.add(o.id));
        knownOrderIdsRef.current = newSet;

        setStoreOrders(data.orders);
      }
    } catch (e) {
      console.error('Failed to fetch store orders:', e);
    }
  };

  useEffect(() => {
    refreshStoreOrders();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshStoreOrders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      // Pause background requests when tab is hidden to save battery & bandwidth
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      refreshStoreOrders();
    }, 10000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [soundAlertsEnabled]);

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
        const parsed = JSON.parse(saved);
        let changed = false;
        if (parsed.totalStockUnits === 150 || parsed.totalStockUnits === 160) {
          parsed.totalStockUnits = 0;
          changed = true;
        }
        if (parsed.totalOrdersFulfilled === 14) {
          parsed.totalOrdersFulfilled = 0;
          changed = true;
        }
        if (parsed.rating === 4.9 || parsed.rating === 5) {
          parsed.rating = 0;
          changed = true;
        }
        if (parsed.totalProductsListed === 3 || parsed.totalProductsListed === 4) {
          parsed.totalProductsListed = 0;
          changed = true;
        }
        if (parsed.creditLineAvailable === 75500) {
          delete parsed.creditLineAvailable;
          changed = true;
        }
        if (parsed.creditLineLimit === 100000) {
          delete parsed.creditLineLimit;
          changed = true;
        }
        if (parsed.creditLineUtilized === 24500) {
          delete parsed.creditLineUtilized;
          changed = true;
        }
        if (changed) {
          localStorage.setItem('mbm_shop_partner', JSON.stringify(parsed));
        }
        setPartner(parsed);
      } else {
        router.push('/shop/login');
      }
    } catch (e) {
      console.error(e);
      router.push('/shop/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

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
      document.cookie = 'mbm_partner_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {}
    router.push('/partners');
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
      const stock = parseInt(getColVal('stockQuantity'), 10) || 0;
      const expiry = getColVal('expiryDate') || 'Not Available';
      const batch = getColVal('batchNumber') || `BATCH-${Date.now()}`;
      const explicitImg = getColVal('imagefile') || getColVal('image') || getColVal('imageurl') || getColVal('photo');
      const isWebUrl = explicitImg.startsWith('http://') || explicitImg.startsWith('https://') || explicitImg.startsWith('/uploads/') || explicitImg.startsWith('data:image/');
      const img = isWebUrl
        ? explicitImg
        : productImageLibrary.resolveImage({
            productId: pid,
            productName: name,
            category: cat,
            explicitUrl: explicitImg || undefined,
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
        imageFile: explicitImg,
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

  const [uploadingPreviewRowIdx, setUploadingPreviewRowIdx] = useState<number | null>(null);
  const [isBatchUploadingImages, setIsBatchUploadingImages] = useState(false);

  // Upload or Change Real Photo for a Product in CSV Preview before publishing
  const handleUploadPreviewRowPhoto = async (rowIdx: number, file: File) => {
    const row = parsedRows[rowIdx];
    if (!row) return;
    setUploadingPreviewRowIdx(rowIdx);
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
        setUploadingPreviewRowIdx(null);
        if (data.success && data.imageUrl) {
          // Update the preview row immediately with the uploaded photo
          setParsedRows((prev) =>
            prev.map((r, idx) => (idx === rowIdx ? { ...r, imageUrl: data.imageUrl } : r))
          );
          productImageLibrary.saveProductImage(row.productId, data.imageUrl);
          productImageLibrary.saveProductImage(row.productName, data.imageUrl);
          setPhotoToast(`📸 Real photo attached for "${row.productName}"! It will be shown on the live store when published.`);
          setTimeout(() => setPhotoToast(null), 6000);
        } else {
          alert(data.message || 'Failed to upload photo.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadingPreviewRowIdx(null);
      alert('Photo upload failed: ' + err.message);
    }
  };

  // Batch upload multiple image files directly from device and map them to CSV rows
  const handleBatchImageUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0 || parsedRows.length === 0) return;
    setIsBatchUploadingImages(true);
    let matchedCount = 0;
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const cleanFileName = file.name.toLowerCase().replace(/\.[^/.]+$/, '').trim();
      
      const targetIdx = parsedRows.findIndex((row) => {
        const pid = row.productId.toLowerCase().trim();
        const pname = row.productName.toLowerCase().trim();
        const pfile = (row as any).imageFile ? (row as any).imageFile.toLowerCase().replace(/\.[^/.]+$/, '').trim() : '';

        if (cleanFileName === pid || cleanFileName.includes(pid) || pid.includes(cleanFileName)) return true;
        if (pfile && (cleanFileName === pfile || pfile.includes(cleanFileName))) return true;
        if (cleanFileName.length > 3 && pname.includes(cleanFileName)) return true;
        return false;
      });

      const matchedIndex = targetIdx >= 0 ? targetIdx : (fileArray.length === 1 && parsedRows.length === 1 ? 0 : -1);

      if (matchedIndex >= 0) {
        const row = parsedRows[matchedIndex];
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

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
          if (data.success && data.imageUrl) {
            setParsedRows((prev) =>
              prev.map((r, i) => (i === matchedIndex ? { ...r, imageUrl: data.imageUrl } : r))
            );
            productImageLibrary.saveProductImage(row.productId, data.imageUrl);
            productImageLibrary.saveProductImage(row.productName, data.imageUrl);
            matchedCount++;
          }
        } catch (err) {
          console.warn('Failed to upload image file:', file.name, err);
        }
      }
    }

    setIsBatchUploadingImages(false);
    if (matchedCount > 0) {
      setPhotoToast(`📸 Successfully matched & attached ${matchedCount} product photos! Ready to publish to live store.`);
      setTimeout(() => setPhotoToast(null), 6000);
    } else {
      alert(`Uploaded ${fileArray.length} photos, but could not auto-match by SKU code or product name. You can use the "Upload Real Photo" button on each row below!`);
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

  // Single Product Image Selection with instant preview
  const handleSingleImageSelect = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }
    setSingleImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSingleImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Publish 1 Single Product directly to storefront catalog
  const handlePublishSingleProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    setSingleProductError(null);

    const name = singleProduct.name.trim();
    if (!name) {
      setSingleProductError('Product name is required.');
      return;
    }

    const mrp = parseFloat(singleProduct.mrp);
    const bachatPrice = parseFloat(singleProduct.bachatPrice);
    const stock = parseInt(singleProduct.stockQuantity, 10);

    if (isNaN(mrp) || mrp <= 0) {
      setSingleProductError('Please enter a valid MRP greater than 0.');
      return;
    }
    if (isNaN(bachatPrice) || bachatPrice <= 0) {
      setSingleProductError('Please enter a valid Bachat Price greater than 0.');
      return;
    }
    if (bachatPrice > mrp) {
      setSingleProductError('Bachat Price cannot be higher than MRP.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setSingleProductError('Please enter a valid stock quantity (0 or more).');
      return;
    }

    setIsPublishingSingle(true);

    try {
      const generatedId = (singleProduct.sku.trim() || `PRD-${Date.now().toString(36).toUpperCase()}`)
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '-');

      let finalImageUrl = singleImagePreview;

      // If user uploaded a custom image file, upload to server storage
      if (singleImageFile && singleImagePreview && singleImagePreview.startsWith('data:image/')) {
        try {
          const imgRes = await fetch('/api/products/image-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: generatedId,
              productName: name,
              category: singleProduct.category,
              imageData: singleImagePreview,
            }),
          });
          const imgData = await imgRes.json();
          if (imgData.success && imgData.imageUrl) {
            finalImageUrl = imgData.imageUrl;
          }
        } catch (imgErr) {
          console.warn('Image upload fallback notice:', imgErr);
        }
      }

      const row: CsvProductRow = {
        productId: generatedId,
        productName: name,
        category: singleProduct.category,
        unit: singleProduct.unit.trim() || '1 Unit',
        mrp,
        bachatPrice,
        stockQuantity: stock,
        expiryDate: singleProduct.expiryDate.trim() || 'Not Available',
        batchNumber: singleProduct.batchNumber.trim() || 'BATCH-01',
        imageUrl: finalImageUrl || undefined,
        isReturnable: singleProduct.isReturnable,
      };

      const res = await fetch('/api/v1/shop/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: partner.shopId,
          rows: [row],
        }),
      });

      const data = await res.json();
      setIsPublishingSingle(false);

      if (data.success) {
        setUploadSuccess({
          message: `🎉 Successfully published "${name}" to your live storefront!`,
          importedCount: 1,
        });
        setSingleProduct({
          name: '',
          category: 'Groceries',
          unit: '1 kg',
          mrp: '',
          bachatPrice: '',
          stockQuantity: '10',
          sku: '',
          expiryDate: '',
          batchNumber: '',
          isReturnable: true,
        });
        setSingleImageFile(null);
        setSingleImagePreview('');
        refreshStoreProducts();
      } else {
        setSingleProductError(data.message || 'Failed to publish product.');
      }
    } catch (err: any) {
      setIsPublishingSingle(false);
      setSingleProductError(err.message || 'Network error while publishing product.');
    }
  };

  if (loading || !partner) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-600">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-600 mr-3"></div>
        <span className="font-bold text-sm">Authenticating Merchant Partner...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between relative overflow-x-hidden w-[100vw] max-w-[100vw]">
      
      {/* ============================================================== */}
      {/* DEDICATED B2B PARTNER PORTAL HEADER (REPLACES CONSUMER NAVBAR) */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-[1px] border-slate-200/90 shadow-xs w-[100vw] max-w-[100vw]">
        <div className="w-[100%] max-w-[80rem] mx-auto px-[4%] sm:px-[5%]">
          <div className="flex items-center justify-between h-[4rem] sm:h-[5rem] gap-[1rem]">
            
            {/* Logo & Hub Badge */}
            <div className="flex items-center space-x-[0.75rem]">
              <Link href="/" className="relative w-[8.5rem] sm:w-[12rem] h-[2.25rem] sm:h-[3rem] block group shrink-0" aria-label="MegaBachatMart Home">
                <Image
                  src="/images/LOgo.jpeg"
                  alt="MegaBachatMart"
                  fill
                  priority
                  className="object-contain object-left group-hover:scale-102 transition-transform"
                />
              </Link>
              <span className="inline-flex items-center space-x-[0.375rem] px-[0.625rem] py-[0.25rem] rounded-full text-[0.6875rem] font-extrabold bg-emerald-50 text-emerald-800 border-[1px] border-emerald-200">
                <span className="w-[0.5rem] h-[0.5rem] rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden sm:inline">Partner Portal</span>
                <span className="sm:hidden">Partner</span>
              </span>
            </div>

            {/* Quick Portal Controls */}
            <div className="flex items-center space-x-[0.5rem] sm:space-x-[0.75rem]">
              <Link
                href="/shop"
                target="_blank"
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-[1px] border-emerald-200 font-bold px-[0.75rem] sm:px-[1rem] py-[0.5rem] rounded-[0.75rem] text-[0.75rem] transition flex items-center space-x-[0.375rem]"
              >
                <ExternalLink className="w-[0.875rem] h-[0.875rem] text-emerald-700" />
                <span className="hidden sm:inline">View Live Storefront</span>
                <span className="sm:hidden">Storefront</span>
              </Link>

              <button
                onClick={handleLogout}
                className="bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-[1px] border-slate-200 hover:border-rose-200 font-bold px-[0.75rem] sm:px-[0.875rem] py-[0.5rem] rounded-[0.75rem] text-[0.75rem] transition flex items-center space-x-[0.375rem] cursor-pointer"
              >
                <LogOut className="w-[0.875rem] h-[0.875rem] text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className="w-[100vw] max-w-[100vw] flex-1 py-[1.5rem] sm:py-[2.5rem] px-[4%] sm:px-[5%] relative z-10">
        <div className="w-[100%] max-w-[72rem] mx-auto space-y-[1.5rem]">
          
          {/* Store Partner Top Banner (Clean White Card with High-Contrast Typography) */}
          {partner && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#064E3B] via-emerald-600 to-[#16A34A]" />

              <div className="space-y-2 relative z-10">
                <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Store Status: ONLINE (Receiving 20-min Quick Orders)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{partner.shopName}</h1>
                <p className="text-xs text-slate-600">
                  Merchant ID: <code className="bg-slate-100 border border-slate-200 font-mono px-2 py-0.5 rounded font-bold text-slate-800">{partner.shopId}</code> • Pincode: <strong className="text-slate-800">{partner.pincode}</strong> • Prop: <span className="font-medium text-slate-800">{partner.ownerName}</span>
                </p>
                <p className="text-xs text-slate-500 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{partner.address}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 relative z-10">
                <button
                  onClick={handleDownloadShopReport}
                  className="bg-[#064E3B] hover:bg-emerald-950 text-white font-black px-4 py-2.5 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  title="Download Sales, Refunds, and Credit Line Audit CSV"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Generate Shop Report</span>
                </button>

                <Link
                  href="/shop"
                  target="_blank"
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-700" />
                  <span>View Live Consumer Store</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-slate-200 hover:border-rose-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Order Action Feedback Notification */}
          {orderActionMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3.5 rounded-2xl shadow-sm flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{orderActionMsg}</span>
              </div>
              <button onClick={() => setOrderActionMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-black cursor-pointer">✕</button>
            </div>
          )}

          {/* Photo Upload Toast Notification */}
          {photoToast && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3.5 rounded-2xl shadow-sm flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{photoToast}</span>
              </div>
              <button onClick={() => setPhotoToast(null)} className="text-emerald-700 hover:text-emerald-950 ml-3 font-black cursor-pointer">
                ✕
              </button>
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
              <div className="text-2xl font-black text-[#16A34A] mt-1">{displayStockUnits}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Ready for 20-min dispatch</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Orders Fulfilled</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{displayOrdersFulfilled}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Zero cancellation record</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Store Rating</span>
              <div className="text-2xl font-black text-amber-500 mt-1">{displayRating}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified Ranchi customers</p>
            </div>
          </div>

          {/* Navigation Tabs for Partner Operations */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActivePortalTab('orders')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                activePortalTab === 'orders'
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PackageOpen className="w-4 h-4" />
              <span>Live Orders & Packing Desk</span>
              {storeOrders.filter((o) => ['PLACED', 'CONFIRMED', 'PACKING', 'PROCESSING'].includes(o.status)).length > 0 && (
                <span className="bg-[#FF5722] text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse shadow-xs">
                  {storeOrders.filter((o) => ['PLACED', 'CONFIRMED', 'PACKING', 'PROCESSING'].includes(o.status)).length} TO PACK
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActivePortalTab('inventory')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                activePortalTab === 'inventory'
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Inventory & Bulk CSV Upload ({myProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePortalTab('finance')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                activePortalTab === 'finance'
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Financial Cockpit & Khata{partner?.creditLineAvailable ? ` (₹${partner.creditLineAvailable.toLocaleString('en-IN')})` : ''}</span>
            </button>
          </div>

          {/* TAB 1: LIVE ORDERS & PACKING DESK */}
          {activePortalTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                      <PackageOpen className="w-4 h-4 text-emerald-600" />
                      <span>Store Fulfilment Center</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">Live Orders & Packing Queue</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Orders routed to {partner?.shopName} ({partner?.pincode}). Pack items promptly for Customer Self-Pickup or Rider Delivery.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        playOrderChime();
                        setSoundAlertsEnabled(!soundAlertsEnabled);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        soundAlertsEnabled
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title="Toggle sound chime on new orders arrival"
                    >
                      {soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>{soundAlertsEnabled ? 'Audio Chime ON' : 'Audio OFF'}</span>
                    </button>

                    <button
                      onClick={refreshStoreOrders}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Queue</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Audio Permission Unlocking Banner */}
                {soundAlertsEnabled && (
                  <div
                    onClick={() => playOrderChime()}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-900 cursor-pointer hover:bg-amber-100 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Audio Alert Active:</strong> Tap here once to ensure order chimes play when your phone is in the background.
                      </span>
                    </div>
                    <span className="text-[11px] font-black uppercase text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-xl shrink-0 ml-2">
                      Tap to Test Chime
                    </span>
                  </div>
                )}

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
                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Available'}
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
                              Items to Pack ({order.items?.length ?? 0}):
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
                                      QTY: {item.quantity ?? 0}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Workflow Action Buttons & Packing Slip */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handlePrintPackingSlip(order)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200"
                              title="Print 80mm thermal receipt / packing slip"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-600" />
                              <span>Print Packing Slip</span>
                            </button>

                            <div className="flex flex-wrap items-center gap-2">
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* TAB 3: FINANCIAL COCKPIT: SALES, REFUND, AND WORKING CAPITAL CREDIT LINE */}
          {activePortalTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Today's Sales & GMV */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Today&apos;s Store Sales</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">₹{realTodaySales.toFixed(2)}</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                    {realDeliveredCount} Orders Delivered
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Monthly Gross GMV</span>
                  <span className="font-bold text-slate-900">{partner?.monthlyGmv ? `₹${partner.monthlyGmv.toFixed(2)}` : '₹0.00'}</span>
                </div>
                <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-semibold flex items-center justify-between">
                  <span>0% Commission Kept:</span>
                  <span className="font-bold">₹0 saved today</span>
                </div>
              </div>

              {/* Card 2: B2B Working Capital Credit Line */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Working Capital Credit Line</span>
                    <span className="text-2xl font-black text-teal-800 mt-1 block">
                      {partner?.creditLineAvailable ? `₹${partner.creditLineAvailable.toLocaleString('en-IN')}` : 'Not Available'}
                    </span>
                  </div>
                  <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-teal-200">
                    0% Interest (14 Days)
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Approved Khata Limit</span>
                  <span className="font-bold text-slate-900">
                    {partner?.creditLineLimit ? `₹${partner.creditLineLimit.toLocaleString('en-IN')}` : 'Not Available'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>In-Use for Wholesale Restock:</span>
                  <span className="font-bold text-amber-700">
                    {partner?.creditLineUtilized ? `₹${partner.creditLineUtilized.toLocaleString('en-IN')}` : '₹0.00'}
                  </span>
                </div>
              </div>

              {/* Card 3: Refunds & Net Payout */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Customer Refunds</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">
                      {partner?.refundsDeducted ? `₹${partner.refundsDeducted.toFixed(2)}` : '₹0.00'}
                    </span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                    0% Return Rate
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Next Bank Payout (T+1)</span>
                  <span className="font-black text-emerald-700">₹{realTodaySales.toFixed(2)}</span>
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

              {/* SECTION: INVENTORY INGESTION (BULK CSV OR 1 PRODUCT AT A TIME) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            {/* INVENTORY UPLOAD METHOD SWITCHER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setUploadMethod('bulk'); setSingleProductError(null); }}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                    uploadMethod === 'bulk'
                      ? 'bg-[#064E3B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Bulk Product Upload via CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setUploadMethod('single'); setSingleProductError(null); }}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                    uploadMethod === 'single'
                      ? 'bg-[#064E3B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload 1 Product at a Time (with Photo)</span>
                </button>
              </div>

              {uploadMethod === 'single' && (
                <button
                  type="button"
                  onClick={() => setUploadMethod('bulk')}
                  className="text-xs font-bold text-slate-500 hover:text-emerald-800 transition flex items-center space-x-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Switch to Bulk CSV Upload instead</span>
                </button>
              )}
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

            {/* OPTION 2: SINGLE PRODUCT UPLOAD FORM (WITH PHOTO) */}
            {uploadMethod === 'single' && (
              <form onSubmit={handlePublishSingleProduct} className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center space-x-1.5 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Instant Single Product Ingestion</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Add 1 Product at a Time with Image</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload a product photo and enter price details. Your product will go live immediately on the customer storefront.
                  </p>
                </div>

                {singleProductError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{singleProductError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Image Upload Box */}
                  <div className="lg:col-span-4 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Product Photo <span className="text-rose-500">*</span>
                    </label>

                    <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-4 bg-slate-50/60 transition flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[220px]">
                      {singleImagePreview ? (
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                          <img
                            src={singleImagePreview}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2">
                            <label className="bg-white/90 hover:bg-white text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-sm flex items-center space-x-1">
                              <Camera className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Change Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleSingleImageSelect(file);
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setSingleImageFile(null);
                                setSingleImagePreview('');
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full py-6">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition">
                            <Camera className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-extrabold text-slate-800">
                            Click or Drag to Upload Product Image
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1">
                            JPG, PNG, WebP up to 5MB
                          </span>
                          <span className="mt-3 inline-flex items-center space-x-1 bg-[#064E3B] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs">
                            <ImageIcon className="w-3 h-3" />
                            <span>Select Photo from Device</span>
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleSingleImageSelect(file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Tip: If left empty, our Smart Auto-Image Bank will automatically match an official verified photo for known FMCG brands.
                    </p>
                  </div>

                  {/* Product Details Form */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Product Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Product Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={singleProduct.name}
                          onChange={(e) => setSingleProduct({ ...singleProduct, name: e.target.value })}
                          placeholder="e.g. Aashirvaad Shudh Chakki Atta, Fortune Mustard Oil, Amul Butter"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={singleProduct.category}
                          onChange={(e) => setSingleProduct({ ...singleProduct, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                        >
                          <option value="Groceries">Groceries & Staples (Atta, Rice, Dal, Oil)</option>
                          <option value="Dairy & Bakery">Dairy & Bakery (Milk, Paneer, Bread, Eggs)</option>
                          <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                          <option value="FMCG">FMCG & Packaged Snacks (Biscuits, Noodles, Tea)</option>
                          <option value="Spices">Spices & Seasonings</option>
                          <option value="SHG Specials">SHG Specials (Tribal Honey, Organic Goods)</option>
                          <option value="Consumables">Personal Care & Hygiene</option>
                          <option value="Stationery">Stationery & Office</option>
                          <option value="Home & Kitchen">Home & Kitchen</option>
                        </select>
                      </div>

                      {/* Unit / Packaging */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Packaging Unit / Weight <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={singleProduct.unit}
                          onChange={(e) => setSingleProduct({ ...singleProduct, unit: e.target.value })}
                          placeholder="e.g. 1 kg, 500 g, 1 L, 1 Pack, 6 pcs"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                        />
                      </div>

                      {/* Pricing Row: MRP & Bachat Price */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          MRP (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          required
                          value={singleProduct.mrp}
                          onChange={(e) => setSingleProduct({ ...singleProduct, mrp: e.target.value })}
                          placeholder="Original printed price"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Bachat Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          required
                          value={singleProduct.bachatPrice}
                          onChange={(e) => setSingleProduct({ ...singleProduct, bachatPrice: e.target.value })}
                          placeholder="Your customer discount price"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                        />
                      </div>

                      {/* Stock Quantity */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Stock Quantity (Units) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={singleProduct.stockQuantity}
                          onChange={(e) => setSingleProduct({ ...singleProduct, stockQuantity: e.target.value })}
                          placeholder="e.g. 50"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                        />
                      </div>

                      {/* Product SKU */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Product ID / SKU <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={singleProduct.sku}
                          onChange={(e) => setSingleProduct({ ...singleProduct, sku: e.target.value })}
                          placeholder="Auto-generated if blank"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                        />
                      </div>

                      {/* Expiry Date */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Expiry Date <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="date"
                          value={singleProduct.expiryDate}
                          onChange={(e) => setSingleProduct({ ...singleProduct, expiryDate: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                        />
                      </div>

                      {/* Batch Number */}
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1">
                          Batch Number <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={singleProduct.batchNumber}
                          onChange={(e) => setSingleProduct({ ...singleProduct, batchNumber: e.target.value })}
                          placeholder="e.g. BATCH-2026-A"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        {singleProduct.mrp && singleProduct.bachatPrice && Number(singleProduct.mrp) > Number(singleProduct.bachatPrice) && (
                          <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Save ₹{(Number(singleProduct.mrp) - Number(singleProduct.bachatPrice)).toFixed(2)} ({Math.round(((Number(singleProduct.mrp) - Number(singleProduct.bachatPrice)) / Number(singleProduct.mrp)) * 100)}% OFF)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSingleProduct({
                              name: '',
                              category: 'Groceries',
                              unit: '1 kg',
                              mrp: '',
                              bachatPrice: '',
                              stockQuantity: '10',
                              sku: '',
                              expiryDate: '',
                              batchNumber: '',
                              isReturnable: true,
                            });
                            setSingleImageFile(null);
                            setSingleImagePreview('');
                            setSingleProductError(null);
                          }}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Clear
                        </button>

                        <button
                          type="submit"
                          disabled={isPublishingSingle}
                          className="bg-[#16A34A] hover:bg-[#15803d] text-white font-black px-6 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-700/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          {isPublishingSingle ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Publishing Product...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Publish Product to Storefront</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* OPTION 1: BULK CSV INVENTORY UPLOAD */}
            {uploadMethod === 'bulk' && (
              <div className="space-y-6">
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
                  Supports .csv with productId, productName, category, unit, mrp, bachatPrice, stockQuantity, expiryDate, image
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Validated Products Preview ({parsedRows.length} items ready to import)
                    </h3>
                    <p className="text-xs text-slate-500">
                      No image URLs needed! Use the Image column below to add images directly to your products.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <label className="bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-300 font-bold px-4 py-2.5 rounded-2xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>{isBatchUploadingImages ? 'Uploading Photos...' : 'Batch Upload Images'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        disabled={isBatchUploadingImages}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleBatchImageUpload(e.target.files);
                          }
                        }}
                      />
                    </label>

                    <button
                      onClick={handlePublishProducts}
                      disabled={isUploading}
                      className="bg-[#16A34A] hover:bg-[#15803d] text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-lg shadow-emerald-700/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isUploading ? 'Publishing to Storefront...' : 'Publish & Add to Main Site'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Photo Instruction Callout */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center space-x-2.5">
                    <Camera className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      <strong>Direct Image Column:</strong> Click <strong>&quot;+ Add Image&quot;</strong> in the Image column below to attach a real photo from your camera or computer, or use <strong>&quot;Batch Upload Images&quot;</strong> for all files at once.
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3.5 px-4 text-center w-36 font-extrabold text-emerald-950 uppercase tracking-wider bg-emerald-50/70">Image (Add Photo)</th>
                          <th className="py-3.5 px-4 font-bold text-slate-900">Product Name & SKU</th>
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
                              {/* Dedicated Image Column */}
                              <td className="py-3 px-4 text-center bg-emerald-50/20">
                                <div className="flex flex-col items-center justify-center space-y-1.5">
                                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white shrink-0 border-2 border-emerald-200 group shadow-xs">
                                    <img 
                                      src={row.imageUrl} 
                                      alt={row.productName} 
                                      className="w-full h-full object-cover" 
                                    />
                                    <label 
                                      className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                      title="Click to change photo"
                                    >
                                      <Camera className="w-4 h-4 text-emerald-300" />
                                      <span className="text-[8px] font-bold mt-0.5">Change</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadingPreviewRowIdx === idx}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleUploadPreviewRowPhoto(idx, file);
                                        }}
                                      />
                                    </label>
                                  </div>

                                  <label 
                                    className={`inline-flex items-center space-x-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition cursor-pointer shadow-2xs ${
                                      row.imageUrl?.includes('/uploads/') || row.imageUrl?.startsWith('data:')
                                        ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                        : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                                    }`}
                                    title="Add or change image for this product"
                                  >
                                    <Camera className="w-3 h-3" />
                                    <span>
                                      {uploadingPreviewRowIdx === idx 
                                        ? 'Uploading...' 
                                        : row.imageUrl?.includes('/uploads/') || row.imageUrl?.startsWith('data:')
                                        ? '✓ Image Added' 
                                        : '+ Add Image'}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={uploadingPreviewRowIdx === idx}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadPreviewRowPhoto(idx, file);
                                      }}
                                    />
                                  </label>
                                </div>
                              </td>

                              {/* Product Name & SKU */}
                              <td className="py-3 px-4">
                                <div className="font-extrabold text-slate-900 text-sm">{row.productName}</div>
                                <div className="font-mono text-[11px] text-slate-400 mt-0.5">SKU: {row.productId}</div>
                                {(row as any).imageFile && (
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    File: {(row as any).imageFile}
                                  </div>
                                )}
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

                              <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{row.expiryDate || 'Not Available'}</td>

                              <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                                {row.batchNumber || 'Not Available'}
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
