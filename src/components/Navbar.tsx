'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  LogIn,
  Building2
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const initialNotifications = [
    {
      id: 'notif-1',
      title: 'New SHG Specials Listed',
      desc: 'Handmade Amla Pickles & cold-pressed mustard oil from Mahila Bachat Gat are now live with direct producer pricing.',
      time: '10m ago',
      category: 'SHG',
      read: true,
      link: '/shop',
    },
    {
      id: 'notif-2',
      title: 'Community Bulk Bachat Active',
      desc: 'Group discount unlocked: Flat 22% off on Organic Cold-Pressed Mustard Oil & Premium Basmati Rice.',
      time: '2h ago',
      category: 'SAVINGS',
      read: true,
      link: '/shop',
    },
    {
      id: 'notif-3',
      title: 'Prosumer Referral Reward',
      desc: 'Earn up to ₹2,000/month by referring neighbors. Share your invite code and grow your community network.',
      time: '1d ago',
      category: 'EARN',
      read: true,
      link: '/refer',
    },
    {
      id: 'notif-4',
      title: 'Smart Chain Ledger Verified',
      desc: 'All community discounts and wallet transactions cryptographically verified on Smart Chain.',
      time: '2d ago',
      category: 'SECURITY',
      read: true,
      link: '/savings',
    },
  ];

  const [notifications, setNotifications] = useState(initialNotifications);

  // Load read state from localStorage
  useEffect(() => {
    try {
      const readIds = localStorage.getItem('mymbmart_read_notifications');
      if (readIds) {
        const parsed: string[] = JSON.parse(readIds);
        setNotifications((prev) =>
          prev.map((n) => (parsed.includes(n.id) ? { ...n, read: true } : n))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(
          'mymbmart_read_notifications',
          JSON.stringify(updated.map((n) => n.id))
        );
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem(
          'mymbmart_read_notifications',
          JSON.stringify(updated.filter((n) => n.read).map((n) => n.id))
        );
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const notifRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setUserDropdown(false);
      }
    };

    if (notificationsOpen || userDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen, userDropdown]);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/shop', label: 'Shop', icon: Store },
    { href: '/savings', label: 'Savings', icon: PiggyBank, badge: 'Soon' },
    { href: '/refer', label: 'Refer & Earn', icon: Users, badge: 'Soon' },
    { href: '/admin', label: 'Admin Hub', icon: Building2, badge: 'Live' },
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
                  className={`relative flex flex-col items-center px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'text-brand-green font-bold bg-brand-mint/60'
                      : 'text-slate-600 hover:text-brand-forest hover:bg-slate-50'
                  }`}
                >
                  {link.badge && (
                    <span className="absolute -top-1.5 -right-0.5 text-[8px] font-black uppercase tracking-wider bg-amber-500 text-white px-1.5 py-0.2 rounded-full shadow-xs">
                      {link.badge}
                    </span>
                  )}
                  <Icon className={`w-4 h-4 mb-0.5 ${active ? 'text-brand-green' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons: Notifications, User Account, Cart */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            
            {/* Notification Bell with Floating Dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                className="p-2 text-slate-600 hover:text-brand-forest hover:bg-brand-mint rounded-full transition relative"
                title="Notifications"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdown(false);
                }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-orange rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {/* Notification Popover Card */}
              {notificationsOpen && (
                <div className="absolute right-0 sm:-right-12 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-emerald-100 py-3 z-50 animate-in fade-in zoom-in duration-150">
                  
                  {/* Header */}
                  <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-mint text-brand-forest flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900">Community Updates</h4>
                      {unreadCount > 0 && (
                        <span className="bg-brand-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-bold text-brand-green hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.map((item) => (
                      <Link
                        key={item.id}
                        href={item.link}
                        onClick={() => {
                          markAsRead(item.id);
                          setNotificationsOpen(false);
                        }}
                        className={`block p-3.5 hover:bg-slate-50 transition relative group ${
                          !item.read ? 'bg-brand-mint/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            item.category === 'SHG' 
                              ? 'bg-emerald-100 text-brand-forest' 
                              : item.category === 'SAVINGS' 
                              ? 'bg-blue-100 text-brand-blue'
                              : item.category === 'EARN'
                              ? 'bg-orange-100 text-brand-orange'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.time}
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-brand-forest transition-colors">
                          {item.title}
                        </h5>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>

                        {!item.read && (
                          <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-brand-orange rounded-full"></span>
                        )}
                      </Link>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 pt-2.5 border-t border-slate-100 text-center">
                    <Link
                      href="/shop"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-brand-forest hover:text-brand-green transition"
                    >
                      Explore Daily Deals & SHG Marketplace →
                    </Link>
                  </div>

                </div>
              )}
            </div>

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
              <div className="relative" ref={userDropdownRef}>
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

                    <Link
                      href="/admin"
                      onClick={() => setUserDropdown(false)}
                      className="w-full text-left px-4 py-2 text-sm text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/70 flex items-center space-x-2 font-bold"
                    >
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>Admin Hub & Checklist</span>
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
                className="flex items-center space-x-1.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-md shadow-orange-500/20 transition active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In / Join</span>
                <span className="sm:hidden">Join</span>
                <span className="text-[8px] font-black uppercase tracking-wider bg-white/25 text-white px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
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
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive(link.href)
                      ? 'text-brand-forest bg-brand-mint font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-brand-green" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
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
