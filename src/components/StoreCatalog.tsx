'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  ShoppingBag, 
  Tag, 
  Sparkles, 
  Plus, 
  Minus,
  Search, 
  MapPin, 
  Clock, 
  ChevronDown, 
  X, 
  Compass, 
  Check, 
  ShieldCheck, 
  Zap,
  Truck,
  Building2,
  BadgePercent
} from 'lucide-react';
import { CartItem, ProductItem } from '@/lib/types';

interface StoreCatalogProps {
  products: ProductItem[];
  cartItems?: CartItem[];
  onAddToCart: (product: ProductItem) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
}

interface HubInfo {
  name: string;
  city: string;
  deliveryEtaMins: number;
  minOrderFreeDelivery: number;
  status: string;
  distanceKm?: number;
}

export const StoreCatalog: React.FC<StoreCatalogProps> = ({ 
  products, 
  cartItems = [],
  onAddToCart,
  onUpdateQuantity
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationName, setLocationName] = useState<string>('Ranchi Central, Main Road (834001)');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [hubInfo, setHubInfo] = useState<HubInfo>({
    name: 'MegaBachatMart Ranchi Central Dark Store',
    city: 'Ranchi',
    deliveryEtaMins: 25,
    minOrderFreeDelivery: 199,
    status: 'OPEN',
    distanceKm: 2.8,
  });

  const filterTabs = [
    { id: 'All', label: 'All Products', icon: '🛍️' },
    { id: 'QUICK', label: '⚡ 20-Min Quick Commerce', icon: '⚡' },
    { id: 'Groceries', label: 'Groceries & Staples', icon: '🌾' },
    { id: 'SHG Specials', label: 'SHG Handcrafted', icon: '🍯' },
    { id: 'Daily Essentials', label: 'Daily Needs', icon: '🥛' },
    { id: 'Spices', label: 'Pure Oils & Spices', icon: '🌶️' },
    { id: 'MARKETPLACE', label: '📦 Marketplace (2-4 Days)', icon: '📦' },
  ];

  // Serviceability check via backend API
  const checkServiceability = async (coords?: { latitude: number; longitude: number }, pincode?: string) => {
    try {
      const res = await fetch('/api/location/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          pincode: pincode,
        }),
      });
      const data = await res.json();
      if (data.success && data.store) {
        setHubInfo({
          name: data.store.name,
          city: data.store.city,
          deliveryEtaMins: data.store.deliveryEtaMins,
          minOrderFreeDelivery: data.store.minOrderFreeDelivery,
          status: data.store.status,
          distanceKm: data.distanceKm,
        });
        if (pincode) {
          setLocationName(`${data.store.city} (${pincode})`);
        } else if (coords) {
          setLocationName(`GPS: ${data.store.city} Hub (${data.distanceKm} km away)`);
        }
      }
    } catch (e) {
      console.error('Serviceability API error:', e);
    }
  };

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await checkServiceability({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsDetecting(false);
          setIsLocationModalOpen(false);
        },
        async () => {
          // Default to Ranchi Pilot hub
          await checkServiceability(undefined, '834001');
          setLocationName('Ranchi Central, Jharkhand (834001)');
          setIsDetecting(false);
          setIsLocationModalOpen(false);
        },
        { timeout: 5000 }
      );
    } else {
      setLocationName('Ranchi Central, Jharkhand (834001)');
      setIsDetecting(false);
      setIsLocationModalOpen(false);
    }
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempLocation.trim()) {
      const pinMatch = tempLocation.match(/\b\d{6}\b/);
      const pin = pinMatch ? pinMatch[0] : tempLocation.trim();
      await checkServiceability(undefined, pin);
      setLocationName(tempLocation.trim());
      setIsLocationModalOpen(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const isMarketplace = p.category === 'Home & Kitchen';
    
    let matchesFilter = true;
    if (selectedFilter === 'All') matchesFilter = true;
    else if (selectedFilter === 'QUICK') matchesFilter = !isMarketplace;
    else if (selectedFilter === 'MARKETPLACE') matchesFilter = isMarketplace;
    else matchesFilter = p.category === selectedFilter;

    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.producerName && p.producerName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesQuery;
  });

  const getProductQuantity = (productId: string) => {
    const item = cartItems.find((ci) => ci.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <section className="py-6 sm:py-10 bg-slate-50 relative" id="store">
      
      {/* Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsLocationModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-mint text-brand-green flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Change Delivery Location</h3>
                <p className="text-xs text-slate-500">Connected to nearest Dark Store for 10–30 min delivery</p>
              </div>
            </div>

            <button
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition disabled:opacity-60"
            >
              <Compass className={`w-5 h-5 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting Location...' : 'Detect My Current Location'}</span>
            </button>

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-3 text-xs font-bold text-slate-400 uppercase">OR PINCODE</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3">
              <input
                type="text"
                placeholder="Enter area, street name or pincode (e.g. 834001)"
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-emerald-200 text-sm outline-hidden"
              />
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-2xl text-sm transition"
              >
                Confirm Location & View Stores
              </button>
            </form>

            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 flex items-start space-x-2 text-xs text-emerald-800">
              <Building2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <span className="font-bold">Pilot Hub Live:</span> Ranchi Central (834001–834010) & Harmu (834002) with 10–30 min express delivery.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Blinkit Delivery Bar (Location + Speed + Dark Store Hub) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-mint text-brand-green flex items-center justify-center shrink-0 shadow-inner">
              <Zap className="w-6 h-6 fill-brand-green text-brand-green" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2 text-xs font-black text-slate-900">
                <span className="text-sm">Delivery in {hubInfo.deliveryEtaMins} minutes</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  {hubInfo.name.split(' ')[1] || 'Central'} Hub
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  Free delivery above ₹{hubInfo.minOrderFreeDelivery}
                </span>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-brand-forest transition font-medium mt-1 group"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-orange group-hover:scale-110 transition-transform" />
                <span className="font-bold text-slate-800 underline decoration-slate-300 underline-offset-2">{locationName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 'rice', 'oil', 'aam ka achar', 'atta'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-brand-green focus:bg-white rounded-2xl text-xs sm:text-sm outline-hidden transition shadow-2xs"
            />
          </div>
        </div>

        {/* Blinkit-Style Promotional Category Banners Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          <div 
            onClick={() => setSelectedFilter('Groceries')}
            className="cursor-pointer bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-200/80 rounded-3xl p-4 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Direct from Farm</span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
                Pantry Staples & Grains
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">Atta, Rice, Pulses & Pure Ghee</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 bg-white/80 px-2.5 py-1 rounded-xl">
                Up to 25% Off
              </span>
              <span className="text-xs font-black text-brand-orange group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedFilter('SHG Specials')}
            className="cursor-pointer bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200/80 rounded-3xl p-4 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-brand-forest tracking-wider">Empowered Makers</span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
                SHG Handcrafted Specials
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">Pickles, Papads & Spices</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-brand-forest bg-white/80 px-2.5 py-1 rounded-xl">
                100% Authentic
              </span>
              <span className="text-xs font-black text-brand-orange group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedFilter('Spices')}
            className="cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100/70 border border-orange-200/80 rounded-3xl p-4 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-brand-orange tracking-wider">Cold-Pressed & Pure</span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
                Edible Oils & Spices
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">Mustard, Sesame & Groundnut</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-800 bg-white/80 px-2.5 py-1 rounded-xl">
                Zero Adulteration
              </span>
              <span className="text-xs font-black text-brand-orange group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedFilter('MARKETPLACE')}
            className="cursor-pointer bg-gradient-to-br from-sky-50 to-sky-100/70 border border-sky-200/80 rounded-3xl p-4 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-brand-blue tracking-wider">Direct Sellers</span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
                E-Commerce Marketplace
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">Home, Lifestyle & Electronics</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 bg-white/80 px-2.5 py-1 rounded-xl">
                Standard 2-4 Days
              </span>
              <span className="text-xs font-black text-brand-orange group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>

        </div>

        {/* Dual-Commerce Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                selectedFilter === tab.id
                  ? 'bg-brand-forest text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-brand-mint/30'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const qty = getProductQuantity(product.id);
            const isMarketplace = product.category === 'Home & Kitchen';

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Product Image & Badges */}
                <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-104 transition-transform duration-300"
                  />

                  {/* Discount Tag */}
                  <div className="absolute top-2.5 left-2.5 bg-brand-orange text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                    <Tag className="w-3 h-3" />
                    <span>{product.discountPercent}% OFF</span>
                  </div>

                  {/* Delivery Speed Badge (Dual-Commerce Distinction) */}
                  <div className={`absolute top-2.5 right-2.5 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center space-x-1 shadow-2xs ${
                    isMarketplace 
                      ? 'bg-sky-500/90 text-white' 
                      : 'bg-white/95 text-slate-800'
                  }`}>
                    {isMarketplace ? (
                      <>
                        <Truck className="w-3 h-3 text-white" />
                        <span>2–4 DAYS</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-brand-green fill-brand-green" />
                        <span>20 MINS</span>
                      </>
                    )}
                  </div>

                  {/* SHG Badge */}
                  {product.isSHG && (
                    <div className="absolute bottom-2.5 left-2.5 bg-brand-forest/90 backdrop-blur-xs text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      SHG Handcrafted
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {product.category}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 mt-0.5">
                      {product.name}
                    </h3>
                    {product.producerName && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1 truncate">
                        By {product.producerName}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">{product.unit}</p>
                  </div>

                  {/* Cashback Micro-Reward Callout */}
                  <div className="bg-emerald-50/70 rounded-xl px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-emerald-800 border border-emerald-100">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-brand-orange" />
                      <span>Cashback</span>
                    </span>
                    <span>+₹{product.cashbackAmount}</span>
                  </div>

                  {/* Price & Blinkit-Style Stepper / ADD Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          ₹{product.bachatPrice}
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          ₹{product.mrp}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-brand-green block">
                        Save ₹{product.mrp - product.bachatPrice}
                      </span>
                    </div>

                    {qty > 0 && onUpdateQuantity ? (
                      /* Active Blinkit Stepper (- [count] +) */
                      <div className="flex items-center space-x-2 bg-brand-forest text-white rounded-xl px-2 py-1 shadow-sm">
                        <button
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          className="hover:opacity-80 p-0.5"
                          title="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-xs min-w-4 text-center">{qty}</span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          className="hover:opacity-80 p-0.5"
                          title="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Clean Green Blinkit + ADD Button */
                      <button
                        onClick={() => onAddToCart(product)}
                        className="px-3.5 py-1.5 rounded-xl border border-emerald-400 bg-emerald-50 hover:bg-brand-green hover:text-white text-brand-forest font-black text-xs shadow-2xs transition active:scale-95"
                      >
                        + ADD
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
