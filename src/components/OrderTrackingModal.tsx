'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Zap, 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  PackageCheck,
  Bike,
  ExternalLink,
  Store
} from 'lucide-react';
import { OrderRecord } from '@/lib/ordersStore';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderRecord | null;
  onOrderUpdated?: (updatedOrder: OrderRecord) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}) => {
  const [currentOrder, setCurrentOrder] = useState<OrderRecord | null>(order);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatorMessage, setSimulatorMessage] = useState('');
  const [riderInputOtp, setRiderInputOtp] = useState('');
  const [proofHash, setProofHash] = useState<string | null>(null);

  React.useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  if (!isOpen || !currentOrder) return null;

  // Simulate Store Manager Packing
  const handleSimulatePack = async () => {
    setIsSimulating(true);
    setSimulatorMessage('');
    try {
      const res = await fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentOrder.id, action: 'PACK' }),
      });
      const data = await res.json();
      setIsSimulating(false);
      if (data.success && data.order) {
        setCurrentOrder(data.order);
        if (onOrderUpdated) onOrderUpdated(data.order);
        setSimulatorMessage('Store Manager packed the items! Ready for rider dispatch.');
      }
    } catch {
      setIsSimulating(false);
    }
  };

  // Simulate Rider Dispatch
  const handleSimulateDispatch = async () => {
    setIsSimulating(true);
    setSimulatorMessage('');
    try {
      const res = await fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentOrder.id, action: 'DISPATCH' }),
      });
      const data = await res.json();
      setIsSimulating(false);
      if (data.success && data.order) {
        setCurrentOrder(data.order);
        if (onOrderUpdated) onOrderUpdated(data.order);
        setSimulatorMessage('Delivery partner has picked up the order and is on the way!');
      }
    } catch {
      setIsSimulating(false);
    }
  };

  // Simulate Doorstep Delivery OTP Verification
  const handleSimulateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimulatorMessage('');
    try {
      const res = await fetch('/api/rider/verify-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: currentOrder.id, 
          deliveryOtp: riderInputOtp || currentOrder.deliveryOtp 
        }),
      });
      const data = await res.json();
      setIsSimulating(false);
      if (data.success) {
        setCurrentOrder(data.order);
        setProofHash(data.settlement.smartChainProofHash);
        if (onOrderUpdated) onOrderUpdated(data.order);
        setSimulatorMessage(`Delivery Verified! +₹${data.settlement.customerCashbackCredited} cashback credited to wallet!`);
      } else {
        setSimulatorMessage(data.error || 'Verification failed');
      }
    } catch {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-mint text-brand-forest flex items-center justify-center font-black">
              <Zap className="w-5 h-5 fill-brand-green text-brand-green" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Order #{currentOrder.orderNumber}
                </h3>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  currentOrder.status === 'DELIVERED' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {currentOrder.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentOrder.darkStore.name} • ETA 20–25 Mins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Digit Delivery OTP Card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-100 block">
                Doorstep Delivery Secret Code
              </span>
              <div className="text-3xl sm:text-4xl font-black tracking-widest mt-1">
                {currentOrder.deliveryOtp}
              </div>
              <p className="text-[11px] text-amber-100 mt-1 max-w-xs">
                Share this 4-digit code with rider only after inspecting your package.
              </p>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Live Delivery Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Live Order Timeline
          </h4>

          <div className="space-y-3">
            {currentOrder.timeline.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-xs">
                <div className="mt-0.5">
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                  )}
                </div>
                <div className="flex-1 flex justify-between">
                  <span className={item.completed ? 'font-bold text-slate-900' : 'text-slate-500'}>
                    {item.step}
                  </span>
                  <span className="text-slate-400 font-medium">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Rider & Dark Store */}
        {currentOrder.assignedRider && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-700">
                <Bike className="w-5 h-5 text-brand-green" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900">
                  Rider: {currentOrder.assignedRider.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {currentOrder.assignedRider.vehicle}
                </p>
              </div>
            </div>

            <a
              href={`tel:${currentOrder.assignedRider.phone}`}
              className="bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Rider</span>
            </a>
          </div>
        )}

        {/* SmartChain Proof Hash (When Delivered) */}
        {proofHash && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1 text-xs text-emerald-900">
            <div className="flex items-center justify-between">
              <span className="font-black flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                <span>SmartChain Audit Proof Verified</span>
              </span>
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300">
                {proofHash}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Double-entry reward transaction permanently recorded. +₹{currentOrder.cashbackEarnable} Cashback credited to your spendable wallet.
            </p>
          </div>
        )}

        {/* Phase 6: Interactive Store & Rider Workflow Simulator */}
        <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <span>🛠️ Dispatch & Delivery Workflow Simulator</span>
            </span>
            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
              Phase 6 Demo
            </span>
          </div>

          {simulatorMessage && (
            <div className="text-xs bg-white border border-emerald-300 text-emerald-900 p-2.5 rounded-xl font-bold">
              {simulatorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            {currentOrder.status === 'PLACED' && (
              <button
                onClick={handleSimulatePack}
                disabled={isSimulating}
                className="col-span-2 bg-brand-forest hover:bg-emerald-950 text-white font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Simulate Store Manager: Pack Order</span>
              </button>
            )}

            {currentOrder.status === 'PACKED' && (
              <button
                onClick={handleSimulateDispatch}
                disabled={isSimulating}
                className="col-span-2 bg-brand-green hover:bg-brand-green-hover text-white font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <Bike className="w-4 h-4" />
                <span>Simulate Dispatch: Assign Rider Sunil</span>
              </button>
            )}

            {currentOrder.status === 'OUT_FOR_DELIVERY' && (
              <form onSubmit={handleSimulateDelivery} className="col-span-2 flex space-x-2">
                <input
                  type="text"
                  placeholder={`Enter OTP (${currentOrder.deliveryOtp})`}
                  value={riderInputOtp}
                  onChange={(e) => setRiderInputOtp(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white font-black px-4 py-2 rounded-xl transition text-xs shrink-0"
                >
                  Verify Delivery
                </button>
              </form>
            )}

            {currentOrder.status === 'DELIVERED' && (
              <div className="col-span-2 text-center text-xs font-bold text-emerald-700 py-1">
                ✓ Order fulfilled & settled. All rewards credited.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
