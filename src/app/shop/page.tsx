'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { StoreCatalog } from '@/components/StoreCatalog';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/AuthModal';
import { OrderTrackingModal } from '@/components/OrderTrackingModal';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Footer } from '@/components/Footer';
import { initialUser, initialWallet, sampleProducts } from '@/lib/data';
import { CartItem, ProductItem, UserProfile } from '@/lib/types';
import { OrderRecord, ordersStore } from '@/lib/ordersStore';
import { Sparkles, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';

export default function ShopPage() {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(ordersStore[0] || null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // Load persisted cart from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('mymbmart_cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
      const savedUser = localStorage.getItem('mbm_user');
      if (savedUser) {
        setUser((p) => ({ ...p, ...JSON.parse(savedUser) }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save cart changes to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('mymbmart_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  const handleAddToCart = (product: ProductItem) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleOrderSuccess = (placedOrder: any) => {
    setActiveOrder(placedOrder);
    setIsTrackingOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar
        user={user.phone ? user : null}
        isLoggedIn={Boolean(user.phone)}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Floating Active Delivery Bar (Quick Commerce Feature) */}
      {activeOrder && activeOrder.status !== 'DELIVERED' && (
        <div className="bg-gradient-to-r from-brand-forest to-emerald-800 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sticky top-0 z-40">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
              </span>
              <span className="font-extrabold">Active Quick Delivery:</span>
              <span className="text-emerald-200">#{activeOrder.orderNumber} ({activeOrder.status.replace(/_/g, ' ')})</span>
              <span className="hidden sm:inline text-amber-300 font-bold">• OTP: {activeOrder.deliveryOtp}</span>
            </div>

            <button
              onClick={() => setIsTrackingOpen(true)}
              className="bg-brand-orange hover:bg-orange-600 text-white font-black px-3 py-1 rounded-xl text-xs shadow-xs transition"
            >
              Live Tracking & Dispatch →
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 pb-16">
        <StoreCatalog 
          products={sampleProducts} 
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
        />
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
        walletBalance={initialWallet.balance}
        onOrderSuccess={handleOrderSuccess}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser((p) => ({ ...p, ...u }))}
      />

      {/* Phase 6: Live Order Tracking & Dispatch Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        order={activeOrder}
        onOrderUpdated={(updated) => setActiveOrder(updated)}
      />

      <MobileBottomNav
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <Footer />
    </div>
  );
}
