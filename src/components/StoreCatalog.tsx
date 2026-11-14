'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  ShoppingBag, 
  Tag, 
  Sparkles, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter,
  Check,
  Heart
} from 'lucide-react';
import { ProductItem } from '@/lib/types';

interface StoreCatalogProps {
  products: ProductItem[];
  onAddToCart: (product: ProductItem) => void;
}

export const StoreCatalog: React.FC<StoreCatalogProps> = ({ products, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);

  const categories = ['All', 'Groceries', 'SHG Specials', 'Daily Essentials', 'Spices', 'Home & Kitchen'];

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleAdd = (product: ProductItem) => {
    onAddToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section className="py-8 sm:py-12 bg-slate-50" id="store">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              <span>Direct-From-Producer & Community Bulk Savings</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Community Essentials & SHG Marketplace
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Every purchase saves you money, supports grassroot women entrepreneurs, and credits your promoter network.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search atta, rice, pickle, ghee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 shadow-sm"
            />
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
                  ? 'bg-brand-navy text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Product Image & Badges */}
              <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Discount Tag */}
                <div className="absolute top-2.5 left-2.5 bg-brand-orange text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                  <Tag className="w-3 h-3" />
                  <span>{product.discountPercent}% OFF</span>
                </div>

                {/* SHG Badge */}
                {product.isSHG && (
                  <div className="absolute bottom-2.5 left-2.5 bg-emerald-900/90 backdrop-blur-sm text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30">
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

                {/* Price & Add to Cart */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-lg sm:text-xl font-black text-slate-900">
                        ₹{product.bachatPrice}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{product.mrp}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 block">
                      Save ₹{product.mrp - product.bachatPrice}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAdd(product)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all ${
                      addedId === product.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-orange hover:bg-brand-orange-hover text-white shadow-md active:scale-95'
                    }`}
                    title="Add to cart"
                  >
                    {addedId === product.id ? (
                      <Check className="w-5 h-5 animate-scale" />
                    ) : (
                      <Plus className="w-5 h-5 font-bold" />
                    )}
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
