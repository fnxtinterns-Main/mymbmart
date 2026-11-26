'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  FileText, 
  ShieldCheck, 
  Key, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Store, 
  AlertCircle, 
  RefreshCw,
  Phone,
  Mail,
  Eye,
  X,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import type { ShopApplication } from '@/lib/shopPartnerStore';

export const MerchantOnboardingTab: React.FC = () => {
  const [applications, setApplications] = useState<ShopApplication[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalApplications: 0,
    pendingReview: 0,
    approvedPartners: 0,
    rejectedApplications: 0,
    activeStores: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected application for review
  const [selectedApp, setSelectedApp] = useState<ShopApplication | null>(null);
  const [reviewTab, setReviewTab] = useState<'KYC' | 'DOCUMENTS' | 'CREDENTIALS'>('KYC');
  
  // Approval Form states
  const [customShopId, setCustomShopId] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [adminNotes, setAdminNotes] = useState('All FSSAI and Bank credentials verified. Premises within Ranchi serviceable hub.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let loadedApps: ShopApplication[] = [];
      let loadedMetrics: any = null;

      try {
        const res = await fetch('/api/v1/admin/merchants', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.applications) && data.applications.length > 0) {
          loadedApps = data.applications;
          loadedMetrics = data.metrics;
        }
      } catch (err) {
        console.warn('Direct admin merchants fetch notice:', err);
      }

      // Cross-subdomain fallback if running under admin. subdomain
      if (loadedApps.length === 0 && typeof window !== 'undefined' && window.location.hostname.includes('admin.')) {
        try {
          const crossRes = await fetch('https://mymbmart.com/api/v1/admin/merchants', {
            credentials: 'include',
            cache: 'no-store',
          });
          const crossData = await crossRes.json();
          if (crossData.success && Array.isArray(crossData.applications) && crossData.applications.length > 0) {
            loadedApps = crossData.applications;
            loadedMetrics = crossData.metrics;
          }
        } catch {}
      }

      // Client-side synchronization fallback
      if (loadedApps.length === 0 && typeof window !== 'undefined') {
        try {
          const clientStored = JSON.parse(localStorage.getItem('mymbmart_pending_merchant_apps') || '[]');
          if (Array.isArray(clientStored) && clientStored.length > 0) {
            loadedApps = clientStored;
          }
        } catch {}
      }

      setApplications(loadedApps);
      setMetrics(loadedMetrics || {
        totalApplications: loadedApps.length,
        pendingReview: loadedApps.filter((a) => a.status === 'PENDING_REVIEW').length,
        approvedPartners: loadedApps.filter((a) => a.status === 'APPROVED').length,
        rejectedApplications: loadedApps.filter((a) => a.status === 'REJECTED').length,
        activeStores: 0,
      });
    } catch (e) {
      console.error('Failed to load merchant applications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSelectApp = (app: ShopApplication) => {
    setSelectedApp(app);
    const pin = app.pincode || '834001';
    const randomSuffix = Math.floor(10 + Math.random() * 89);
    setCustomShopId(app.generatedShopId || `MBM-SHP-${pin}-${randomSuffix}`);
    const prefix = app.shopName.replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'Shop';
    setCustomPassword(app.generatedPassword || `MBM#${prefix}${pin.slice(-3)}@2026`);
    setReviewTab(app.status === 'APPROVED' ? 'CREDENTIALS' : 'KYC');
    setFeedbackMessage(null);
  };

  const handleRegeneratePassword = () => {
    if (!selectedApp) return;
    const pin = selectedApp.pincode || '834001';
    const prefix = selectedApp.shopName.replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'Krn';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let extra = '';
    for (let i = 0; i < 3; i++) extra += chars.charAt(Math.floor(Math.random() * chars.length));
    setCustomPassword(`MBM#${prefix}${pin.slice(-3)}${extra}`);
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/v1/admin/merchants', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          applicationId: selectedApp.id,
          customShopId,
          customPassword,
          adminNotes,
          adminName: 'Chief Operations Officer (Ranchi HQ)',
        }),
      });

      const data = await res.json();
      setIsProcessing(false);

      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Application Approved! Credentials dispatched to WhatsApp (+91 ${selectedApp.phone}) & Email (${selectedApp.email}).`,
        });
        setSelectedApp(data.application);
        setReviewTab('CREDENTIALS');
        fetchApplications();
      } else {
        setFeedbackMessage({ type: 'error', text: data.message || 'Approval failed.' });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to submit approval.' });
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    const reason = prompt('Please specify rejection reason for KYC records:');
    if (!reason) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/v1/admin/merchants', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          applicationId: selectedApp.id,
          reason,
        }),
      });
      const data = await res.json();
      setIsProcessing(false);
      if (data.success) {
        setFeedbackMessage({ type: 'success', text: 'Application rejected.' });
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (e: any) {
      setIsProcessing(false);
      alert('Error rejecting: ' + e.message);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      app.shopName.toLowerCase().includes(q) ||
      app.ownerName.toLowerCase().includes(q) ||
      app.phone.includes(q) ||
      app.pincode.includes(q) ||
      app.applicationNumber.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Context */}
      <div className="bg-gradient-to-r from-[#064E3B] to-[#043327] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-800/60 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 mb-3">
            <Store className="w-3.5 h-3.5" />
            <span>Hyperlocal Merchant Network — Phase 1 Ranchi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Merchant Onboarding & KYC Approvals</h2>
          <p className="text-sm text-emerald-200 mt-2 leading-relaxed">
            Review registration submissions from local shops and SHG producers. Verify FSSAI licenses, Trade permits, and bank accounts. Upon approval, automatically generate credentials and dispatch them instantly via WhatsApp and Email.
          </p>
        </div>
        <div className="absolute right-4 -bottom-8 opacity-10 hidden sm:block">
          <Building2 className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending KYC</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{metrics.pendingReview}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting admin action</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Partners</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#16A34A]">{metrics.approvedPartners}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Credentials dispatched</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Stores</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600">{metrics.activeStores}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Live in Ranchi Central</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Submissions</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{metrics.totalApplications}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">All time applications</p>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Status Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' && 'All Applications'}
              {st === 'PENDING_REVIEW' && `Pending Review (${metrics.pendingReview})`}
              {st === 'APPROVED' && `Approved (${metrics.approvedPartners})`}
              {st === 'REJECTED' && `Rejected (${metrics.rejectedApplications || 0})`}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search store, owner, pin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={fetchApplications}
            className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-slate-200"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* Main Table / Applications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">Merchant Applications Queue</h3>
          <span className="text-xs font-bold text-slate-500">{filteredApplications.length} Found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Application</th>
                <th className="py-3.5 px-4">Store & Owner</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Type & Pin</th>
                <th className="py-3.5 px-4">Licenses & KYC</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No applications matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr 
                    key={app.id} 
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => handleSelectApp(app)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      <div>{app.applicationNumber}</div>
                      <div className="text-[10px] font-normal text-slate-400">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{app.shopName}</div>
                      <div className="text-[11px] text-slate-500">Prop: {app.ownerName}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{app.phone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{app.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px]">
                        {app.businessType.replace('_', ' ')}
                      </span>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">📍 {app.pincode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[11px] font-medium text-slate-700">
                        FSSAI: <span className="font-mono font-bold">{app.fssaiNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Bank: {app.bankName.slice(0, 16)}...
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {app.status === 'PENDING_REVIEW' && (
                        <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {app.status === 'APPROVED' && (
                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved & Active</span>
                        </span>
                      )}
                      {app.status === 'REJECTED' && (
                        <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectApp(app);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1 ml-auto cursor-pointer ${
                          app.status === 'PENDING_REVIEW'
                            ? 'bg-[#16A34A] hover:bg-[#15803d] text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{app.status === 'PENDING_REVIEW' ? 'Review & KYC' : 'View Details'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & KYC Modal / Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="bg-[#064E3B] text-white px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black">{selectedApp.shopName}</h3>
                    <span className="bg-emerald-900/80 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded-md border border-emerald-700">
                      {selectedApp.applicationNumber}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200">
                    Proprietor: {selectedApp.ownerName} • {selectedApp.city}, {selectedApp.state} ({selectedApp.pincode})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setReviewTab('KYC')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  reviewTab === 'KYC'
                    ? 'bg-white text-[#064E3B] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>KYC & Business Details</span>
              </button>

              <button
                onClick={() => setReviewTab('DOCUMENTS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  reviewTab === 'DOCUMENTS'
                    ? 'bg-white text-[#064E3B] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Uploaded Documents</span>
              </button>

              <button
                onClick={() => setReviewTab('CREDENTIALS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  reviewTab === 'CREDENTIALS'
                    ? 'bg-white text-[#064E3B] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Credentials & Dispatch</span>
              </button>
            </div>

            {/* Feedback Alert */}
            {feedbackMessage && (
              <div
                className={`mx-6 mt-4 p-3.5 rounded-2xl flex items-center space-x-2 text-xs font-bold ${
                  feedbackMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {feedbackMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* TAB 1: KYC & BUSINESS DETAILS */}
              {reviewTab === 'KYC' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Basic Info Box */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                        <Store className="w-4 h-4 text-emerald-700" />
                        <span>Store Premises & Address</span>
                      </h4>
                      <div className="text-xs space-y-1.5 text-slate-700">
                        <div><strong className="text-slate-900">Address:</strong> {selectedApp.address}</div>
                        <div><strong className="text-slate-900">City / State:</strong> {selectedApp.city}, {selectedApp.state}</div>
                        <div><strong className="text-slate-900">Postal PIN:</strong> {selectedApp.pincode}</div>
                        <div><strong className="text-slate-900">Business Model:</strong> {selectedApp.businessType}</div>
                        <div><strong className="text-slate-900">Years in Operation:</strong> {selectedApp.yearsInBusiness} Years</div>
                      </div>
                    </div>

                    {/* Legal Licenses Box */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Statutory Licenses</span>
                      </h4>
                      <div className="text-xs space-y-1.5 text-slate-700">
                        <div><strong className="text-slate-900">FSSAI License:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedApp.fssaiNumber}</code></div>
                        <div><strong className="text-slate-900">Trade License:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedApp.tradeLicenseNumber}</code></div>
                        <div><strong className="text-slate-900">PAN Card:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedApp.panNumber}</code></div>
                        <div><strong className="text-slate-900">GSTIN:</strong> {selectedApp.gstin || 'Not registered / Composite'}</div>
                      </div>
                    </div>

                    {/* Banking & Settlement Box */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 md:col-span-2">
                      <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-700" />
                        <span>Daily Settlement Bank Account (Hyperlocal Payouts)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                        <div><strong className="text-slate-900">Bank Name:</strong> {selectedApp.bankName}</div>
                        <div><strong className="text-slate-900">Account Number:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedApp.bankAccountNumber}</code></div>
                        <div><strong className="text-slate-900">IFSC Code:</strong> <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedApp.ifscCode}</code></div>
                      </div>
                    </div>

                  </div>

                  {/* Verification Checklist */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                    <h5 className="text-xs font-black text-[#064E3B] flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Admin KYC Verification Checklist</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700 pt-1">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                        <span>FSSAI License Active</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                        <span>Shop inside Serviceable Pincode</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                        <span>Bank Details Validated</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: UPLOADED DOCUMENTS */}
              {reviewTab === 'DOCUMENTS' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Review digital proof submitted by the merchant partner during initial registration:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Trade License Certificate</span>
                        <a href={selectedApp.documents.tradeLicenseUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center space-x-1">
                          <span>View Full</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                        <img 
                          src={selectedApp.documents.tradeLicenseUrl} 
                          alt="Trade License" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>FSSAI Food License</span>
                        <a href={selectedApp.documents.fssaiCertUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center space-x-1">
                          <span>View Full</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                        <img 
                          src={selectedApp.documents.fssaiCertUrl} 
                          alt="FSSAI Certificate" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Storefront Photo</span>
                        <a href={selectedApp.documents.storePhotoUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center space-x-1">
                          <span>View Full</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                        <img 
                          src={selectedApp.documents.storePhotoUrl} 
                          alt="Store Photo" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>PAN Card</span>
                        <a href={selectedApp.documents.panCardUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center space-x-1">
                          <span>View Full</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                        <img 
                          src={selectedApp.documents.panCardUrl} 
                          alt="PAN Card" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: CREDENTIALS & DISPATCH */}
              {reviewTab === 'CREDENTIALS' && (
                <div className="space-y-6">
                  
                  {/* Generated Credentials Block */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                      <Key className="w-4 h-4 text-emerald-700" />
                      <span>Generated Partner Credentials</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Shop ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Generated Store ID / Username</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={customShopId}
                            onChange={(e) => setCustomShopId(e.target.value)}
                            disabled={selectedApp.status === 'APPROVED'}
                            className="flex-1 font-mono font-bold text-xs bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => handleCopy(customShopId, 'shopId')}
                            className="p-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition text-slate-600"
                            title="Copy Store ID"
                          >
                            {copiedField === 'shopId' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Unique merchant identity for stock and order routing.</p>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Secure Password</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={customPassword}
                            onChange={(e) => setCustomPassword(e.target.value)}
                            disabled={selectedApp.status === 'APPROVED'}
                            className="flex-1 font-mono font-bold text-xs bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          {selectedApp.status !== 'APPROVED' && (
                            <button
                              onClick={handleRegeneratePassword}
                              className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition"
                              title="Regenerate Password"
                            >
                              New
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(customPassword, 'pwd')}
                            className="p-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition text-slate-600"
                            title="Copy Password"
                          >
                            {copiedField === 'pwd' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Dispatched to registered contact details.</p>
                      </div>

                    </div>

                    {/* Admin Review Notes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Admin KYC Verification Notes</label>
                      <input
                        type="text"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        disabled={selectedApp.status === 'APPROVED'}
                        className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                  </div>

                  {/* Dispatch Channel Previews */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                      <Send className="w-4 h-4 text-emerald-700" />
                      <span>Instant Multi-Channel Dispatch Preview</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* WhatsApp Simulation Bubble */}
                      <div className="bg-[#E7F8EE] p-4 rounded-2xl border border-emerald-300 text-xs space-y-2">
                        <div className="flex items-center space-x-2 text-emerald-800 font-extrabold">
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          <span>WhatsApp Channel: +91 {selectedApp.phone}</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-emerald-200 text-slate-800 leading-relaxed font-sans text-[11px] whitespace-pre-line">
                          🛍️ <strong>MegaBachatMart Partner Program — Approved!</strong>
                          <br />
                          Namaste <strong>{selectedApp.ownerName}</strong> ji!
                          Your store <strong>{selectedApp.shopName}</strong> has been activated for Ranchi Central (PIN: {selectedApp.pincode}).
                          <br /><br />
                          🔑 <strong>Portal Credentials:</strong>
                          <br />• <strong>Portal:</strong> https://mymbmart.com/shop/login
                          <br />• <strong>Store ID:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">{customShopId}</code>
                          <br />• <strong>Password:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">{customPassword}</code>
                          <br /><br />
                          Log in to download your CSV template and publish your stock to the live storefront!
                        </div>
                        <div className="text-[10px] text-emerald-700 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Delivered directly to WhatsApp Business Gateway</span>
                        </div>
                      </div>

                      {/* Email Simulation Card */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 text-xs space-y-2">
                        <div className="flex items-center space-x-2 text-slate-800 font-extrabold">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>Email Dispatch: {selectedApp.email}</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-200 text-slate-800 leading-relaxed text-[11px]">
                          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-2">
                            Welcome to MegaBachatMart! Your Merchant Account is Active
                          </div>
                          <p>Dear {selectedApp.ownerName},</p>
                          <p className="mt-1">
                            Your application for <strong>{selectedApp.shopName}</strong> has passed verification.
                          </p>
                          <div className="my-2 p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[10px]">
                            Store ID: {customShopId}<br />
                            Password: {customPassword}<br />
                            Login: https://mymbmart.com/shop/login
                          </div>
                          <p className="text-[10px] text-slate-500">Auto-sent by MegaBachatMart Admin Engine.</p>
                        </div>
                        <div className="text-[10px] text-blue-700 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Delivered via transactional SMTP provider</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div>
                {selectedApp.status === 'APPROVED' ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Account Active • Dispatched via WhatsApp & Email</span>
                  </span>
                ) : (
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                  >
                    Reject Application
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>

                {selectedApp.status === 'PENDING_REVIEW' && (
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="bg-[#16A34A] hover:bg-[#15803d] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md shadow-emerald-700/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isProcessing ? 'Generating & Dispatching...' : 'Approve & Dispatch Credentials'}</span>
                  </button>
                )}

                {selectedApp.status === 'APPROVED' && (
                  <a
                    href="/shop/login"
                    target="_blank"
                    className="bg-[#064E3B] hover:bg-[#043327] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Shop Partner Portal</span>
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
