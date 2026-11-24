'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ShieldCheck, 
  Sliders, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Activity,
  Award
} from 'lucide-react';

export const RoutingAdminTab: React.FC = () => {
  const [weights, setWeights] = useState({
    distance: 0.25,
    rating: 0.15,
    acceptance: 0.15,
    ontime: 0.10,
    load: 0.10,
    price: 0.10,
    trust: 0.05,
    fairness: 0.10,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Diagnostics state
  const [diagPincode, setDiagPincode] = useState('834001');
  const [diagSku, setDiagSku] = useState('MB-GRO-AASH-5K');
  const [diagQty, setDiagQty] = useState(2);
  const [diagResult, setDiagResult] = useState<any>(null);
  const [isDiagLoading, setIsDiagLoading] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchConfig = () => {
    fetch('/api/v1/admin/routing/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setWeights(data.config.weights);
        }
      })
      .catch(() => {});
  };

  const fetchAuditLogs = () => {
    setLogsLoading(true);
    fetch('/api/v1/admin/routing/audit?limit=10')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setAuditLogs(data.data);
        }
        setLogsLoading(false);
      })
      .catch(() => setLogsLoading(false));
  };

  useEffect(() => {
    fetchConfig();
    fetchAuditLogs();
  }, []);

  const totalWeight = Object.values(weights).reduce((a, b) => a + Number(b), 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  const handleSaveConfig = async () => {
    if (!isWeightValid) {
      alert(`Weights must sum to 1.00 (Current: ${totalWeight.toFixed(2)})`);
      return;
    }
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/v1/admin/routing/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('Scoring weights saved successfully.');
        setTimeout(() => setSaveMessage(''), 4000);
        fetchConfig();
      } else {
        alert(data.error?.message || 'Failed to save');
      }
    } catch {
      alert('Error updating configuration');
    }
    setIsSaving(false);
  };

  const runDiagnostics = async () => {
    setIsDiagLoading(true);
    try {
      const res = await fetch(
        `/api/v1/admin/routing/why-no-shop?pincode=${diagPincode}&sku_id=${diagSku}&qty=${diagQty}`
      );
      const data = await res.json();
      setDiagResult(data);
    } catch {
      alert('Diagnostic probe failed');
    }
    setIsDiagLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-[#064E3B] text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 mb-2">
            <Compass className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Hyperlocal Routing Engine v1.0</span>
          </div>
          <h2 className="text-xl font-black text-[#0F172A]">
            Autonomous Fulfilment & Store Routing
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Calculates optimal store fulfilment using 11 hard filters (F1–F11), 8 normalized scoring factors, 
            anti-starvation fairness (+0.05 bonus), and atomic stock reservations.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => { fetchConfig(); fetchAuditLogs(); }}
            className="p-2.5 border border-slate-200 hover:border-emerald-300 rounded-xl bg-slate-50 text-slate-600 transition"
            title="Refresh engine state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href="/api-docs"
            target="_blank"
            className="text-xs font-bold text-white bg-[#16A34A] hover:bg-[#15803D] px-4 py-2.5 rounded-xl transition shadow-xs flex items-center space-x-1.5"
          >
            <span>OpenAPI Docs</span>
            <span>→</span>
          </a>
        </div>
      </div>

      {/* Grid: 1. Scoring Weights Tuning, 2. Anti-Starvation & SLAs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scoring Weights Tuner (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#16A34A]" />
              <h3 className="font-bold text-sm text-[#0F172A]">8-Factor Weighted Scoring Formula</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Weight Sum:</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                isWeightValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {totalWeight.toFixed(2)} / 1.00
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {[
              { key: 'distance', label: 'Distance Weight', desc: 'Closest store prioritization' },
              { key: 'rating', label: 'Store Rating Weight', desc: 'Customer review average (1-5)' },
              { key: 'acceptance', label: 'Acceptance Rate Weight', desc: '30-day order acceptance %' },
              { key: 'ontime', label: 'On-Time Rate Weight', desc: '30-day on-time dispatch %' },
              { key: 'load', label: 'Load Balance Weight', desc: 'Avoids store bottlenecks' },
              { key: 'price', label: 'Price Competitiveness', desc: 'Lowest basket price benefit' },
              { key: 'trust', label: 'Composite Trust Score', desc: 'FSSAI, hygiene & audit' },
              { key: 'fairness', label: 'Fairness / Spread Weight', desc: 'Days since last order boost' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>{label}</span>
                  <span className="text-[#16A34A] font-mono font-black">
                    {(weights as any)[key]}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.50"
                  step="0.05"
                  value={(weights as any)[key]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeights(prev => ({ ...prev, [key]: val }));
                  }}
                  className="w-full accent-[#16A34A] cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveMessage ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveMessage}</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Changes take effect immediately on subsequent checkout orders.
              </span>
            )}

            <button
              onClick={handleSaveConfig}
              disabled={!isWeightValid || isSaving}
              className={`text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-xs flex items-center space-x-1.5 ${
                isWeightValid
                  ? 'bg-[#16A34A] hover:bg-[#15803D] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? <span>Saving...</span> : <span>Save Scoring Weights</span>}
            </button>
          </div>
        </div>

        {/* Operational Constraints & Rules (1 col) */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
            <h3 className="font-bold text-sm text-[#0F172A]">Fairness & SLA Policies</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#064E3B]">
                <Award className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Anti-Starvation Rule (§11.2)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Active stores receiving 0 orders in <strong>7 days</strong> get an automatic <strong>+0.05 bonus</strong> in routing score.
              </p>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-[#0284C7]">
                <Clock className="w-3.5 h-3.5" />
                <span>Acceptance SLA</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Stores have <strong>5 minutes</strong> to accept. Breaching SLA triggers automatic order re-routing to next-best candidate.
              </p>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Soft Reservation TTL</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Online payment lock: <strong>15 mins</strong>. Pay-at-Store lock: <strong>30 mins</strong>. Auto-released on timeout.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <Activity className="w-3.5 h-3.5 text-slate-600" />
                <span>Max Re-Routing Limit</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Maximum <strong>3 attempts</strong> per order. If all 3 fail, order is cancelled and customer receives full refund.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Diagnostics Tool: "Why No Shop?" Debugger */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-[#FF5722]" />
            <h3 className="font-bold text-sm text-[#0F172A]">"Why No Shop?" Diagnostics Sandbox (§10.2)</h3>
          </div>
          <span className="text-xs text-slate-400">Simulate Hard Filters (F1–F11) against real store roster</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Pincode</label>
            <input
              type="text"
              value={diagPincode}
              onChange={(e) => setDiagPincode(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-hidden"
              placeholder="e.g. 834001, 834004"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">SKU Code</label>
            <input
              type="text"
              value={diagSku}
              onChange={(e) => setDiagSku(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-hidden"
              placeholder="e.g. MB-GRO-AASH-5K"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                max="100"
                value={diagQty}
                onChange={(e) => setDiagQty(Number(e.target.value))}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-hidden"
              />
              <button
                onClick={runDiagnostics}
                disabled={isDiagLoading}
                className="bg-[#FF5722] hover:bg-[#F4511E] text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs shrink-0 cursor-pointer"
              >
                {isDiagLoading ? 'Testing...' : 'Probe'}
              </button>
            </div>
          </div>
        </div>

        {diagResult && (
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0F172A]">{diagResult.summary}</span>
              <span className="text-slate-400 font-mono">Pincode: {diagResult.pincode}</span>
            </div>

            {diagResult.filterExclusions?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hard Filter Rejections:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {diagResult.filterExclusions.map((ex: any, idx: number) => (
                    <div key={idx} className="bg-white border border-rose-200 text-rose-800 p-2.5 rounded-xl flex items-start space-x-2">
                      <span className="font-black bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] shrink-0 font-mono">
                        {ex.filterCode}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{ex.shopName}</p>
                        <p className="text-[11px] text-rose-700">{ex.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Real-Time Routing Decision Audit Logs */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#16A34A]" />
            <h3 className="font-bold text-sm text-[#0F172A]">Live Decision Audit Log (`routing_audit_log`)</h3>
          </div>
          <span className="text-[11px] text-slate-400">90-Day Immutable Audit Trace</span>
        </div>

        {logsLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading audit events...</div>
        ) : auditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No live checkout routing events recorded yet. Run a simulation above to generate audit logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 font-bold">Order ID</th>
                  <th className="py-2.5 font-bold">Pincode</th>
                  <th className="py-2.5 font-bold">Type</th>
                  <th className="py-2.5 font-bold">Candidate Pool</th>
                  <th className="py-2.5 font-bold">Selected Store</th>
                  <th className="py-2.5 font-bold">Latency</th>
                  <th className="py-2.5 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-mono font-bold text-slate-900">{log.orderId}</td>
                    <td className="py-3 font-mono">{log.pincode}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        log.fulfilmentType === 'DELIVERY' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {log.fulfilmentType}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {log.scoredShops?.length || 0} scored / {log.candidateCount} total
                    </td>
                    <td className="py-3">
                      {log.selectedShopName ? (
                        <span className="font-bold text-[#064E3B]">{log.selectedShopName}</span>
                      ) : (
                        <span className="text-rose-600 font-bold">NO_SHOP</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-slate-500">{log.latencyMs}ms</td>
                    <td className="py-3 text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
