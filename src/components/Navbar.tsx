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
  ShoppingCart,
  Bell, 
  Search, 
  Menu, 
  X, 
  ChevronDown,
  LogIn,
  LogOut,
  Building2,
  Package,
  User
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { getStoredUserSession, clearUserSession } from '@/lib/userSession';

interface NavbarProps {
  user?: UserProfile | null;
  isLoggedIn?: boolean;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenAuth?: () => void;
  onOpenWithdraw?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isLoggedIn = false,
  cartCount = 0,
  onOpenCart,
  onOpenAuth,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Internal active session state with automatic hydration fallback
  const [activeUser, setActiveUser] = useState<UserProfile | null>(user || null);
  const [activeIsLoggedIn, setActiveIsLoggedIn] = useState<boolean>(Boolean(isLoggedIn && user));

  useEffect(() => {
    if (isLoggedIn && user) {
      setActiveUser(user);
      setActiveIsLoggedIn(true);
      return;
    }

    // Auto-hydrate from cookie or localStorage across all pages
    const session = getStoredUserSession();
    if (session.isLoggedIn && session.user) {
      setActiveUser(session.user);
      setActiveIsLoggedIn(true);
    } else {
      setActiveUser(user || null);
      setActiveIsLoggedIn(Boolean(isLoggedIn && user));
    }
  }, [user, isLoggedIn]);

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
    { href: '/savings', label: 'Savings', icon: PiggyBank },
    { href: '/refer', label: 'Refer & Earn', icon: Users },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event('mbm_nav_start'));
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
    <header className="sticky top-0 z-[70] bg-white/95 backdrop-blur-md border-b-[1px] border-emerald-100/80 shadow-xs w-full max-w-full overflow-visible">
      <div className="w-[100%] max-w-[100%] px-[3%] sm:px-[5%]">
        <div className="flex items-center justify-between h-[4rem] sm:h-[5rem] lg:h-[5.5rem] gap-[0.5rem] sm:gap-[1rem] lg:gap-[1.5rem] min-w-0">
          
          {/* Logo & Brand Identity in Left Corner */}
          <Link href="/" className="flex items-center space-x-[0.5rem] shrink-0 group" aria-label="MegaBachatMart Home">
            <div className="relative w-[9.5rem] sm:w-[13.5rem] md:w-[16rem] lg:w-[19rem] h-[2.5rem] sm:h-[3.25rem] md:h-[3.75rem]">
              <Image
                src="/images/LOgo.jpeg"
                alt="MegaBachatMart"
                fill
                priority
                className="object-contain object-left group-hover:scale-102 transition-transform"
              />
            </div>
          </Link>

          {/* Center Search Bar (Blinkit Style) */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md lg:max-w-lg xl:max-w-xl min-w-0 items-center relative mx-2 lg:mx-4"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for Rice, Oil, Dal, Masala..."
              className="w-full bg-slate-50 border border-slate-200 hover:border-emerald-400 focus:border-brand-green focus:bg-white text-xs sm:text-sm text-slate-800 rounded-full pl-4 pr-11 py-2 sm:py-2.5 transition-all outline-hidden shadow-2xs placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-green hover:bg-brand-green-hover text-white flex items-center justify-center transition shadow-xs cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Section: Navigation Links & Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all ${
                      active
                        ? 'text-brand-green font-bold bg-brand-mint/60'
                        : 'text-slate-600 hover:text-brand-forest hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-brand-green' : 'text-slate-500'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="h-6 w-px bg-slate-200 hidden lg:block mx-1" aria-hidden="true" />
            
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
                <div className="absolute right-0 sm:-right-12 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-emerald-100 py-3 z-[80] animate-in fade-in zoom-in duration-150">
                  
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
              onClick={onOpenCart || (() => router.push('/shop'))}
              data-testid="cart-button"
              className="relative flex items-center space-x-1.5 bg-slate-50 hover:bg-brand-mint border border-slate-200 hover:border-emerald-300 text-brand-forest font-bold px-3 py-2 rounded-full transition shadow-2xs"
            >
              <ShoppingCart className="w-5 h-5 text-brand-forest" />
              <span className="text-[11px] font-black bg-brand-orange text-white min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            </button>

            {/* User Profile or Sign In Button */}
            {activeIsLoggedIn && activeUser ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  data-testid="user-menu"
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-emerald-300 bg-white transition"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-forest text-white flex items-center justify-center text-xs font-bold">
                    {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div className="hidden md:block text-left text-xs">
                    <div className="font-semibold text-slate-900 truncate max-w-[80px]">{activeUser.name}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" />
                </button>

                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[80]">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900">{activeUser.name}</p>
                      <span className="inline-block mt-1 text-[10px] bg-brand-mint text-brand-forest px-2 py-0.5 rounded-full font-semibold">
                        {activeUser.level || 'Silver'} Member
                      </span>
                    </div>

                    {[
                      { href: '/profile', label: 'My Profile & Location', icon: User, iconClass: 'text-[#064E3B]' },
                      { href: '/orders', label: 'My Orders & History', icon: Package, iconClass: 'text-emerald-600' },
                      { href: '/savings', label: 'My Savings & Wallet', icon: PiggyBank, iconClass: 'text-brand-green' },
                      { href: '/refer', label: 'Refer & Earn', icon: Users, iconClass: 'text-brand-orange' },
                      { href: '/producer', label: 'Join as SHG / Producer', icon: Store, iconClass: 'text-brand-blue' },
                      { href: '/shop/register', label: 'Partner as Local Shop', icon: Building2, iconClass: 'text-emerald-700' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserDropdown(false)}
                          aria-current={active ? 'page' : undefined}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition ${
                            active
                              ? 'bg-brand-mint text-brand-forest font-bold border-l-4 border-brand-green'
                              : 'text-slate-700 hover:bg-brand-mint font-medium'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${item.iconClass}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}

                    <div className="border-t border-slate-100 mt-1 pt-1 space-y-1">
                      <button
                        onClick={() => { if (onOpenAuth) { onOpenAuth(); } else { router.push('/login'); } setUserDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-600 font-medium hover:bg-slate-50 flex items-center space-x-2"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Switch Account</span>
                      </button>
                      <button
                        onClick={() => {
                          clearUserSession();
                          setActiveUser(null);
                          setActiveIsLoggedIn(false);
                          setUserDropdown(false);
                          window.location.reload();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 font-medium hover:bg-rose-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth || (() => router.push('/login'))}
                data-testid="signin-button"
                className="flex items-center space-x-1.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In / Join</span>
                <span className="sm:hidden">Sign In</span>
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
              placeholder="Search Rice, Oil, Dal, Masala..."
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
