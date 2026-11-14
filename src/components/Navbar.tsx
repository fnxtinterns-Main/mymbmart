'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  ShoppingBag, 
  User, 
  Bell, 
  Search, 
  Menu, 
  X, 
  Sparkles, 
  ChevronDown, 
  Smartphone, 
  Monitor,
  HeartHandshake
} from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface NavbarProps {
  user: UserProfile;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenWithdraw: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobilePreview: boolean;
  setIsMobilePreview: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  onOpenCart,
  onOpenAuth,
  activeTab,
  setActiveTab,
  isMobilePreview,
  setIsMobilePreview,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'savings', label: 'Savings' },
    { id: 'refer', label: 'Refer & Earn' },
    { id: 'producer', label: 'Producer / SHG' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      {/* Top Notification Announcement Bar */}
      <div className="bg-brand-navy text-white text-xs sm:text-sm py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-brand-orange text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Prosumer Revolution
            </span>
            <span className="hidden sm:inline">
              Shop directly from Women Entrepreneurs & SHGs at genuine community discounts!
            </span>
            <span className="sm:hidden truncate">
              Bachat Bhi. Kamai Bhi. Apni Community!
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Mobile / Desktop frame toggle */}
            <button
              onClick={() => setIsMobilePreview(!isMobilePreview)}
              className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition text-slate-200 hover:text-white"
              title="Toggle Mobile App Frame View"
            >
              {isMobilePreview ? (
                <>
                  <Monitor className="w-3.5 h-3.5 text-brand-cyan" />
                  <span className="hidden md:inline">Desktop View</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-brand-orange" />
                  <span className="hidden md:inline">App View Preview</span>
                </>
              )}
            </button>
            <span className="text-slate-300 hidden md:inline">|</span>
            <span className="text-emerald-400 font-semibold hidden md:inline">
              Smart Chain Verified
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="relative w-36 sm:w-48 h-10 sm:h-12">
              <Image
                src="/images/LOgo.jpeg"
                alt="mymbmart.com - My Mega Bachat Mart"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === link.id
                    ? 'text-brand-navy bg-slate-100 font-bold border-b-2 border-brand-navy'
                    : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Icons: Search, Notifications, Cart, User */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Search Button (Quick filter) */}
            <button 
              onClick={() => setActiveTab('shop')}
              className="p-2 text-slate-600 hover:text-brand-navy hover:bg-slate-100 rounded-full transition"
              title="Search groceries & products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                className="p-2 text-slate-600 hover:text-brand-navy hover:bg-slate-100 rounded-full transition"
                title="Notifications"
                onClick={() => alert('Community Alerts: New SHG Winter Pickles listed! Referral reward credited.')}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-orange rounded-full ring-2 ring-white"></span>
              </button>
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-1.5 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange font-bold px-3 py-2 rounded-full transition"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-bold bg-brand-orange text-white w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>

            {/* User Profile / Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 transition"
              >
                <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <div className="font-semibold text-slate-900 truncate max-w-[90px]">{user.name}</div>
                  <div className="text-[10px] text-emerald-600 font-bold">{user.memberId}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      {user.level} Member
                    </span>
                  </div>

                  <button
                    onClick={() => { setActiveTab('savings'); setUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span>My Dashboard & Wallet</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('refer'); setUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span>Refer & Earn</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('producer'); setUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span>Join as SHG / Producer</span>
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => { onOpenAuth(); setUserDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-brand-orange font-medium hover:bg-orange-50"
                    >
                      Switch Account / Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-base font-semibold transition ${
                  activeTab === link.id
                    ? 'text-brand-navy bg-slate-100 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
