'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  MapPin,
  Compass,
  Package,
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Users,
  Store,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { getStoredUserSession } from '@/lib/userSession';
import { getSavedCustomerLocation, CustomerLocation } from '@/components/ShopByStoreModal';
import { resolvePincodeCoords } from '@/lib/geoUtils';
import { UserProfile } from '@/lib/types';

export default function CustomerProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wallet, setWallet] = useState<{ balance: number; totalSavings: number; cashback: number }>({
    balance: 0,
    totalSavings: 0,
    cashback: 0,
  });

  const [location, setLocation] = useState<CustomerLocation>(getSavedCustomerLocation);
  const [addrInput, setAddrInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);
  const [locMsg, setLocMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const session = getStoredUserSession();
    if (session.isLoggedIn && session.user) {
      setUser(session.user);
      setIsLoggedIn(true);
    }

    const savedLoc = getSavedCustomerLocation();
    setLocation(savedLoc);
    setAddrInput(savedLoc.fullAddress);
    setPinInput(savedLoc.pincode);

    fetch('/api/user/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          if (data.user.wallet) {
            setWallet({
              balance: Number(data.user.wallet.balance) || 0,
              totalSavings: Number(data.user.wallet.totalSavings) || 0,
              cashback: Number(data.user.wallet.cashback) || 0,
            });
          }
        }
      })
      .catch(() => {});

    fetch('/api/orders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, []);

  const persistLocation = async (nextLoc: CustomerLocation) => {
    setLocation(nextLoc);
    setAddrInput(nextLoc.fullAddress);
    setPinInput(nextLoc.pincode);
    try {
      localStorage.setItem('mbm_customer_location', JSON.stringify(nextLoc));
      window.dispatchEvent(new CustomEvent('mbm_location_updated', { detail: nextLoc }));
    } catch {}

    if (!isLoggedIn) return;
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullAddress: nextLoc.fullAddress,
          pincode: nextLoc.pincode,
        }),
      });
    } catch {}
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setLocMsg({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setDetectingGps(true);
    setLocMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setDetectingGps(false);
        const nextLoc: CustomerLocation = {
          fullAddress: addrInput.trim() || 'Current GPS Location',
          pincode: pinInput.replace(/\D/g, '').slice(0, 6) || location.pincode,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          label: `GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`,
        };
        await persistLocation(nextLoc);
        setLocMsg({ type: 'success', text: 'GPS location updated! Nearest stores will now match this location.' });
      },
      () => {
        setDetectingGps(false);
        setLocMsg({ type: 'error', text: 'GPS access denied. Please enter your address and 6-digit pincode.' });
      },
      { timeout: 6000 }
    );
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddr = addrInput.trim();
    const cleanPin = pinInput.replace(/\D/g, '').slice(0, 6);
    if (cleanAddr.length < 3 || cleanPin.length !== 6) {
      setLocMsg({ type: 'error', text: 'Please enter a valid address and 6-digit pincode.' });
      return;
    }
    setSavingLoc(true);
    setLocMsg(null);
    try {
      const res = await fetch(
        `/api/stores?address=${encodeURIComponent(cleanAddr)}&pincode=${encodeURIComponent(cleanPin)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      const fallback = resolvePincodeCoords(cleanPin);
      const nextLoc: CustomerLocation = {
        fullAddress: cleanAddr,
        pincode: cleanPin,
        latitude: data?.userCoords?.latitude ?? fallback.latitude,
        longitude: data?.userCoords?.longitude ?? fallback.longitude,
        label: `${cleanAddr} (${cleanPin})`,
      };
      await persistLocation(nextLoc);
      setLocMsg({ type: 'success', text: 'Location saved! Nearest stores and distances updated.' });
    } catch {
      setLocMsg({ type: 'error', text: 'Failed to update location.' });
    } finally {
      setSavingLoc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-[#0F172A]">
      <Navbar user={user} isLoggedIn={isLoggedIn} cartCount={0} />

      <main className="flex-1 w-[94%] max-w-5xl mx-auto py-8 space-y-6">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-[#064E3B] to-[#15803D] text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl font-black">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-[#FF5722] text-white px-2.5 py-0.5 rounded-full">
                {user?.level || 'Silver'} Member
              </span>
              <h1 className="text-xl sm:text-2xl font-black mt-1">{user?.name || 'MegaBachatMart Member'}</h1>
              <p className="text-xs text-emerald-100 mt-0.5">
                {user?.phone ? `+91 ${user.phone}` : 'Guest Session'}
                {user?.email ? ` • ${user.email}` : ''}
                {user?.memberId ? ` • ID: ${user.memberId}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/shop"
              className="bg-white text-[#064E3B] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs hover:bg-emerald-50 transition"
            >
              <Store className="w-4 h-4 text-[#16A34A]" />
              <span>Shop Nearby Stores</span>
            </Link>
            <Link
              href="/savings"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition"
            >
              <Wallet className="w-4 h-4" />
              <span>₹{wallet.balance} Wallet</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Update Location + Payment / Account Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-[#16A34A]" />
                  <h2 className="text-base font-black text-slate-900">Your Delivery Location</h2>
                </div>
                <button
                  type="button"
                  onClick={handleUseGps}
                  disabled={detectingGps}
                  className="inline-flex items-center space-x-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-[#064E3B] border border-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  <Compass className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>{detectingGps ? 'Detecting...' : 'Use GPS'}</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#F2FBF6] border border-emerald-100 text-xs text-[#064E3B]">
                Current Location: <strong>{location.label}</strong>
              </div>

              <form onSubmit={handleSaveLocation} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Address *</label>
                  <input
                    type="text"
                    required
                    value={addrInput}
                    onChange={(e) => setAddrInput(e.target.value)}
                    placeholder="House / Flat, Street, Area, City"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">6-Digit Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="e.g. 826001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>

                {locMsg && (
                  <div
                    className={`p-2.5 rounded-xl font-bold flex items-center space-x-2 ${
                      locMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {locMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{locMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingLoc}
                  className="w-full bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {savingLoc ? 'Updating Location...' : 'Update Location'}
                </button>
              </form>
            </div>

            {/* Quick Account & Wallet Links */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-[#FF5722]" />
                <span>Savings &amp; Payment Summary</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#F2FBF6] border border-emerald-100">
                  <span className="text-slate-500 font-semibold">Wallet Balance</span>
                  <div className="text-lg font-black text-[#064E3B] mt-0.5">₹{wallet.balance}</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFF3EE] border border-orange-100">
                  <span className="text-slate-500 font-semibold">Total Savings</span>
                  <div className="text-lg font-black text-[#FF5722] mt-0.5">₹{wallet.totalSavings}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <Link
                  href="/savings"
                  className="flex-1 text-center bg-slate-50 hover:bg-emerald-50 border border-slate-200 font-bold text-slate-800 py-2 rounded-xl transition"
                >
                  Savings Passbook
                </Link>
                <Link
                  href="/refer"
                  className="flex-1 text-center bg-slate-50 hover:bg-orange-50 border border-slate-200 font-bold text-slate-800 py-2 rounded-xl transition flex items-center justify-center space-x-1"
                >
                  <Users className="w-3.5 h-3.5 text-[#FF5722]" />
                  <span>Refer &amp; Earn</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Order History & Payment Details */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#064E3B]" />
                <h2 className="text-base font-black text-slate-900">Order History &amp; Payment Details</h2>
              </div>
              <Link href="/orders" className="text-xs font-bold text-[#16A34A] hover:underline flex items-center space-x-1">
                <span>Full Orders Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingOrders ? (
              <div className="text-center py-12 text-xs text-slate-500">Loading your orders &amp; payment history...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-xs text-slate-500">No orders placed yet under this account.</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center space-x-1.5 bg-[#064E3B] text-white text-xs font-extrabold px-4 py-2 rounded-xl"
                >
                  <span>Start Shopping</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-black text-slate-900">{ord.orderNumber}</span>
                        <span className="text-slate-400 ml-2">
                          {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN') : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#064E3B] border border-emerald-200">
                          {ord.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          {ord.paymentMethod} &bull; {ord.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Delivered to: {ord.deliveryAddress} ({ord.pincode})
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500">Paid:</span>{' '}
                        <strong className="text-slate-900">₹{ord.totalPayable}</strong>
                        {ord.shoppingSavings > 0 && (
                          <span className="ml-2 text-[#16A34A] font-bold">
                            (Saved ₹{ord.shoppingSavings})
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/orders/${ord.id}`}
                        className="font-bold text-[#064E3B] hover:underline flex items-center space-x-1"
                      >
                        <span>View Receipt</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav cartCount={0} />
      <Footer />
    </div>
  );
}
