'use client';

import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { CartItem, ProductItem } from '@/lib/types';

interface StoreCatalogProps {
  products: ProductItem[];
  cartItems?: CartItem[];
  onAddToCart: (product: ProductItem) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
}

export const StoreCatalog: React.FC<StoreCatalogProps> = ({ 
  products, 
  cartItems = [],
  onAddToCart,
  onUpdateQuantity
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<string>('Select Location');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState('');

  const categories = ['All', 'Groceries', 'SHG Specials', 'Daily Essentials', 'Spices', 'Home & Kitchen'];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const getProductQuantity = (productId: string) => {
    const item = cartItems.find((ci) => ci.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocation('HSR Layout, Sector 2, Bengaluru');
          setIsLocationModalOpen(false);
        },
        () => {
          setLocation('Indiranagar, Bengaluru');
          setIsLocationModalOpen(false);
        }
      );
    } else {
      setLocation('Indiranagar, Bengaluru');
      setIsLocationModalOpen(false);
    }
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempLocation.trim()) {
      setLocation(tempLocation.trim());
      setIsLocationModalOpen(false);
    }
  };

  return (
    <section className="py-6 sm:py-10 bg-slate-50 relative" id="store">
      
      {/* Location Modal (Blinkit Screenshot Exact Pattern) */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
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
                <p className="text-xs text-slate-500">Find nearest local producer hubs & 20-min delivery slots</p>
              </div>
            </div>

            <button
              onClick={handleDetectLocation}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition"
            >
              <Compass className="w-5 h-5" />
              <span>Detect My Current Location</span>
            </button>

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-3 text-xs font-bold text-slate-400 uppercase">OR</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3">
              <input
                type="text"
                placeholder="Enter area, street name or pincode"
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-brand-green focus:ring-2 focus:ring-emerald-200 text-sm outline-hidden"
              />
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-2xl text-sm transition"
              >
                Confirm Location
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Blinkit Delivery Bar (Location + Speed) */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-green flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900">
                <span>Delivery in 20–30 minutes</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Fast Local
                </span>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center space-x-1 text-xs text-slate-500 hover:text-brand-forest transition font-medium mt-0.5"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                <span className="font-bold text-slate-800">{location}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 'rice', 'oil', 'pickle', 'atta'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-brand-green focus:bg-white rounded-full text-xs sm:text-sm outline-hidden transition"
            />
          </div>
        </div>

        {/* Blinkit-Style Promotional Category Banners Row (Image 6 Replica) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          <div 
            onClick={() => setSelectedCategory('Groceries')}
            className="cursor-pointer bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-200/80 rounded-2xl p-4 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Direct from Farm</span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
                Pantry Staples & Grains
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">Atta, Rice, Pulses & Pure Ghee</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 bg-white/80 px-2.5 py-1 rounded-lg">
                Up to 25% Off
              </span>
              <span className="text-xs font-black text-brand-orange group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedCategory('SHG Specials')}
            className="cursor-pointer bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200/80 rounded-2xl p-4 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-brand-forest tracking-wider">Empowered Makers</span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
                SHG Handcrafted Specials
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">Pickles, Papads & Spices</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-brand-forest bg-white/80 px-2.5 py-1 rounded-lg">
                100% Authentic
              </span>
              <span className="text-xs font-black text-brand-orange group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedCategory('Spices')}
            className="cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100/70 border border-orange-200/80 rounded-2xl p-4 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-brand-orange tracking-wider">Cold-Pressed & Pure</span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
                Edible Oils & Spices
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">Mustard, Sesame & Groundnut</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-800 bg-white/80 px-2.5 py-1 rounded-lg">
                Zero Adulteration
              </span>
              <span className="text-xs font-black text-brand-orange group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedCategory('Home & Kitchen')}
            className="cursor-pointer bg-gradient-to-br from-sky-50 to-sky-100/70 border border-sky-200/80 rounded-2xl p-4 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <span className="text-[10px] font-black uppercase text-brand-blue tracking-wider">Eco & Sustainable</span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
                Household Cleaners
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">Bio-Enzymes & Handwash</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 bg-white/80 px-2.5 py-1 rounded-lg">
                Safe & Green
              </span>
              <span className="text-xs font-black text-brand-orange group-hover:translate-x-1 transition-transform">
                Explore →
              </span>
            </div>
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-forest text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-brand-mint/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid (Blinkit Style Quick-Commerce Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const qty = getProductQuantity(product.id);

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

                  {/* Delivery Speed Badge */}
                  <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-2xs">
                    <Clock className="w-3 h-3 text-brand-green" />
                    <span>20 MINS</span>
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
