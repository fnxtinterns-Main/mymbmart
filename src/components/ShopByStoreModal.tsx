'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Store,
  MapPin,
  Compass,
  Star,
  ShieldBan,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { resolvePincodeCoords } from '@/lib/geoUtils';
import { getStoredUserSession } from '@/lib/userSession';

export interface NearbyStoreItem {
  shopId: string;
  shopName: string;
  address: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  businessType: string;
  listedProductCount?: number;
  samePincode?: boolean;
  distanceKm: number;
  durationText?: string | null;
  googleMapsUrl?: string;
  avgRating: number;
  reviewCount: number;
  isBlocked: boolean;
  blockReason?: string | null;
}

export interface CustomerLocation {
  fullAddress: string;
  pincode: string;
  latitude: number;
  longitude: number;
  label: string;
}

export function getSavedCustomerLocation(): CustomerLocation {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('mbm_customer_location');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return parsed;
        }
      }
    } catch {}
  }
  const fallback = resolvePincodeCoords('834001');
  return {
    fullAddress: 'Ranchi Central, Main Road',
    pincode: '834001',
    latitude: fallback.latitude,
    longitude: fallback.longitude,
    label: 'Ranchi Central (834001)',
  };
}

interface ShopByStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStore: (store: NearbyStoreItem) => void;
  onStoresUpdated?: (stores: NearbyStoreItem[], location: CustomerLocation) => void;
}

