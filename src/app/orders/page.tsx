'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { OrderTrackingModal } from '@/components/OrderTrackingModal';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/AuthModal';
import { getStoredUserSession } from '@/lib/userSession';
import { OrderRecord } from '@/lib/ordersStore';
import { UserProfile, CartItem } from '@/lib/types';
import { 
  Package, 
  MapPin, 
  CreditCard, 
  PiggyBank, 
  ArrowRight, 
  ShoppingBag, 
  Zap, 
  KeyRound
} from 'lucide-react';

export default function CustomerOrdersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'payments' | 'savings'>('orders');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedAddresses] = useState<Array<{ id: string; label: string; address: string; isDefault: boolean }>>([
    {
      id: 'addr-default',
      label: 'Home (Default)',
      address: 'Main Road, Ranchi Central, Jharkhand - 834001',
      isDefault: true,
    },
  ]);

  useEffect(() => {
    // 1. Hydrate user session
    const session = getStoredUserSession();
    if (session.user) {
      setUser(session.user);
    }

    // 2. Hydrate cart
    try {
      const savedCart = localStorage.getItem('mymbmart_cart');
      if (savedCart) setCartItems(JSON.parse(savedCart));
    } catch {}

    // 3. Hydrate placed orders from local storage
    let localOrders: OrderRecord[] = [];
    try {
      const stored = localStorage.getItem('mymbmart_placed_orders');
      if (stored) {
        localOrders = JSON.parse(stored);
      }
    } catch {}

    // 4. Fetch server orders and merge
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          const map = new Map<string, OrderRecord>();
          for (const lo of localOrders) map.set(lo.orderNumber || lo.id, lo);
          for (const so of data.orders) {
            const key = so.orderNumber || so.id;
            map.set(key, { ...(map.get(key) || {}), ...so });
          }
          setOrders(Array.from(map.values()));
        } else {
          setOrders(localOrders);
        }
      })
      .catch(() => {
        setOrders(localOrders);
      });
  }, []);

  // 5. Auto-poll server for live status updates if there are active fulfillment orders
  useEffect(() => {
    const hasActiveOrders = orders.some((o) =>
      ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'ASSIGNED_TO_RIDER'].includes(o.status)
    );
    if (!hasActiveOrders) return;

    const interval = setInterval(() => {
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.orders)) {
            setOrders((prev) => {
              const map = new Map<string, OrderRecord>();
              for (const o of prev) map.set(o.orderNumber || o.id, o);
              for (const so of data.orders) {
                const key = so.orderNumber || so.id;
                const existing = map.get(key);
                map.set(key, { ...existing, ...so });
              }
              return Array.from(map.values());
            });

            if (selectedOrder) {
              const updatedSelected = data.orders.find(
                (so: OrderRecord) => so.id === selectedOrder.id || so.orderNumber === selectedOrder.orderNumber
              );
              if (updatedSelected && updatedSelected.status !== selectedOrder.status) {
                setSelectedOrder((prev) => (prev ? { ...prev, ...updatedSelected } : null));
              }
            }
          }
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [orders, selectedOrder]);

  const handleOpenTracking = (order: OrderRecord) => {
    setSelectedOrder(order);
    setIsTrackingOpen(true);
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel order #${orderNumber}? Any paid amount will be refunded to your wallet balance.`)) {
      return;
    }
    try {
      const targetOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderNumber);
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          reason: 'Customer cancelled from orders page',
          otp: targetOrder?.deliveryOtp || targetOrder?.pickupDetails?.pickupOtp,
          phone: targetOrder?.userPhone || (targetOrder as any)?.customerPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Order cancelled successfully.');
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId || o.orderNumber === orderNumber ? { ...o, status: 'CANCELLED' } : o))
        );
      } else {
        alert(data.message || 'Unable to cancel this order.');
      }
    } catch {
      alert('Network error while cancelling order.');
    }
  };

  const handleOrderUpdated = (updated: OrderRecord) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updated.id || o.orderNumber === updated.orderNumber ? updated : o))
    );
    // Sync back to local storage
    try {
      const stored = JSON.parse(localStorage.getItem('mymbmart_placed_orders') || '[]');
      const updatedList = stored.map((o: any) =>
        o.id === updated.id || o.orderNumber === updated.orderNumber ? updated : o
      );
      localStorage.setItem('mymbmart_placed_orders', JSON.stringify(updatedList));
    } catch {}
  };

  const totalSavedAcrossOrders = orders.reduce((acc, o) => acc + (o.shoppingSavings || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-orange selection:text-white">
      <Navbar
        user={user}
        isLoggedIn={Boolean(user)}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Customer Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white font-black text-xl flex items-center justify-center shadow-md">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {user?.name || 'Aviraj Kumar'}
                </h1>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {user?.level || 'Silver'} Member
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                <span>Member ID: <b>{user?.memberId || 'MBM-MEM-01'}</b></span>
                {user?.email && <span>• {user.email}</span>}
                {user?.phone && <span>• {user.phone}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link
              href="/shop"
              className="flex-1 sm:flex-none bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop More</span>
            </Link>
            <Link
              href="/savings"
              className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              <span>Wallet & Savings</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer shrink-0 ${
              activeTab === 'orders'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer shrink-0 ${
              activeTab === 'addresses'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Address Book</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer shrink-0 ${
              activeTab === 'payments'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Methods</span>
          </button>

          <button
            onClick={() => setActiveTab('savings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer shrink-0 ${
              activeTab === 'savings'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            <span>Total Bachat & Savings</span>
          </button>
        </div>

        {/* TAB 1: MY ORDERS & ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No Orders Placed Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Your grocery staples, SHG specials, and cold-pressed items will appear here as soon as you place an order.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-6 rounded-xl transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explore Catalog & Start Shopping</span>
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const statusColor = 
                  order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                  order.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                  order.status === 'PACKED' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                  'bg-orange-50 text-orange-800 border-orange-300';

                return (
                  <div
                    key={order.id || order.orderNumber}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition space-y-4 p-5 sm:p-6"
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black text-slate-900 font-mono">
                            Order #{order.orderNumber}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${statusColor}`}>
                            {order.status || 'PLACED'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Placed on: {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not Available'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {order.deliveryOtp && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 flex items-center space-x-1.5 text-xs text-amber-900 font-bold">
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            <span>Doorstep OTP: <b className="font-mono text-amber-950 text-sm">{order.deliveryOtp}</b></span>
                          </div>
                        )}

                        <button
                          onClick={() => handleOpenTracking(order)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>Track Live Status</span>
                        </button>

                        {(order.status === 'PLACED' || order.status === 'PROCESSING') && (
                          <button
                            onClick={() => handleCancelOrder(order.id, order.orderNumber)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Ordered Items ({order.items?.length || 0})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            {item.image && (
                              <div className="w-12 h-12 rounded-xl bg-white overflow-hidden relative shrink-0 border border-slate-200">
                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                              <p className="text-[11px] text-slate-500">
                                Qty: <b>{item.quantity}</b> × ₹{item.unitPrice}
                              </p>
                            </div>
                            <span className="text-xs font-black text-slate-900 shrink-0">
                              ₹{item.quantity * item.unitPrice}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary & Delivery Details */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-md">{order.deliveryAddress}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-500">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Payment: <b>{order.paymentMethod === 'PHONEPE_UPI' ? 'PhonePe UPI QR' : 'Cash on Delivery'}</b>
                            {order.upiTransactionId && <span className="text-slate-400 font-mono ml-1">({order.upiTransactionId})</span>}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">Total Payable:</div>
                        <div className="text-base font-black text-slate-900">
                          ₹{order.totalPayable}
                        </div>
                        {order.shoppingSavings > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Bachat: ₹{order.shoppingSavings} saved!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: ADDRESS BOOK */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Saved Delivery Addresses</h3>
                <p className="text-xs text-slate-500">Deliveries in Ranchi Central are serviced within 20–30 minutes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {savedAddresses.map((addr) => (
                <div key={addr.id} className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>{addr.label}</span>
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {addr.address}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Deliveries routed from: <b>MegaBachatMart Ranchi Central Dark Store (834001)</b>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENT METHODS */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Payment Modes & Store Wallet</h3>
              <p className="text-xs text-slate-500">Transparent instant settlements via UPI and door-step cash handover.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* PhonePe QR */}
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-[#5F259F] text-white flex items-center justify-center font-bold text-xs">
                  UPI
                </div>
                <h4 className="text-xs font-black text-slate-900">PhonePe / BHIM UPI</h4>
                <p className="text-[11px] text-slate-500 font-mono">VPA: 9801506511@ybl</p>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  Instant QR Verification
                </span>
              </div>

              {/* Cash On Delivery */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                  COD
                </div>
                <h4 className="text-xs font-black text-slate-900">Cash / UPI on Doorstep</h4>
                <p className="text-[11px] text-slate-500">Pay to MBM EV delivery rider upon package inspection</p>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Zero Contact Handover
                </span>
              </div>

              {/* MBM Micro-Credit Wallet */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <h4 className="text-xs font-black text-slate-900">Store Credit Balance</h4>
                <p className="text-sm font-black text-emerald-950">₹{user?.walletBalance || 0}</p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Max 40% Cart Deduction
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TOTAL BACHAT & SAVINGS */}
        {activeTab === 'savings' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Cumulative Shopping Bachat</h3>
              <p className="text-xs text-slate-500">Total money kept in your pocket through MegaBachatMart direct-from-farm pricing.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Saved Across Orders</span>
                <div className="text-2xl font-black text-emerald-950">₹{totalSavedAcrossOrders}</div>
                <p className="text-[11px] text-emerald-700">Calculated against Maximum Retail Price (MRP).</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Withdrawable Cashback</span>
                <div className="text-2xl font-black text-amber-950">₹{user?.walletBalance || 0}</div>
                <Link href="/savings" className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center space-x-1 mt-1">
                  <span>Open Full Passbook & Withdraw</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Live Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        order={selectedOrder}
        onOrderUpdated={handleOrderUpdated}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={(id, delta) => {
          setCartItems((prev) =>
            prev
              .map((i) => (i.product.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
              .filter((i) => i.quantity > 0)
          );
        }}
        onRemoveItem={(id) => {
          setCartItems((prev) => prev.filter((i) => i.product.id !== id));
        }}
        onClearCart={() => setCartItems([])}
        walletBalance={user?.walletBalance || 0}
        onOrderSuccess={(order) => {
          setOrders((prev) => [order, ...prev]);
          handleOpenTracking(order);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(newUser) => setUser((prev) => ({ ...(prev || ({} as UserProfile)), ...newUser } as UserProfile))}
      />

      <Footer />
    </div>
  );
}
