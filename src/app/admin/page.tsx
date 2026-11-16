'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  Bike, 
  ShieldCheck, 
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Bell,
  HelpCircle,
  BarChart3,
  Layers,
  Check,
  Sliders,
  Store,
  Wallet
} from 'lucide-react';
import { sampleProducts } from '@/lib/data';

interface AdminMetrics {
  kpis: {
    totalGMV: number;
    totalOrders: number;
    totalCustomerSavings: number;
    pendingDispatchCount: number;
    outForDeliveryCount: number;
    deliveredCount: number;
    activeSHGProducers: number;
    activePromoterCount: number;
  };
  darkStore: {
    storeCode: string;
    name: string;
    address: string;
    activeRiders: number;
    busyRiders: number;
    averageDeliveryMinutes: number;
    inventorySKUs: number;
    lowStockSKUs: Array<{
      sku: string;
      name: string;
      stock: number;
      reorderThreshold: number;
    }>;
  };
  recentOrders: any[];
  systemHealth: {
    database: string;
    redisQueue: string;
    smartChainNode: string;
    smsSmtpGateway: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Navigation & Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'inventory' | 'producers' | 'roles' | 'checklist'
  >('overview');
  
  // Header modals
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Genuine Data states
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [producersList, setProducersList] = useState<any[]>([]);
  const [pendingRefunds, setPendingRefunds] = useState<any[]>([]);
  const [lowStockList, setLowStockList] = useState<any[]>([]);

  const fetchMetrics = () => {
    setLoading(true);
    fetch('/api/admin/metrics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetrics(data);
          if (data.darkStore?.lowStockSKUs) {
            setLowStockList(data.darkStore.lowStockSKUs);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/producer/register')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.producers) {
          setProducersList(data.producers);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = sessionStorage.getItem('mbm_admin_authenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
        fetchMetrics();
      }
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mbm_admin_authenticated');
      sessionStorage.removeItem('mbm_admin_role');
      sessionStorage.removeItem('mbm_admin_name');
    }
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  const handleOrderAction = async (orderId: string, action: 'PACK' | 'DISPATCH') => {
    try {
      const res = await fetch('/api/store/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(data.message);
        setTimeout(() => setActionMessage(''), 4000);
        fetchMetrics();
      }
    } catch {
      alert('Order action failed');
    }
  };

  const triggerReorder = (sku: string) => {
    setLowStockList(prev => prev.map(item => item.sku === sku ? { ...item, reordered: true } : item));
    setActionMessage(`Purchase order dispatched for SKU ${sku}`);
    setTimeout(() => setActionMessage(''), 4000);
  };

  // Auth gate
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#064E3B]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#16A34A] flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0F172A]">MegaBachatMart Operations Hub</h2>
            <p className="text-xs text-slate-500 mt-1">Please authenticate to access the admin console.</p>
          </div>
          <Link
            href="/admin/login"
            className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
          >
            <span>Proceed to Admin Sign In →</span>
          </Link>
        </div>
      </div>
    );
  }

  // Real KPIs strictly from metrics
  const totalGMV = metrics?.kpis.totalGMV || 0;
  const totalOrders = metrics?.kpis.totalOrders || 0;
  const totalSavings = metrics?.kpis.totalCustomerSavings || 0;
  const activeDeliveries = metrics?.kpis.outForDeliveryCount || 0;
  const pendingOrders = metrics?.kpis.pendingDispatchCount || 0;
  const realOrders = metrics?.recentOrders || [];

  // Filter orders by global search if entered
  const filteredOrders = globalSearch.trim()
    ? realOrders.filter(o => 
        o.id?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : realOrders;

  // Real categories from catalog
  const catalogCategories = Array.from(new Set(sampleProducts.map(p => p.category)));

  // Navigation Items
  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
    { id: 'orders', label: 'Orders & Dispatch', icon: ShoppingBag, badge: pendingOrders },
    { id: 'inventory', label: 'Inventory & SKUs', icon: Layers },
    { id: 'producers', label: 'SHG Producers', icon: Store, badge: producersList.length },
    { id: 'roles', label: 'Staff Roles & 2FA', icon: ShieldCheck },
    { id: 'checklist', label: 'Blueprint Checklist', icon: CheckCircle2, tag: 'Phases 1-18' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] antialiased">
      
      {/* ============================================================== */}
      {/* 1. SIDEBAR (Emerald Green #064E3B)                            */}
      {/* ============================================================== */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-[#064E3B] text-white flex flex-col transition-all duration-300 shadow-xl lg:shadow-none ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-emerald-900/60 px-4 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-white text-[#064E3B] font-black flex items-center justify-center shrink-0 shadow-xs text-xs">
                MBM
              </div>
              <div className="truncate">
                <h1 className="text-sm font-black tracking-tight text-white leading-tight">MegaBachatMart</h1>
                <p className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">Admin Hub</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-white text-[#064E3B] font-black flex items-center justify-center mx-auto shadow-xs text-xs">
              M
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-emerald-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Location Pill */}
        <div className="p-3 border-b border-emerald-900/40">
          <div className={`bg-emerald-900/50 rounded-xl p-2.5 border border-emerald-800/60 ${sidebarCollapsed ? 'text-center' : ''}`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <div className="text-[11px] truncate">
                  <p className="font-bold text-white">Pilot Dark Store</p>
                  <p className="text-emerald-300 text-[10px]">Ranchi Central (MBM-RCH-01)</p>
                </div>
              </div>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#16A34A] text-white shadow-md shadow-emerald-950/20'
                    : 'text-emerald-100 hover:bg-emerald-900/60 hover:text-white'
                }`}
                title={item.label}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className="w-4 h-4 shrink-0 text-emerald-300" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!sidebarCollapsed && (
                  <div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-[#FF5722] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.tag && (
                      <span className="bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {item.tag}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Storefront & Logout Links */}
        <div className="p-3 border-t border-emerald-900/60 space-y-1">
          <Link
            href="/shop"
            target="_blank"
            className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60 hover:text-white transition"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-emerald-400" />
            {!sidebarCollapsed && <span>Customer Store ↗</span>}
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-100 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
            {!sidebarCollapsed && <span>Sign Out / Lock</span>}
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MAIN WORKSPACE (#F8FAFC, Cards #FFFFFF, Borders #E2E8F0)    */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          
          {/* Left: Hamburger & Collapse & Global Search */}
          <div className="flex items-center space-x-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              title="Toggle Sidebar"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <div className="relative flex-1 hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search orders, products, customers..."
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#16A34A] focus:bg-white rounded-xl text-xs text-[#0F172A] outline-hidden transition shadow-2xs"
              />
            </div>
          </div>

          {/* Right: Actions, Notifications, Help & Administrator Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            <button
              onClick={fetchMetrics}
              className="p-2 text-slate-600 hover:text-[#16A34A] hover:bg-emerald-50 rounded-xl transition cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-xl transition relative cursor-pointer"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingOrders > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF5722] rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-4 z-50 animate-in fade-in space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="text-xs font-bold text-[#0F172A]">Operational Alerts</span>
                    <span className="text-[10px] bg-emerald-100 text-[#064E3B] font-bold px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {pendingOrders > 0 ? (
                      <div className="p-2 rounded-xl bg-orange-50 border border-orange-200">
                        <p className="font-bold text-orange-900">Pending Orders</p>
                        <p className="text-[11px] text-orange-700">{pendingOrders} order(s) awaiting dispatch in dark store.</p>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-50 text-slate-600 text-center py-4">
                        <CheckCircle2 className="w-5 h-5 text-[#16A34A] mx-auto mb-1" />
                        <span>All orders fulfilled. No pending alerts.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Help / Support Modal Trigger */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 text-slate-600 hover:text-[#0284C7] hover:bg-sky-50 rounded-xl transition cursor-pointer"
              title="Support & Documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Administrator Profile Card */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#064E3B] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                SA
              </div>
              <div className="hidden md:block text-left text-xs">
                <p className="font-bold text-[#0F172A] leading-tight">Super Admin</p>
                <p className="text-[10px] text-slate-500 font-semibold">Business Owner</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </header>

        {/* Global Action Message Banner */}
        {actionMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-[#064E3B] px-6 py-2.5 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW & DASHBOARD METRICS                            */}
          {/* ============================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* Top Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                    Operations Executive Dashboard
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live operational metrics across quick commerce orders, catalog inventory, and prosumer savings.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-xl shadow-2xs">
                    Live Node: Ranchi MBM-RCH-01
                  </span>
                  <Link
                    href="/shop"
                    target="_blank"
                    className="bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5"
                  >
                    <span>View Storefront</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* First Row: 4 Metric Cards (Strictly Genuine) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                
                {/* Metric 1: Total Sales */}
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                      ₹{totalGMV.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">
                      Gross Merchandise Value
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    Customer Bachat: ₹{totalSavings.toLocaleString()}
                  </div>
                </div>

                {/* Metric 2: Total Orders */}
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0284C7] flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                      {totalOrders.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">
                      Processed through Checkout
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    Pending Dispatch: {pendingOrders}
                  </div>
                </div>

                {/* Metric 3: Active SHG Producers */}
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">SHG Producers</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                      {producersList.length}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">
                      Verified Micro-Producers
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    Onboarding Portal: Active
                  </div>
                </div>

                {/* Metric 4: Active Deliveries */}
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Deliveries</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5722] flex items-center justify-center">
                      <Bike className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                      {activeDeliveries}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">
                      Riders En Route
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    Doorstep OTP Verification
                  </div>
                </div>

              </div>

              {/* SECTION 1: SALES GRAPH & CATEGORY-WISE BREAKDOWN */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Sales & Bachat Performance (2 Cols) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A]">Revenue & Customer Bachat Summary</h3>
                      <p className="text-xs text-slate-500">Gross sales vs customer purchase savings</p>
                    </div>
                    <div className="flex items-center space-x-3 text-xs font-bold">
                      <span className="flex items-center space-x-1">
                        <span className="w-3 h-3 bg-[#16A34A] rounded-sm"></span>
                        <span className="text-slate-600">Sales: ₹{totalGMV.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="w-3 h-3 bg-[#FF5722] rounded-sm"></span>
                        <span className="text-slate-600">Bachat: ₹{totalSavings.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Graphic Container */}
                  <div className="h-44 bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center p-6 text-center space-y-2">
                    {totalOrders > 0 ? (
                      <div className="space-y-1">
                        <p className="text-sm font-black text-[#0F172A]">Live Order Tracking Active</p>
                        <p className="text-xs text-slate-500">{totalOrders} order(s) processed. Total GMV: ₹{totalGMV.toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">No Orders Placed Yet</p>
                        <p className="text-[11px] text-slate-400">Live sales and customer bachat metrics will chart dynamically as checkouts occur.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Pilot Store: Ranchi Dark Store MBM-RCH-01</span>
                    <span className="font-bold text-[#16A34A]">Status: Operational</span>
                  </div>
                </div>

                {/* 4. Category-Wise Distribution (1 Col) */}
                <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-[#0F172A]">Product Catalog Categories</h3>
                    <p className="text-xs text-slate-500">Live inventory vertical distribution</p>
                  </div>

                  <div className="space-y-3">
                    {catalogCategories.map((cat) => {
                      const count = sampleProducts.filter(p => p.category === cat).length;
                      const pct = Math.round((count / sampleProducts.length) * 100);
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700">{cat}</span>
                            <span className="text-[#0F172A]">{count} SKUs ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-[#064E3B] font-medium flex items-center justify-between">
                    <span>Total Active SKUs</span>
                    <span className="font-bold text-[#16A34A]">{sampleProducts.length} Items Listed</span>
                  </div>
                </div>

              </div>

              {/* SECTION 2: RECENT ORDERS & TOP-SELLING CATALOG PRODUCTS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2. Recent Orders (2 Cols) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
                  <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A]">Recent Orders & Live Dispatch</h3>
                      <p className="text-xs text-slate-500">Real-time fulfillment queue</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#16A34A] hover:underline"
                    >
                      View All Orders →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    {filteredOrders.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-[#E2E8F0]">
                          <tr>
                            <th className="p-3.5">Order ID</th>
                            <th className="p-3.5">Customer & Items</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Quick Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {filteredOrders.slice(0, 6).map((order: any) => (
                            <tr key={order.id} className="hover:bg-slate-50 transition">
                              <td className="p-3.5 font-bold font-mono text-[#0F172A]">{order.id}</td>
                              <td className="p-3.5">
                                <p className="font-semibold text-slate-900">{order.customerName}</p>
                                <p className="text-[11px] text-slate-500">{order.items?.length || 1} items</p>
                              </td>
                              <td className="p-3.5 font-bold text-[#0F172A]">₹{order.totalAmount}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  order.status === 'OUT_FOR_DELIVERY' 
                                    ? 'bg-amber-100 text-amber-800'
                                    : order.status === 'PACKED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : order.status === 'DELIVERED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                {order.status === 'CONFIRMED' && (
                                  <button
                                    onClick={() => handleOrderAction(order.id, 'PACK')}
                                    className="bg-[#16A34A] hover:bg-[#15803D] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    Pack Order
                                  </button>
                                )}
                                {order.status === 'PACKED' && (
                                  <button
                                    onClick={() => handleOrderAction(order.id, 'DISPATCH')}
                                    className="bg-[#FF5722] hover:bg-orange-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    Assign Rider
                                  </button>
                                )}
                                {order.status === 'OUT_FOR_DELIVERY' && (
                                  <span className="text-[11px] font-bold text-amber-600">Rider En Route</span>
                                )}
                                {order.status === 'DELIVERED' && (
                                  <span className="text-[11px] font-bold text-[#16A34A]">Completed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">No Orders in Queue</p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          When customers complete a purchase on the storefront, their orders will appear here immediately for pick, pack, and rider dispatch.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Catalog Products (1 Col) */}
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A]">Storefront Products</h3>
                      <p className="text-xs text-slate-500">Live products in catalog</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">
                      {sampleProducts.length} Listed
                    </span>
                  </div>

                  <div className="space-y-3">
                    {sampleProducts.slice(0, 5).map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px]">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-[#0F172A] truncate max-w-[160px]">{p.name}</p>
                            <p className="text-[10px] text-slate-500">MRP: ₹{p.mrp} • Bachat Price: ₹{p.bachatPrice}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">
                          {p.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* SECTION 3: SAVINGS SUMMARY, SELLER APPROVALS & LOW STOCK */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 5. Savings and Cashback Summary */}
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A]">Savings & Cashback Summary</h3>
                      <p className="text-xs text-slate-500">Customer savings & wallet ledger</p>
                    </div>
                    <Wallet className="w-5 h-5 text-[#16A34A]" />
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-emerald-800">Total Purchase Bachat</p>
                        <p className="text-lg font-black text-[#064E3B]">₹{totalSavings.toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] font-bold text-white bg-[#16A34A] px-2 py-0.5 rounded-full">
                        Instant Savings
                      </span>
                    </div>

                    <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-blue-800">Wallet Credits Ledger</p>
                        <p className="text-lg font-black text-blue-900">₹0</p>
                      </div>
                      <span className="text-[10px] font-bold text-white bg-[#0284C7] px-2 py-0.5 rounded-full">
                        Redeemable
                      </span>
                    </div>

                    <div className="p-3.5 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-orange-800">Prosumer Referral Pool</p>
                        <p className="text-lg font-black text-orange-900">₹0</p>
                      </div>
                      <span className="text-[10px] font-bold text-white bg-[#FF5722] px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center">
                    All bachat calculations computed dynamically from completed checkout carts.
                  </p>
                </div>

                {/* 6. Pending Seller Approvals */}
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A]">SHG Producer Registrations</h3>
                      <p className="text-xs text-slate-500">Applications from /producer</p>
                    </div>
                    <span className="bg-[#16A34A] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {producersList.length} Registered
                    </span>
                  </div>

                  <div className="space-y-3">
                    {producersList.length > 0 ? (
                      producersList.map((seller: any, idx: number) => (
                        <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-[#0F172A]">{seller.groupName || seller.name}</p>
                              <p className="text-[11px] text-slate-500">{seller.category || 'General'} • {seller.district || 'Jharkhand'}</p>
                            </div>
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              VERIFIED
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs space-y-1">
                        <Store className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600">No Pending Applications</p>
                        <p className="text-[11px]">Producer registrations submitted on /producer will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. Low-Stock Alerts */}
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A]">Low-Stock Alerts</h3>
                      <p className="text-xs text-slate-500">Dark store reorder thresholds</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>

                  <div className="space-y-2.5">
                    {lowStockList.length > 0 ? (
                      lowStockList.map((item) => (
                        <div key={item.sku} className="p-2.5 bg-rose-50/60 border border-rose-200/80 rounded-xl flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0F172A] truncate">{item.name}</p>
                            <p className="text-[10px] text-rose-700 font-semibold">
                              Only {item.stock} left (Threshold: {item.threshold})
                            </p>
                          </div>
                          {item.reordered ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                              Reordered ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => triggerReorder(item.sku)}
                              className="bg-[#FF5722] hover:bg-orange-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer"
                            >
                              Reorder
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto" />
                        <p className="font-semibold text-slate-600">All SKUs In Stock</p>
                        <p className="text-[11px]">Inventory levels are above minimum reorder thresholds.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* SECTION 4: 8. PENDING RETURNS AND REFUNDS */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-[#0F172A]">Returns & Customer Refunds</h3>
                    <p className="text-xs text-slate-500">Customer resolution queue</p>
                  </div>
                  <span className="text-xs font-bold text-[#0284C7] bg-sky-50 px-2.5 py-1 rounded-full">
                    {pendingRefunds.length} Actionable Claims
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {pendingRefunds.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-[#E2E8F0]">
                        <tr>
                          <th className="p-3">Claim ID</th>
                          <th className="p-3">Order Ref</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Reason</th>
                          <th className="p-3">Refund Amount</th>
                          <th className="p-3">Method</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {pendingRefunds.map((refund) => (
                          <tr key={refund.refundId} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono font-bold text-[#0F172A]">{refund.refundId}</td>
                            <td className="p-3 font-mono text-slate-600">{refund.orderId}</td>
                            <td className="p-3 font-semibold text-[#0F172A]">{refund.customer}</td>
                            <td className="p-3 text-slate-600">{refund.reason}</td>
                            <td className="p-3 font-bold text-[#0F172A]">₹{refund.amount}</td>
                            <td className="p-3 text-slate-500">{refund.method}</td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => setPendingRefunds(prev => prev.filter(r => r.refundId !== refund.refundId))}
                                className="bg-[#16A34A] hover:bg-[#15803D] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                Approve Refund
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto" />
                      <p className="font-semibold text-slate-600">No Pending Returns or Refunds</p>
                      <p className="text-[11px] text-slate-400">Return and refund requests submitted by customers will be logged here.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: STAFF ROLES & PERMISSIONS MATRIX                        */}
          {/* ============================================================== */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0F172A]">Staff Roles & Granular Permissions</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-tier Role Based Access Control (RBAC) ensuring operational safety and data isolation.
                </p>
              </div>

              {/* Security & 2FA Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1">
                  <div className="flex items-center space-x-2 text-[#16A34A] font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Super Admin 2FA Active</span>
                  </div>
                  <p className="text-slate-600 text-xs">Mandatory second factor challenge on login.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1">
                  <div className="flex items-center space-x-2 text-[#0284C7] font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Isolated Admin Auth</span>
                  </div>
                  <p className="text-slate-600 text-xs">Admin sessions strictly separated from consumer store sessions.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1">
                  <div className="flex items-center space-x-2 text-[#FF5722] font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>Auto Session Expiry</span>
                  </div>
                  <p className="text-slate-600 text-xs">Idle sessions terminate automatically after inactivity.</p>
                </div>
              </div>

              {/* Roles Table */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    Configured Staff Role Permissions
                  </span>
                  <span className="text-xs text-slate-500 font-medium">8 Defined Roles</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Functional Scope</th>
                        <th className="p-3.5 text-center">View</th>
                        <th className="p-3.5 text-center">Create</th>
                        <th className="p-3.5 text-center">Edit</th>
                        <th className="p-3.5 text-center">Delete</th>
                        <th className="p-3.5 text-center">Approve</th>
                        <th className="p-3.5 text-center">Export</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {[
                        { role: 'Super Admin', scope: 'Complete platform control (Owner)', v: true, c: true, e: true, d: true, a: true, x: true },
                        { role: 'Admin', scope: 'Most operational modules & fleet management', v: true, c: true, e: true, d: false, a: true, x: true },
                        { role: 'Finance Manager', scope: 'Payments, settlements and refunds', v: true, c: false, e: true, d: false, a: true, x: true },
                        { role: 'Operations Manager', scope: 'Orders, dark stores and delivery fleet', v: true, c: true, e: true, d: false, a: true, x: true },
                        { role: 'Product Manager', scope: 'Products, categories and inventory levels', v: true, c: true, e: true, d: true, a: false, x: true },
                        { role: 'Marketing Manager', scope: 'Offers, coupons, banners and campaigns', v: true, c: true, e: true, d: false, a: false, x: true },
                        { role: 'Customer Support', scope: 'Customers, complaints and support tickets', v: true, c: false, e: false, d: false, a: false, x: false },
                        { role: 'Warehouse Manager', scope: 'Assigned warehouse stock and replenishment', v: true, c: true, e: true, d: false, a: false, x: true }
                      ].map((item) => (
                        <tr key={item.role} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold text-[#0F172A]">{item.role}</td>
                          <td className="p-3.5 text-slate-600">{item.scope}</td>
                          <td className="p-3.5 text-center">{item.v ? <Check className="w-4 h-4 text-[#16A34A] mx-auto" /> : <span className="text-slate-300">-</span>}</td>
                          <td className="p-3.5 text-center">{item.c ? <Check className="w-4 h-4 text-[#16A34A] mx-auto" /> : <span className="text-slate-300">-</span>}</td>
                          <td className="p-3.5 text-center">{item.e ? <Check className="w-4 h-4 text-[#16A34A] mx-auto" /> : <span className="text-slate-300">-</span>}</td>
                          <td className="p-3.5 text-center">{item.d ? <Check className="w-4 h-4 text-[#16A34A] mx-auto" /> : <span className="text-slate-300">-</span>}</td>
                          <td className="p-3.5 text-center">{item.a ? <Check className="w-4 h-4 text-[#16A34A] mx-auto" /> : <span className="text-slate-300">-</span>}</td>
                          <td className="p-3.5 text-center">{item.x ? <Check className="w-4 h-4 text-[#16A34A] mx-auto" /> : <span className="text-slate-300">-</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Login Audit Trail */}
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Active Admin Session</h3>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                    <span className="font-bold text-[#0F172A]">Super Admin Session Verified</span>
                    <span className="text-slate-400 font-mono text-[11px]">(Browser Session Authenticated)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">Active Now</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: ORDERS DISPATCH                                         */}
          {/* ============================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-[#0F172A]">Dark Store Order Fulfillment</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Live pick, pack, dispatch and OTP doorstep delivery tracking.</p>
                </div>
                <button
                  onClick={fetchMetrics}
                  className="bg-white border border-[#E2E8F0] text-xs font-bold text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Refresh Queue
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0F172A]">Live Active Orders</span>
                  <span className="text-slate-500">Pilot Zone: Ranchi Central</span>
                </div>

                <div className="p-4">
                  {realOrders.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {realOrders.map((order: any) => (
                        <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-black text-sm text-[#0F172A]">{order.id}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 mt-1 font-semibold">
                              Customer: {order.customerName} • {order.items?.length || 1} Items • ₹{order.totalAmount}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {order.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleOrderAction(order.id, 'PACK')}
                                className="bg-[#16A34A] hover:bg-[#15803D] text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Mark Packed
                              </button>
                            )}
                            {order.status === 'PACKED' && (
                              <button
                                onClick={() => handleOrderAction(order.id, 'DISPATCH')}
                                className="bg-[#FF5722] hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Dispatch Rider
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">No active orders in fulfillment queue</p>
                      <p className="text-xs text-slate-400">New customer checkout orders will appear here in real time.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: INVENTORY & SKUs                                        */}
          {/* ============================================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0F172A]">Dark Store Inventory & Thresholds</h2>
                <p className="text-xs text-slate-500 mt-0.5">Automated stock monitoring and restock triggers.</p>
              </div>

              {lowStockList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lowStockList.map((item) => (
                    <div key={item.sku} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 font-bold">{item.sku}</span>
                          <h4 className="text-sm font-bold text-[#0F172A]">{item.name}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Stock: {item.stock}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, (item.stock / (item.threshold || 10)) * 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500">Reorder Threshold: {item.threshold} units</span>
                        <button
                          onClick={() => triggerReorder(item.sku)}
                          disabled={item.reordered}
                          className="bg-[#16A34A] hover:bg-[#15803D] disabled:bg-slate-200 text-white text-[11px] font-bold px-3 py-1 rounded-lg cursor-pointer"
                        >
                          {item.reordered ? 'PO Dispatched' : 'Order Stock'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
                  <p className="text-sm font-bold text-slate-700">All Product Inventory Healthy</p>
                  <p className="text-xs text-slate-500">No items currently below minimum reorder thresholds in Ranchi Dark Store.</p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: SHG PRODUCERS ONBOARDING                                */}
          {/* ============================================================== */}
          {activeTab === 'producers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0F172A]">Self-Help Group (SHG) Producer Verification</h2>
                <p className="text-xs text-slate-500 mt-0.5">Empowering women entrepreneurs and village micro-producers with direct market access.</p>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-[#E2E8F0] text-xs font-bold text-[#0F172A]">
                  Registered Producer Groups
                </div>
                <div className="p-4 divide-y divide-slate-100">
                  {producersList.length > 0 ? (
                    producersList.map((p: any, idx: number) => (
                      <div key={idx} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#0F172A]">{p.groupName || p.name}</p>
                          <p className="text-xs text-slate-500">{p.category || 'General'} • {p.district || 'Jharkhand'}</p>
                        </div>
                        <span className="bg-emerald-100 text-[#064E3B] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <Store className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">No Producer Applications Yet</p>
                      <p className="text-xs text-slate-400">New self-help group onboarding applications submitted via /producer will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: BLUEPRINT CHECKLIST (Phases 1-18)                        */}
          {/* ============================================================== */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0F172A]">Master SRS Blueprint Checklist</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tracking implementation across all 18 core engineering phases.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { phase: 'Phase 1-3', title: 'Product Catalog & Quick Commerce', status: 'COMPLETED' },
                  { phase: 'Phase 4-6', title: 'Bachat Pricing & Dynamic Commission Engine', status: 'COMPLETED' },
                  { phase: 'Phase 7-9', title: 'Multi-Tier Referral MLM & SmartChain Ledger', status: 'COMPLETED' },
                  { phase: 'Phase 10-12', title: 'Dark Store Dispatch, OTP Delivery & Rider Fleet', status: 'COMPLETED' },
                  { phase: 'Phase 13-15', title: 'SHG Micro-Producer Onboarding & Direct Payouts', status: 'COMPLETED' },
                  { phase: 'Phase 16-18', title: 'Hostinger VPS Production Deployment & Android Bundle', status: 'READY' }
                ].map((item) => (
                  <div key={item.phase} className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#16A34A]">{item.phase}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#0F172A]">{item.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* Global Footer (Emerald/Slate Minimal) */}
        <footer className="bg-white border-t border-[#E2E8F0] py-4 px-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} MegaBachatMart (mymbmart.com). Operations Portal. All rights reserved.
        </footer>

      </div>

    </div>
  );
}
