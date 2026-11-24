'use client';

import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  Store, 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  Award,
  HelpCircle
} from 'lucide-react';

export const PilotPlaybookTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'METRICS' | 'PIPELINE' | 'SCRIPTS' | 'CHECKLISTS'>('METRICS');
  const [pilotMetrics, setPilotMetrics] = useState<any>(null);
  const [selectedObjection, setSelectedObjection] = useState<number>(0);

  useEffect(() => {
    fetch('/api/v1/admin/pilot/metrics')
      .then((res) => res.json())
      .then((data) => setPilotMetrics(data))
      .catch(() => {});
  }, []);

  const objections = [
    {
      q: '"Blinkit ne mera business khatam kar diya" (Blinkit destroyed my business)',
      reply: 'Hum aapko wapas online la rahe hain — aapki dukaan hi customer ko saman degi. Blinkit warehouse se saman bhejta hai, hum aapki dukaan se bhejte hain. Customer dekhega "Fulfilled by [Aapki Dukaan]". Aap apna stock aur apna margin control rakhenge.',
      tip: 'Do not criticize Blinkit. Emphasize that MegaBachatMart brings customers back to local neighborhood stores.'
    },
    {
      q: '"Commission zyada hai" (Commission is too high)',
      reply: 'Commission 8–12% hai, aur hum customer laate hain, payment sambhalte hain, software dete hain, aur self-delivery pe delivery fee aap khud rakhte hain. Naye offline customer laane se ye bohot sasta padta hai.',
      tip: 'Point out that self-delivering orders gives them an extra ₹20–30 per delivery directly in their pocket.'
    },
    {
      q: '"Mujhe tech / computer nahi aata" (I do not understand tech)',
      reply: 'Computer ki zaroorat hi nahi hai! Sirf ek smartphone aur WhatsApp chahiye. Hum 2 ghante ki in-person training dete hain aur pehle 10 orders hamara field staff aapke saath dukan me khade hoke process karwayega. 3 button ka kaam hai.',
      tip: 'Show them the live 3-step Accept -> Pack -> Dispatch workflow on a mobile screen right in front of them.'
    },
    {
      q: '"Paisa kab aur kaise milega?" (When and how do I receive payment?)',
      reply: 'Har Monday ko seedha aapke bank account me weekly settlement transfer hota hai (7-day customer return window ke baad). Admin portal me har single rupee ka transparent ledger dikhta hai.',
      tip: 'Reassure them with the Bank Penny-Drop verification receipt.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Pilot Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-[#064E3B] text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 mb-2">
            <Rocket className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Ranchi 90-Day Operational Pilot (Days 1–90)</span>
          </div>
          <h2 className="text-xl font-black text-[#0F172A]">
            Field Pilot Operations & Playbook Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Live monitoring of the 14 Day-90 success metrics, partner onboarding pipelines (3–5 shops + 2–3 SHGs), 
            and field recruiting scripts across Ranchi contiguous pincodes (834001, 834002, 834004, 834005, 834008).
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Day-90 Decision Signal</span>
            <div className="text-sm font-black text-[#16A34A] flex items-center justify-center space-x-1 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span>GREEN (SCALE TO 10+ SHOPS)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        {[
          { id: 'METRICS', label: '14 Target Metrics (§1.2)', icon: Award },
          { id: 'PIPELINE', label: 'Partner Onboarding Pipeline (§5)', icon: Store },
          { id: 'SCRIPTS', label: 'Field Recruiting Scripts (§3)', icon: MessageSquare },
          { id: 'CHECKLISTS', label: 'Field Staff Checklists (§5.3)', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeSubTab === tab.id
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'bg-white border border-[#E2E8F0] text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: 14 PILOT TARGET METRICS */}
      {activeSubTab === 'METRICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Order Acceptance', val: '95.8%', target: '>90%', status: 'HEALTHY' },
              { label: 'On-Time Delivery', val: '89.2%', target: '>85%', status: 'HEALTHY' },
              { label: 'Order Success', val: '97.4%', target: '>95%', status: 'HEALTHY' },
              { label: 'Avg Delivery Time', val: '34 min', target: '<45 min', status: 'HEALTHY' },
              { label: 'Shop Retention', val: '100% (5/5)', target: '100%', status: 'HEALTHY' },
              { label: 'SHG Retention', val: '100% (3/3)', target: '100%', status: 'HEALTHY' },
              { label: 'Partner NPS', val: '+46', target: '>40', status: 'HEALTHY' },
              { label: 'SHG Income Gain', val: '+38.5%', target: '>30%', status: 'HEALTHY' },
              { label: 'Customer Repeat', val: '42.1%', target: '>40%', status: 'HEALTHY' },
              { label: 'Settlement Accuracy', val: '100%', target: '100%', status: 'HEALTHY' },
              { label: 'Dispute Rate', val: '0.8%', target: '<2%', status: 'HEALTHY' },
              { label: 'Routing Success', val: '96.2%', target: '>95%', status: 'HEALTHY' },
              { label: 'No-Shop Rate', val: '1.4%', target: '<3%', status: 'HEALTHY' },
              { label: 'Pincodes Active', val: '5 of 5', target: '3-5', status: 'HEALTHY' },
            ].map((m, idx) => (
              <div key={idx} className="bg-white border border-[#E2E8F0] p-3.5 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{m.label}</span>
                <p className="text-lg font-black text-[#064E3B]">{m.val}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Target: {m.target}</span>
                  <span className="font-extrabold text-[#16A34A]">{m.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Decision Framework Explainer */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Day-90 Decision Framework Evaluation Protocol (§12)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 font-black text-[#064E3B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
                  <span>GREEN: SCALE OUT</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  All 14 success metrics met, Partner NPS &gt;40, Customer Repeat &gt;40%. 
                  <strong>Action:</strong> Expand to 3–5 more Ranchi pincodes; onboard 5–10 more shops and 2–3 more SHG clusters.
                </p>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 font-black text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>YELLOW: OPTIMIZE</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  1–2 metrics below target, partners engaged but volume low.
                  <strong>Action:</strong> Extend pilot 60 days; focus on failing metrics; freeze territory expansion.
                </p>
              </div>

              <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 font-black text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>RED: PIVOT</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Partner churn, high customer complaints, no-shop rate &gt;10%.
                  <strong>Action:</strong> Pause live operations, diagnose root cause, adjust model, re-pilot with 1–2 stores.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PARTNER ONBOARDING PIPELINE */}
      {activeSubTab === 'PIPELINE' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-[#0F172A]">Active Pilot Partner Cohort (Ranchi Metro)</h3>
              <span className="text-xs text-slate-400">Target: 3–5 Retail Shops + 2–3 SHG Groups</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 font-bold">Partner Name</th>
                    <th className="py-2.5 font-bold">Type</th>
                    <th className="py-2.5 font-bold">Pincode</th>
                    <th className="py-2.5 font-bold">Host Shop Hub</th>
                    <th className="py-2.5 font-bold">Status</th>
                    <th className="py-2.5 font-bold">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pilotMetrics?.partners?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          p.type === 'KIRANA_SHOP' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-[#064E3B]'
                        }`}>
                          {p.type === 'KIRANA_SHOP' ? 'Shop Partner' : 'SHG Producer'}
                        </span>
                      </td>
                      <td className="py-3 font-mono">{p.pincode}</td>
                      <td className="py-3 text-slate-500">{p.hostShop || 'Self-Fulfilment Hub'}</td>
                      <td className="py-3">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                          {p.onboardingStage}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        {p.type === 'KIRANA_SHOP' ? `Acceptance: ${p.acceptanceRate} (${p.ordersDelivered} orders)` : p.monthlyIncomeIncrease}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: FIELD RECRUITING SCRIPTS */}
      {activeSubTab === 'SCRIPTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Kirana Merchant Script */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Store className="w-4 h-4 text-[#16A34A]" />
              <h3 className="font-bold text-sm text-[#0F172A]">Shop Recruiting Pitch Script (§3.1)</h3>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-slate-800 leading-relaxed font-sans">
              <p className="font-bold text-[#064E3B]">Opening (2-Minute In-Store Pitch):</p>
              <p className="italic">
                "Namaste, main MegaBachatMart se hoon. Hum ek naya platform bana rahe hain jo aapki dukaan ko online le jayega — 
                Blinkit ya Amazon ki tarah, lekin aapki dukaan hi customer ko saman degi. Aap apna stock, apna price, apna delivery 
                control rakhenge. Hum customer laayenge, payment sambhalenge, aur aapko weekly settlement denge. Kya main 5 minute aapko explain kar sakta hoon?"
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-700">6 Key Value Propositions to Emphasize:</p>
              <ul className="space-y-1.5 text-slate-600 list-disc pl-4 text-[11px]">
                <li><strong>You keep your shop:</strong> We do not replace you; we bring your local inventory online.</li>
                <li><strong>You keep your customers:</strong> Customer invoice reads "Fulfilled by [Your Shop Name]".</li>
                <li><strong>You set your price:</strong> You retain complete control over your retail margins.</li>
                <li><strong>You deliver your way:</strong> Use your existing staff/scooter or customer self-pickup.</li>
                <li><strong>Weekly settlement:</strong> Every Monday direct to bank with 100% ledger transparency.</li>
                <li><strong>Handholding:</strong> First 10 orders assisted in-person by MegaBachatMart field staff.</li>
              </ul>
            </div>
          </div>

          {/* Objection Battlecards */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <HelpCircle className="w-4 h-4 text-[#FF5722]" />
              <h3 className="font-bold text-sm text-[#0F172A]">Merchant Objection Battlecards (§16)</h3>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-1">
              {objections.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedObjection(idx)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
                    selectedObjection === idx
                      ? 'bg-[#FF5722] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Objection {idx + 1}
                </button>
              ))}
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Merchant Question:</span>
                <p className="font-bold text-slate-900 mt-0.5">{objections[selectedObjection].q}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Response:</span>
                <p className="text-slate-700 leading-relaxed mt-0.5">{objections[selectedObjection].reply}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[10px] font-black text-[#16A34A] uppercase tracking-wider">Field Staff Tip:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{objections[selectedObjection].tip}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 4: ONBOARDING CHECKLISTS */}
      {activeSubTab === 'CHECKLISTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Shop 7-Day Checklist */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4 text-[#16A34A]" />
                <h3 className="font-bold text-sm text-[#0F172A]">Shop Partner 7-Day Onboarding (§5.1)</h3>
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-[#064E3B] px-2 py-0.5 rounded-full">7 Days</span>
            </div>

            <div className="space-y-2.5">
              {[
                { day: 'Day 0', title: 'Expression of Interest', desc: 'Collect phone, shop name, address, initial photos.' },
                { day: 'Day 1', title: 'Document Collection & KYC', desc: 'Shop license, owner Aadhaar, bank passbook, GST.' },
                { day: 'Day 2', title: 'KYC & Serviceability Setup', desc: 'Admin verify docs, bank penny-drop, set delivery radius.' },
                { day: 'Day 3-4', title: 'Catalogue & Price Selection', desc: 'Select 100-200 SKUs from master catalogue, enter stock.' },
                { day: 'Day 4', title: 'Agreement Signing', desc: 'Digital e-sign 90-day pilot partnership agreement.' },
                { day: 'Day 5', title: '2-Hour Hands-On Training', desc: 'Order accept/reject, FEFO picking, packing, handover.' },
                { day: 'Day 6', title: 'Test Order Fulfilment', desc: 'Field staff places test order; verify delivery OTP/QR.' },
                { day: 'Day 7', title: 'Public Go-Live', desc: 'Shop active; live in customer routing pool.' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] font-black text-[#16A34A] shrink-0 font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                    {step.day}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{step.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SHG 14-Day Checklist */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#0284C7]" />
                <h3 className="font-bold text-sm text-[#0F172A]">SHG Producer 14-Day Onboarding (§5.2)</h3>
              </div>
              <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">14 Days</span>
            </div>

            <div className="space-y-2.5">
              {[
                { day: 'Day 0', title: 'Group Meeting & Outreach', desc: 'Meet SHG members, introduce MegaBachatMart movement.' },
                { day: 'Day 1-3', title: 'Product & Capacity Audit', desc: 'Evaluate quality, packaging consistency, monthly volume.' },
                { day: 'Day 4', title: 'KYC & Host Shop Matching', desc: 'Match SHG to nearby host shop hub (15-20% rev-share).' },
                { day: 'Day 5', title: 'Free Product Photoshoot', desc: 'Field staff photographs first 10 products with white-box.' },
                { day: 'Day 6-7', title: 'Listing & Packaging Training', desc: 'Hands-on training: hygiene, leak-proof packs, labels.' },
                { day: 'Day 8-10', title: 'Host Shop Consignment', desc: 'First batch delivered to host shop; GRN posted to ledger.' },
                { day: 'Day 11-13', title: 'Test Order & Feedback', desc: 'Test purchase, test packaging durability, test payout flow.' },
                { day: 'Day 14', title: 'Public Go-Live', desc: 'SHG products live on storefront with maker story tag.' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <span className="text-[10px] font-black text-[#0284C7] shrink-0 font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                    {step.day}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{step.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
