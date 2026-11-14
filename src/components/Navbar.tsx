'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingBag, 
  Bell, 
  Search, 
  Menu, 
  X, 
  ChevronDown 
} from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface NavbarProps {
  user: UserProfile;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenWithdraw?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  onOpenCart,
  onOpenAuth,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/savings', label: 'Savings' },
    { href: '/refer', label: 'Refer & Earn' },
    { href: '/producer', label: 'Producer / SHG' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      {/* Main Navbar (Top banner removed as requested) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 cursor-pointer">
            <div className="relative w-36 sm:w-48 h-10 sm:h-12">
              <Image
                src="/images/LOgo.jpeg"
                alt="mymbmart.com - My Mega Bachat Mart"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive(link.href)
                    ? 'text-brand-navy bg-slate-100 font-bold border-b-2 border-brand-navy'
                    : 'text-slate-600 hover:text-brand-navy hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons: Search, Notifications, Cart, User */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Search Button */}
            <Link 
              href="/shop"
              className="p-2 text-slate-600 hover:text-brand-navy hover:bg-slate-100 rounded-full transition"
              title="Search groceries & products"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                className="p-2 text-slate-600 hover:text-brand-navy hover:bg-slate-100 rounded-full transition"
                title="Notifications"
                onClick={() => alert('Community Alerts: New SHG Winter specials listed! Your referral rewards are active.')}
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

                  <Link
                    href="/savings"
                    onClick={() => setUserDropdown(false)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span>My Dashboard & Wallet</span>
                  </Link>

                  <Link
                    href="/refer"
                    onClick={() => setUserDropdown(false)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span>Refer & Earn</span>
                  </Link>

                  <Link
                    href="/producer"
                    onClick={() => setUserDropdown(false)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <span>Join as SHG / Producer</span>
                  </Link>

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
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-base font-semibold transition ${
                  isActive(link.href)
                    ? 'text-brand-navy bg-slate-100 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
