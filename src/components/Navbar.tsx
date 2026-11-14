'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home,
  Store,
  PiggyBank,
  Users,
  User as UserIcon,
  ShoppingCart,
  Bell, 
  Search, 
  Menu, 
  X, 
  ChevronDown,
  LogIn
} from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface NavbarProps {
  user?: UserProfile | null;
  isLoggedIn?: boolean;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenWithdraw?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isLoggedIn = false,
  cartCount,
  onOpenCart,
  onOpenAuth,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/shop', label: 'Shop', icon: Store },
    { href: '/savings', label: 'Savings', icon: PiggyBank },
    { href: '/refer', label: 'Refer & Earn', icon: Users },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/shop');
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center space-x-2 shrink-0 group">
            <div className="relative w-32 sm:w-44 h-10 sm:h-12">
              <Image
                src="/images/LOgo.jpeg"
                alt="MEGA BACHAT MART"
                fill
                priority
                className="object-contain object-left group-hover:scale-102 transition-transform"
              />
            </div>
          </Link>

          {/* Center Search Bar (Picture 5 & Blinkit Style) */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md lg:max-w-lg items-center relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for 'rice', 'oil', 'masala', SHG items..."
              className="w-full bg-slate-50 border border-slate-200 hover:border-emerald-400 focus:border-brand-green focus:bg-white text-xs sm:text-sm text-slate-800 rounded-full pl-4 pr-11 py-2 sm:py-2.5 transition-all outline-hidden shadow-2xs"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-green hover:bg-brand-green-hover text-white flex items-center justify-center transition shadow-xs"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Desktop Navigation Links with Icons (Matching Picture 5) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'text-brand-green font-bold bg-brand-mint/60'
                      : 'text-slate-600 hover:text-brand-forest hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-0.5 ${active ? 'text-brand-green' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons: Notifications, User Account, Cart */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            
            {/* Notification Bell */}
            <button 
              className="p-2 text-slate-600 hover:text-brand-forest hover:bg-brand-mint rounded-full transition relative"
              title="Notifications"
              onClick={() => alert('Community Updates: New seasonal SHG specials listed! Enjoy direct producer pricing.')}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-orange rounded-full ring-2 ring-white"></span>
            </button>

            {/* Shopping Cart Button with Red/Orange Badge (Picture 5) */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-1.5 bg-slate-50 hover:bg-brand-mint border border-slate-200 hover:border-emerald-300 text-brand-forest font-bold px-3 py-2 rounded-full transition shadow-2xs"
            >
              <ShoppingCart className="w-5 h-5 text-brand-forest" />
              <span className="text-[11px] font-black bg-brand-orange text-white min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>

            {/* User Profile or Sign In Button */}
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-emerald-300 bg-white transition"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-forest text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left text-xs">
                    <div className="font-semibold text-slate-900 truncate max-w-[80px]">{user.name}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
                </button>

                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <span className="inline-block mt-1 text-[10px] bg-brand-mint text-brand-forest px-2 py-0.5 rounded-full font-semibold">
                        {user.level} Member
                      </span>
                    </div>

                    <Link
                      href="/savings"
                      onClick={() => setUserDropdown(false)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-brand-mint flex items-center space-x-2"
                    >
                      <PiggyBank className="w-4 h-4 text-brand-green" />
                      <span>My Savings & Wallet</span>
                    </Link>

                    <Link
                      href="/refer"
                      onClick={() => setUserDropdown(false)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-brand-mint flex items-center space-x-2"
                    >
                      <Users className="w-4 h-4 text-brand-orange" />
                      <span>Refer & Earn</span>
                    </Link>

                    <Link
                      href="/producer"
                      onClick={() => setUserDropdown(false)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-brand-mint flex items-center space-x-2"
                    >
                      <Store className="w-4 h-4 text-brand-blue" />
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
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-md shadow-orange-500/20 transition active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In / Join</span>
                <span className="sm:hidden">Join</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 'rice', 'oil', 'masala'..."
              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-full pl-4 pr-10 py-2 outline-hidden"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-brand-green text-white flex items-center justify-center"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-100 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive(link.href)
                      ? 'text-brand-forest bg-brand-mint font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 text-brand-green" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/producer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Store className="w-5 h-5 text-brand-blue" />
              <span>Producer / SHG</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
