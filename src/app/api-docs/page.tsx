'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  ShieldCheck, 
  Send, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Search,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  Database
} from 'lucide-react';

export default function ApiDocsPage() {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [testPincode, setTestPincode] = useState('834001');
  const [testSku, setTestSku] = useState('MB-GRO-AASH-5K');
  const [testQty, setTestQty] = useState(2);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runAvailabilityTest = async () => {
    setIsLoading(true);
    setTestResponse(null);
    try {
      const res = await fetch('/api/v1/routing/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfilment_type: 'DELIVERY',
          pincode: testPincode,
          items: [{ sku_id: testSku, quantity: testQty }],
        }),
      });
      const data = await res.json();
      setTestResponse(data);
    } catch (e: any) {
      setTestResponse({ error: e.message || 'Execution error' });
    }
    setIsLoading(false);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/routing/check-availability',
      tag: 'Routing & Availability',
      desc: 'Pre-checkout store discovery, distance calculation, and ETA evaluation across candidate stores.',
      auth: 'Public / Customer',
    },
    {
      method: 'POST',
      path: '/api/v1/routing/route',
      tag: 'Routing & Availability',
      desc: 'Primary order routing with atomic stock reservation and lock ordering.',
      auth: 'Internal Service Token',
    },
    {
      method: 'POST',
      path: '/api/v1/routing/re-route',
      tag: 'Routing & Availability',
      desc: 'Fallback re-routing when a shop rejects an order or breaches acceptance SLA.',
      auth: 'Internal Service Token',
    },
    {
      method: 'GET',
      path: '/api/v1/admin/routing/config',
      tag: 'Admin Hyperlocal Engine',
      desc: 'Retrieve active 8-factor scoring weights, SLAs, and anti-starvation parameters.',
      auth: 'Admin JWT',
    },
    {
      method: 'PUT',
      path: '/api/v1/admin/routing/config',
      tag: 'Admin Hyperlocal Engine',
      desc: 'Update scoring weights (must sum to 1.00) and operational parameters.',
      auth: 'Admin JWT',
    },
    {
      method: 'GET',
      path: '/api/v1/admin/routing/why-no-shop',
      tag: 'Admin Hyperlocal Engine',
      desc: 'Diagnostics probe reporting filter failure breakdown per shop for unserviceable carts.',
      auth: 'Admin JWT',
    },
    {
      method: 'GET',
      path: '/api/v1/admin/routing/audit',
      tag: 'Admin Hyperlocal Engine',
      desc: 'Query persistent routing audit logs with candidate breakdown and decision latency.',
      auth: 'Admin JWT',
    },
    {
      method: 'POST',
      path: '/api/v1/auth/send-otp',
      tag: 'Auth & OTP',
      desc: 'Send 6-digit verification code to mobile number across all portals.',
      auth: 'Public',
    },
    {
      method: 'POST',
      path: '/api/v1/auth/verify-otp',
      tag: 'Auth & OTP',
      desc: 'Verify OTP and issue scoped JWT (Customer, Shop, Seller, Admin).',
      auth: 'Public',
    },
  ];

  const filteredEndpoints = selectedTag === 'All' 
    ? endpoints 
    : endpoints.filter(e => e.tag === selectedTag);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#064E3B] flex items-center justify-center text-white font-black text-sm shadow-xs">
              MBM
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#0F172A] flex items-center space-x-2">
                <span>MegaBachatMart API Contract</span>
                <span className="bg-emerald-100 text-[#064E3B] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  OpenAPI 3.1
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Universal Hyperlocal Marketplace Service Layer</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/api/v1/openapi.json"
              target="_blank"
              className="text-xs font-semibold text-slate-600 hover:text-[#16A34A] border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              <span>openapi.json</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
            <Link
              href="/admin"
              className="text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] px-3.5 py-1.5 rounded-lg transition shadow-xs"
            >
              Operations Hub
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-[#064E3B] text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              <Compass className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Hyperlocal Routing Engine v1.0 Active</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">
              Deterministic Store Assignment & API Surface
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every customer order is evaluated through 11 non-negotiable hard filters (F1–F11), scored across 8 weighted 
              factors (Distance, Rating, Acceptance, On-Time, Load, Price, Trust, Fairness), and allocated via atomic stock reservation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 text-center">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl">
              <p className="text-2xl font-black text-[#064E3B]">11</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hard Filters</p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl">
              <p className="text-2xl font-black text-[#16A34A]">8</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scoring Factors</p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl">
              <p className="text-2xl font-black text-[#0284C7]">&lt;200ms</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">P95 Latency</p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl">
              <p className="text-2xl font-black text-[#FF5722]">3</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Max Re-routes</p>
            </div>
          </div>
        </div>

        {/* Live Interactive Routing Sandbox */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#0F172A]">Interactive Routing Engine Simulator</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">POST /api/v1/routing/check-availability</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Pincode</label>
              <input
                type="text"
                value={testPincode}
                onChange={(e) => setTestPincode(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">Try 834001, 834002, 834004, or 834008</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={testSku}
                onChange={(e) => setTestSku(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">Try MB-GRO-AASH-5K or MB-SHG-AMLA-500G</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max="50"
                value={testQty}
                onChange={(e) => setTestQty(Number(e.target.value))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">Tests inventory limits & FEFO batch availability</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={runAvailabilityTest}
              disabled={isLoading}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              {isLoading ? <span>Evaluating Candidate Stores...</span> : <span>Run Availability & Scoring Simulation →</span>}
            </button>
          </div>

          {testResponse && (
            <div className="mt-4 p-4 rounded-2xl bg-[#0F172A] text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
              <pre>{JSON.stringify(testResponse, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {['All', 'Routing & Availability', 'Admin Hyperlocal Engine', 'Auth & OTP'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition shrink-0 ${
                selectedTag === tag
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Endpoints List */}
        <div className="space-y-3">
          {filteredEndpoints.map((ep, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 hover:border-emerald-300 transition shadow-2xs space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                    ep.method === 'POST'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : ep.method === 'PUT'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {ep.method}
                  </span>
                  <code className="text-xs sm:text-sm font-bold text-[#0F172A] font-mono">{ep.path}</code>
                </div>

                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                    {ep.auth}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[#064E3B] font-bold">{ep.tag}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 pl-1">{ep.desc}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
