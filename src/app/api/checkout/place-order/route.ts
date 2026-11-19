import { NextResponse } from 'next/server';
import { CATALOG_PRODUCTS } from '@/lib/catalog';
import { addOrder, OrderRecord } from '@/lib/ordersStore';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      items = [], 
      deliveryAddress = 'Main Road, Ranchi Central - 834001', 
      pincode = '834001',
      paymentMethod = 'UPI',
      useWalletCredits = false,
      userWalletBalance = 350,
      customerName = 'Customer',
      customerPhone = '',
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Your cart is empty. Please add items before placing order.' },
        { status: 400 }
      );
    }

    const quickItems: any[] = [];
    const marketplaceItems: any[] = [];
    let totalMRP = 0;
    let totalBachatPrice = 0;
    let totalCashback = 0;

    for (const item of items) {
      const product = CATALOG_PRODUCTS.find((p) => p.id === item.productId || p.id === item.product?.id);
      if (!product) continue;

      const qty = item.quantity || 1;
      const mrp = product.mrp * qty;
      const bachat = product.bachatPrice * qty;
      const cashback = (product.cashbackAmount || 0) * qty;

      totalMRP += mrp;
      totalBachatPrice += bachat;
      totalCashback += cashback;

      const orderItem = {
        productId: product.id,
        name: product.name,
        quantity: qty,
        unitPrice: product.bachatPrice,
        image: product.image,
        fulfilmentType: product.fulfilmentType,
      };

      if (product.fulfilmentType === 'QUICK_COMMERCE') {
        quickItems.push(orderItem);
      } else {
        marketplaceItems.push(orderItem);
      }
    }

    // Delivery fees calculation:
    // Quick commerce free above ₹199, else ₹29
    // Marketplace free above ₹499, else ₹49
    const quickSubtotal = quickItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
    const marketplaceSubtotal = marketplaceItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);

    const quickDeliveryFee = quickItems.length > 0 ? (quickSubtotal >= 199 ? 0 : 29) : 0;
    const marketplaceDeliveryFee = marketplaceItems.length > 0 ? (marketplaceSubtotal >= 499 ? 0 : 49) : 0;
    const totalDeliveryFee = quickDeliveryFee + marketplaceDeliveryFee;

    // Closed-loop wallet credit redemption (up to 40% cap)
    const maxCreditDeduction = Math.min(userWalletBalance, Math.round(totalBachatPrice * 0.4));
    const creditDeduction = useWalletCredits ? maxCreditDeduction : 0;

    const totalPayable = Math.max(0, totalBachatPrice + totalDeliveryFee - creditDeduction);
    const shoppingSavings = totalMRP - totalBachatPrice;

    // Generate unique order number and 4-digit Delivery OTP
    const orderNumber = `MBM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const splitShipments: OrderRecord['splitShipments'] = [];
    if (quickItems.length > 0) {
      splitShipments.push({
        type: 'QUICK_COMMERCE',
        status: 'PLACED',
        eta: '20–30 Minutes',
        hub: 'Ranchi Central Dark Store',
        itemCount: quickItems.length,
      });
    }
    if (marketplaceItems.length > 0) {
      splitShipments.push({
        type: 'STANDARD_MARKETPLACE',
        status: 'CONFIRMED',
        eta: '2–4 Business Days',
        hub: 'Regional Fulfillment Warehouse',
        itemCount: marketplaceItems.length,
      });
    }

    const newOrder: OrderRecord = {
      id: 'ord-' + Date.now(),
      orderNumber,
      userId: 'usr-1',
      userName: customerName,
      userPhone: customerPhone,
      deliveryAddress,
      pincode,
      fulfilmentType: (body.fulfilmentType as 'HOME_DELIVERY' | 'SELF_PICKUP') || 'HOME_DELIVERY',
      status: 'PLACED',
      deliveryOtp,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      upiTransactionId: body.upiTransactionId || undefined,
      totalMRP,
      totalPayable,
      shoppingSavings,
      creditDeduction,
      cashbackEarnable: totalCashback,
      cashbackCredited: false,
      assignedRider: undefined,
      darkStore: {
        id: 'store-ranchi-central',
        name: 'Ranchi Central Dark Store',
        city: 'Ranchi',
        etaMinutes: 25,
      },
      items: [...quickItems, ...marketplaceItems],
      splitShipments,
      createdAt: new Date().toISOString(),
      timeline: [
        { step: 'Order Placed & Stock Locked', time: 'Just now', completed: true },
        { step: 'Dark Store Packing Started', time: 'In 3 mins', completed: false },
        { step: 'Rider Pick-up & Dispatch', time: 'In 8 mins', completed: false },
        { step: `Delivery at Doorstep (OTP: ${deliveryOtp})`, time: 'In 20–25 mins', completed: false },
      ]
    };

    // 1. Prisma-First: Attempt persisting to PostgreSQL if database connection is active
    try {
      const { prisma } = await import('@/lib/prisma');
      await (prisma.order.create as any)({
        data: {
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          userId: 'usr-1',
          addressId: 'addr-1',
          totalMRP: newOrder.totalMRP,
          totalBachatPrice: newOrder.totalMRP - newOrder.shoppingSavings,
          finalPayable: newOrder.totalPayable,
          paymentStatus: newOrder.paymentStatus === 'COD' ? 'PENDING' : 'PAID',
          paymentMethod: newOrder.paymentMethod === 'COD' ? 'CASH_ON_DELIVERY' : 'UPI',
          orderStatus: 'PLACED',
        },
      });
    } catch {
      // Graceful fallback to resilient store when database server is offline/pending AWS migration
    }

    // 2. Resilient active store persistence
    addOrder(newOrder);

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully! Dark store packing initiated.',
      order: newOrder,
      paymentIntent: paymentMethod === 'UPI' ? {
        gateway: 'RAZORPAY_UPI',
        virtualPaymentAddress: 'pay-mymbmart@icici',
        amountInPaise: totalPayable * 100,
        currency: 'INR',
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to place order' },
      { status: 500 }
    );
  }
}