export const ShopByStoreModal: React.FC<ShopByStoreModalProps> = ({
  isOpen,
  onClose,
  onSelectStore,
  onStoresUpdated,
}) => {
  const [stores, setStores] = useState<NearbyStoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<CustomerLocation>(getSavedCustomerLocation);
  const [editingLoc, setEditingLoc] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  // Active rating or block sub-forms per store
  const [ratingTargetId, setRatingTargetId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const [blockTargetId, setBlockTargetId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [submittingBlock, setSubmittingBlock] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getCurrentUserIdentity = () => {
    const session = getStoredUserSession();
    if (session.isLoggedIn && session.user) {
      return {
        userId: session.user.id || session.user.memberId || session.user.phone || 'guest-user',
        userName: session.user.name || 'Customer',
      };
    }
    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('mbm_guest_id');
      if (!guestId) {
        guestId = 'guest-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('mbm_guest_id', guestId);
      }
      return { userId: guestId, userName: 'Guest Customer' };
    }
    return { userId: 'guest-user', userName: 'Guest Customer' };
  };

  const onStoresUpdatedRef = useRef(onStoresUpdated);
  onStoresUpdatedRef.current = onStoresUpdated;

  const fetchStores = useCallback(async (loc: CustomerLocation) => {
    setLoading(true);
    try {
      const { userId } = getCurrentUserIdentity();
      const params = new URLSearchParams({
        lat: String(loc.latitude),
        lng: String(loc.longitude),
        pincode: loc.pincode || '834001',
        userId,
      });
      const res = await fetch(`/api/stores?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.stores)) {
        setStores(data.stores);
        onStoresUpdatedRef.current?.(data.stores, loc);
      }
    } catch (err) {
      console.error('Failed to fetch nearby stores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const latest = getSavedCustomerLocation();
      setLocation(latest);
      setActionMsg(null);
      fetchStores(latest);
    }
  }, [isOpen, fetchStores]);

  if (!isOpen) return null;

  const saveAndReloadLocation = (nextLoc: CustomerLocation) => {
    setLocation(nextLoc);
    setEditingLoc(false);
    try {
      localStorage.setItem('mbm_customer_location', JSON.stringify(nextLoc));
      window.dispatchEvent(new CustomEvent('mbm_location_updated', { detail: nextLoc }));
    } catch {}
    fetchStores(nextLoc);
  };

  const handleApplyLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = newPincode.replace(/\D/g, '').slice(0, 6);
    const cleanAddr = newAddress.trim();
    if (cleanPin.length !== 6 && !cleanAddr) {
      setActionMsg({ type: 'error', text: 'Please enter a valid 6-digit pincode or address.' });
      return;
    }

    setLoading(true);
    try {
      const { userId } = getCurrentUserIdentity();
      const params = new URLSearchParams({
        address: cleanAddr,
        pincode: cleanPin || location.pincode,
        userId,
      });
      const res = await fetch(`/api/stores?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      const resolvedLat = data?.userCoords?.latitude ?? resolvePincodeCoords(cleanPin || location.pincode).latitude;
      const resolvedLng = data?.userCoords?.longitude ?? resolvePincodeCoords(cleanPin || location.pincode).longitude;
      const nextLoc: CustomerLocation = {
        fullAddress: cleanAddr || `Pincode ${cleanPin}`,
        pincode: cleanPin || location.pincode,
        latitude: resolvedLat,
        longitude: resolvedLng,
        label: cleanAddr
          ? `${cleanAddr}${cleanPin ? ` (${cleanPin})` : ''}`
          : `Pincode ${cleanPin}`,
      };
      setLocation(nextLoc);
      setEditingLoc(false);
      try {
        localStorage.setItem('mbm_customer_location', JSON.stringify(nextLoc));
        window.dispatchEvent(new CustomEvent('mbm_location_updated', { detail: nextLoc }));
      } catch {}
      if (data.success && Array.isArray(data.stores)) {
        setStores(data.stores);
        onStoresUpdatedRef.current?.(data.stores, nextLoc);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setActionMsg({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setDetectingGps(true);
    setActionMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingGps(false);
        saveAndReloadLocation({
          fullAddress: 'Current GPS Location',
          pincode: location.pincode,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          label: `GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`,
        });
      },
      () => {
        setDetectingGps(false);
        setActionMsg({ type: 'error', text: 'GPS access denied. Please enter your 6-digit pincode.' });
      },
      { timeout: 6000 }
    );
  };

  const handleSubmitRating = async (store: NearbyStoreItem) => {
    if (!ratingComment.trim()) {
      setActionMsg({ type: 'error', text: 'Please write a short review about your experience.' });
      return;
    }
    setSubmittingRating(true);
    setActionMsg(null);
    try {
      const { userId, userName } = getCurrentUserIdentity();
      const res = await fetch('/api/stores/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: store.shopId,
          shopName: store.shopName,
          userId,
          userName,
          rating: ratingStars,
          comment: ratingComment.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRatingTargetId(null);
        setRatingComment('');
        setActionMsg({ type: 'success', text: `Thank you! Rated ${store.shopName} ${ratingStars}/5 stars.` });
        fetchStores(location);
      } else {
        setActionMsg({ type: 'error', text: data.message || 'Failed to submit rating.' });
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to submit rating.' });
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleBlockStore = async (store: NearbyStoreItem) => {
    if (blockReason.trim().length < 3) {
      setActionMsg({ type: 'error', text: 'Blocking reason is compulsory (minimum 3 characters).' });
      return;
    }
    setSubmittingBlock(true);
    setActionMsg(null);
    try {
      const { userId, userName } = getCurrentUserIdentity();
      const res = await fetch('/api/stores/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: store.shopId,
          shopName: store.shopName,
          userId,
          userName,
          reason: blockReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlockTargetId(null);
        setBlockReason('');
        setActionMsg({ type: 'success', text: `${store.shopName} has been blocked.` });
        fetchStores(location);
      } else {
        setActionMsg({ type: 'error', text: data.message || 'Failed to block store.' });
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to block store.' });
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleUnblockStore = async (store: NearbyStoreItem) => {
    setActionMsg(null);
    try {
      const { userId } = getCurrentUserIdentity();
      const res = await fetch('/api/stores/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: store.shopId, userId }),
      });
      if (res.ok) {
        setActionMsg({ type: 'success', text: `${store.shopName} unblocked.` });
        fetchStores(location);
      }
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shop by Store"
      onClick={onClose}
      className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-8 sm:pt-12 px-4 pb-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[86vh] flex flex-col shadow-2xl border border-emerald-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#064E3B] to-[#15803D] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Store className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="text-base font-black">Shop by Store (Nearest to You)</h3>
              <p className="text-[11px] text-emerald-100">
                Compare distance, check real customer ratings, or block stores with poor service.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close Shop by Store"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Location & Change Location Bar */}
        <div className="bg-[#F2FBF6] px-5 py-3 border-b border-emerald-100 shrink-0 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs text-[#064E3B]">
              <MapPin className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>
                Your Location: <strong className="font-extrabold">{location.label}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleUseGps}
                disabled={detectingGps}
                className="inline-flex items-center space-x-1 text-[11px] font-bold bg-white hover:bg-emerald-50 text-[#064E3B] border border-emerald-300 px-2.5 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                <Compass className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>{detectingGps ? 'Detecting...' : 'Use GPS'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingLoc(!editingLoc);
                  setNewPincode(location.pincode);
                  setNewAddress('');
                }}
                className="text-[11px] font-extrabold bg-[#064E3B] hover:bg-emerald-950 text-white px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                {editingLoc ? 'Cancel' : 'Change Location'}
              </button>
            </div>
          </div>

          {editingLoc && (
            <form onSubmit={handleApplyLocation} className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                placeholder="Area / Street Address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                placeholder="6-Digit Pincode"
                value={newPincode}
                onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full sm:w-36 px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-mono outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
              <button
                type="submit"
                className="bg-[#16A34A] hover:bg-[#15803d] text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Update
              </button>
            </form>
          )}

          {actionMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                actionMsg.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {actionMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{actionMsg.text}</span>
            </div>
          )}
        </div>

        {/* Store List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-500">Finding nearest partner stores...</div>
          ) : stores.length === 0 ? (
            <div className="text-center py-10 px-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
              <Store className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-black text-slate-800">
                We’re sorry, there are no partner stores nearby your location.
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                No approved MegaBachatMart partner stores were found within 20 km of{' '}
                <strong className="text-slate-700">{location.label}</strong>. Please change your location or pincode above to check another area.
              </p>
            </div>
          ) : (
            stores.map((st, idx) => (
              <div
                key={st.shopId}
                className={`rounded-2xl border p-4 space-y-3 transition ${
                  st.isBlocked
                    ? 'bg-rose-50/50 border-rose-200 opacity-85'
                    : idx === 0
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h4 className="text-sm font-black text-slate-900">{st.shopName}</h4>
                      {st.samePincode && (
                        <span className="text-[10px] font-black bg-emerald-100 text-[#064E3B] border border-emerald-300 px-2 py-0.5 rounded-full">
                          Your Pincode ({st.pincode})
                        </span>
                      )}
                      {idx === 0 && !st.isBlocked && (
                        <span className="text-[10px] font-black bg-[#16A34A] text-white px-2 py-0.5 rounded-full">
                          Nearest Store
                        </span>
                      )}
                      {st.isBlocked && (
                        <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {st.address} &bull; Pincode <span className="font-mono font-bold">{st.pincode}</span>
                      {typeof st.listedProductCount === 'number' && (
                        <> &bull; <span className="font-bold text-emerald-700">{st.listedProductCount} items listed</span></>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 shrink-0">
                    <a
                      href={st.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${st.latitude},${st.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition"
                      title="Open route in Google Maps"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{st.distanceKm} km{st.durationText ? ` (${st.durationText})` : ' away'}</span>
                    </a>
                    <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-extrabold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{st.reviewCount > 0 ? `${st.avgRating} (${st.reviewCount})` : 'No ratings'}</span>
                    </span>
                  </div>
                </div>

                {st.isBlocked && st.blockReason && (
                  <p className="text-[11px] text-rose-700 bg-rose-100/70 px-3 py-1.5 rounded-xl font-semibold">
                    Blocked reason: {st.blockReason}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRatingTargetId(ratingTargetId === st.shopId ? null : st.shopId);
                        setBlockTargetId(null);
                        setRatingStars(5);
                        setRatingComment('');
                      }}
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Rate Store</span>
                    </button>

                    {st.isBlocked ? (
                      <button
                        type="button"
                        onClick={() => handleUnblockStore(st)}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        <span>Unblock Store</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setBlockTargetId(blockTargetId === st.shopId ? null : st.shopId);
                          setRatingTargetId(null);
                          setBlockReason('');
                        }}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        <ShieldBan className="w-3.5 h-3.5" />
                        <span>Block Store</span>
                      </button>
                    )}
                  </div>

                  {!st.isBlocked && (
                    <button
                      type="button"
                      onClick={() => onSelectStore(st)}
                      className="inline-flex items-center space-x-1.5 bg-[#064E3B] hover:bg-emerald-950 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      <span>Shop This Store</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Inline Rate Store Form */}
                {ratingTargetId === st.shopId && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Rate your experience at {st.shopName}:</span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingStars(star)}
                            className="p-0.5 cursor-pointer"
                            aria-label={`Rate ${star} stars`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= ratingStars
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Write your genuine review about delivery speed, freshness, or service..."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-xs outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={submittingRating}
                        onClick={() => handleSubmitRating(st)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {submittingRating ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Block Store Form (Mandatory Reason) */}
                {blockTargetId === st.shopId && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
                    <label className="block font-bold text-rose-900">
                      Why are you blocking {st.shopName}? (Reason is compulsory *)
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Write your reason (e.g., poor quality items, late delivery, wrong billing)..."
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={submittingBlock || blockReason.trim().length < 3}
                        onClick={() => handleBlockStore(st)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {submittingBlock ? 'Blocking...' : 'Confirm Block Store'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
