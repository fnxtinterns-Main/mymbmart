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
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(sampleProducts);

  // Fetch latest products from live catalog (including CSV-uploaded items)
  React.useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setCatalogProducts(data.products);
        }
      })
      .catch((err) => console.error('Failed to fetch dynamic products:', err));
  }, []);

  // Load persisted cart from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('mymbmart_cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }

      // Check cookie for OAuth redirect login (e.g. Google Sign-in)
      const cookies = document.cookie.split('; ');
      const userCookie = cookies.find((row) => row.startsWith('mbm_user_data='));
      if (userCookie) {
        try {
          const cookieData = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
          if (cookieData && cookieData.email) {
            setUser((p) => ({ ...p, ...cookieData }));
            localStorage.setItem('mbm_user', JSON.stringify(cookieData));
          }
        } catch {}
      } else {
        const savedUser = localStorage.getItem('mbm_user');
        if (savedUser) {
          setUser((p) => ({ ...p, ...JSON.parse(savedUser) }));
        }
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

      <main className="flex-1 pb-16">
        <StoreCatalog 
          products={catalogProducts} 
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
