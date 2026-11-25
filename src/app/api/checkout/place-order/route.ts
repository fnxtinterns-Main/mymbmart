import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { CATALOG_PRODUCTS } from '@/lib/catalog';
import { addOrder, type OrderRecord } from '@/lib/ordersStore';
import { isRedisConfigured, redisGet, redisSet } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { financialLedger } from '@/lib/ledgerStore';
import { getJwtSecret } from '@/lib/securityUtils';

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

      const rawQty = Number(item.quantity);
      if (isNaN(rawQty) || rawQty <= 0) continue;
      const qty = Math.max(1, Math.min(99, Math.floor(rawQty)));
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
    // Self pickup is strictly ₹0 delivery fee.
    // Quick commerce free above ₹199, else ₹29
    // Marketplace free above ₹499, else ₹49
    const isPickup = body.fulfilmentType === 'SELF_PICKUP' || body.fulfilmentType === 'STORE_PICKUP';
    const quickSubtotal = quickItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
    const marketplaceSubtotal = marketplaceItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);

    const quickDeliveryFee = isPickup ? 0 : (quickItems.length > 0 ? (quickSubtotal >= 199 ? 0 : 29) : 0);
    const marketplaceDeliveryFee = isPickup ? 0 : (marketplaceItems.length > 0 ? (marketplaceSubtotal >= 499 ? 0 : 49) : 0);
    const totalDeliveryFee = isPickup ? 0 : (quickDeliveryFee + marketplaceDeliveryFee);

    // Derive authenticated session and real wallet balance from verified cookie
    const cookieHeader = req.headers.get('cookie') || '';
    let authenticatedUserId = 'usr-guest-' + Date.now().toString().slice(-6);
    let verifiedWalletBalance = 0;
    let realCustomerName = customerName || 'Customer';
    let realCustomerPhone = customerPhone || '';

    // Verify cryptographic session token
    let isSessionValid = false;
    const sessionCookieMatch = cookieHeader.match(/mbm_session=([^;]+)/);
    if (sessionCookieMatch) {
      try {
        const { default: jwt } = await import('jsonwebtoken');
        const decoded: any = jwt.verify(sessionCookieMatch[1], getJwtSecret(), { algorithms: ['HS256'] });
        if (decoded && decoded.userId) {
          authenticatedUserId = decoded.userId;
          if (decoded.phone) realCustomerPhone = decoded.phone;
          isSessionValid = true;
        }
      } catch {}
    }

    const userCookieMatch = cookieHeader.match(/mbm_user_data=([^;]+)/);
    if (userCookieMatch) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userCookieMatch[1]));
        if (!isSessionValid && parsedUser.id) authenticatedUserId = parsedUser.id;
        if (parsedUser.name && parsedUser.name !== 'Guest User') {
          realCustomerName = parsedUser.name;
        }
        if (parsedUser.phone && !realCustomerPhone) {
          realCustomerPhone = parsedUser.phone;
        }
        // Verify wallet balance safely: check Redis balance first, or clamp cookie balance to safe ceiling
        if (isSessionValid && typeof parsedUser.walletBalance === 'number') {
          verifiedWalletBalance = Math.max(0, Math.min(parsedUser.walletBalance, 500));
        }
      } catch {}
    } else if (process.env.NODE_ENV !== 'production' && typeof userWalletBalance === 'number') {
      verifiedWalletBalance = userWalletBalance;
    }

    // Check Redis for authoritative server-side wallet balance
    if (isRedisConfigured() && isSessionValid && authenticatedUserId) {
      try {
        const redisBal = await redisGet<number>(`wallet:${authenticatedUserId}`);
        if (redisBal !== null && !isNaN(Number(redisBal))) {
          verifiedWalletBalance = Math.max(0, Number(redisBal));
        }
      } catch {}
    }

    // Closed-loop wallet credit redemption (up to 40% cap, verified server-side)
    const maxCreditDeduction = Math.min(verifiedWalletBalance, Math.round(totalBachatPrice * 0.4));
    const creditDeduction = useWalletCredits ? maxCreditDeduction : 0;

    const totalPayable = Math.max(0, totalBachatPrice + totalDeliveryFee - creditDeduction);
    const shoppingSavings = totalMRP - totalBachatPrice;

    // Generate unique order number and 4-digit Delivery OTP using cryptographically secure PRNG
    const orderNumber = `MBM-2026-${crypto.randomInt(10000, 100000)}`;
    const deliveryOtp = crypto.randomInt(1000, 10000).toString();

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

    // Dynamic Hyperlocal Partner Allocation via 10-Factor Routing Engine
    let assignedHub = {
      id: 'store-ranchi-central',
      name: 'Ranchi Central Dark Store',
      city: 'Ranchi',
      etaMinutes: 25,
    };
    let routingAuditMetadata: OrderRecord['routingAudit'] = undefined;

    try {
      const { routingEngine } = await import('@/lib/routingEngine');
      const routeItems = items.map((i: any) => ({
        skuId: i.productId || i.product?.id || 'MB-GRO-AASH-5K',
        quantity: Math.max(1, Math.min(99, Math.floor(Number(i.quantity) || 1))),
      }));

      const routeResult = await routingEngine.routeOrder({
        orderId: `ord-route-${Date.now()}`,
        customerId: authenticatedUserId,
        fulfilmentType: isPickup ? 'PICKUP' : 'DELIVERY',
        deliveryPincode: pincode || '834001',
        items: routeItems,
        customerSelectedShopId: body.shopId || body.storeId || null,
      });

      if (routeResult.success && routeResult.selectedShopId && routeResult.selectedShopName) {
        assignedHub = {
          id: routeResult.selectedShopId,
          name: routeResult.selectedShopName,
          city: 'Ranchi',
          etaMinutes: routeResult.estimatedDeliveryMinutes || (isPickup ? 15 : 25),
        };
        routingAuditMetadata = {
          auditId: routeResult.routingAuditId,
          selectedShopId: routeResult.selectedShopId,
          selectedShopName: routeResult.selectedShopName,
          candidateCount: routeResult.candidateCount,
          winningScore: routeResult.winningScore,
          latencyMs: routeResult.latencyMs,
          excludedReasons: routeResult.excludedShops?.map((e) => ({ shopName: e.shopName, reason: e.reason })),
        };
      }
    } catch (routeErr) {
      console.warn('Dynamic routing fallback to Central Dark Store:', routeErr);
    }

    const isInstantPaid = totalPayable === 0 && creditDeduction > 0;

    const newOrder: OrderRecord = {
      id: 'ord-' + Date.now(),
      orderNumber,
      userId: authenticatedUserId,
      userName: realCustomerName,
      userPhone: realCustomerPhone,
      deliveryAddress,
      pincode,
      fulfilmentType: isPickup ? 'SELF_PICKUP' : 'HOME_DELIVERY',
      status: 'PLACED',
      deliveryOtp,
      paymentMethod,
      paymentStatus: isInstantPaid ? 'PAID' : 'PENDING',
      upiTransactionId: body.upiTransactionId || undefined,
      totalMRP,
      totalPayable,
      shoppingSavings,
      creditDeduction,
      cashbackEarnable: totalCashback,
      cashbackCredited: false,
      assignedRider: undefined,
      darkStore: assignedHub,
      routingAudit: routingAuditMetadata,
      items: [...quickItems, ...marketplaceItems],
      splitShipments,
      createdAt: new Date().toISOString(),
      timeline: [
        { step: 'Order Placed & Stock Locked', time: 'Just now', completed: true },
        { step: `${assignedHub.name} Packing Started`, time: 'In 3 mins', completed: false },
        { step: isPickup ? 'Ready for Counter Pickup' : 'Rider Pick-up & Dispatch', time: 'In 8 mins', completed: false },
        { step: isPickup ? 'Customer Self-Pickup at Store' : `Delivery at Doorstep (OTP: ${deliveryOtp})`, time: `In ${assignedHub.etaMinutes} mins`, completed: false },
      ]
    };

    // 1. Transactional Checkout in PostgreSQL (Fail-Closed)
    // Bundles: User & Address verification, Order creation, Single-Store Inventory Reservation,
    // Instant Settlement (if wallet prepaid), and OutboxEvent emission into ONE commit.
    if (process.env.DATABASE_URL) {
      await prisma.$transaction(async (tx) => {
        // Ensure user exists in Postgres so relational foreign key constraint is satisfied
        let dbUser = await tx.user.findFirst({
          where: {
            OR: [
              { id: newOrder.userId },
              { phone: newOrder.userPhone }
            ]
          }
        });
        if (!dbUser) {
          dbUser = await tx.user.create({
            data: {
              id: newOrder.userId.startsWith('usr-') ? newOrder.userId : undefined,
              memberId: 'MBM-' + Math.floor(100000 + Math.random() * 900000),
              name: newOrder.userName || 'Customer',
              phone: newOrder.userPhone || ('+91' + Math.floor(9000000000 + Math.random() * 1000000000)),
              referralCode: 'REF-' + Math.floor(10000 + Math.random() * 90000),
              role: 'CUSTOMER',
            }
          });
        }

        // Ensure delivery address exists in Postgres
        let dbAddress = await tx.address.findFirst({
          where: { userId: dbUser.id }
        });
        if (!dbAddress) {
          dbAddress = await tx.address.create({
            data: {
              userId: dbUser.id,
              fullAddress: newOrder.deliveryAddress || 'Ranchi Central, Jharkhand',
              pincode: newOrder.pincode || '834001',
              city: 'Ranchi',
              state: 'Jharkhand',
              latitude: 23.3441,
              longitude: 85.3096,
              isDefault: true,
            }
          });
        }

        // Ensure products exist in PostgreSQL so relational foreign key constraint is satisfied
        for (const item of newOrder.items) {
          const dbProduct = await tx.product.findUnique({
            where: { id: item.productId }
          });
          if (!dbProduct) {
            let cat = await tx.category.findFirst();
            if (!cat) {
              cat = await tx.category.create({
                data: { name: 'Groceries', slug: 'groceries' }
              });
            }
            const catProd = CATALOG_PRODUCTS.find((p) => p.id === item.productId);
            await tx.product.create({
              data: {
                id: item.productId,
                sku: catProd?.sku || `MBM-SKU-${item.productId.toUpperCase()}`,
                name: item.name || catProd?.name || 'Product',
                slug: catProd?.slug || item.productId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                unit: catProd?.unit || '1 unit',
                categoryId: cat.id,
                mrp: catProd?.mrp || item.unitPrice,
                bachatPrice: item.unitPrice,
                imageUrl: item.image || '/images/products/atta.png',
              }
            });
          }
        }

        // 1. Create permanent order in PostgreSQL with full item relations
        await tx.order.create({
          data: {
            id: newOrder.id,
            orderNumber: newOrder.orderNumber,
            userId: dbUser.id,
            addressId: dbAddress.id,
            totalMRP: newOrder.totalMRP,
            totalBachatPrice: newOrder.totalMRP - newOrder.shoppingSavings,
            savingsEarned: newOrder.shoppingSavings,
            deliveryFee: totalDeliveryFee,
            creditsApplied: newOrder.creditDeduction,
            finalPayable: newOrder.totalPayable,
            paymentStatus: newOrder.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
            paymentMethod: newOrder.paymentMethod === 'COD' ? 'CASH_ON_DELIVERY' : 'UPI',
            orderStatus: 'PLACED',
            deliveryOtp: newOrder.deliveryOtp,
            items: {
              create: newOrder.items.map((it) => {
                const catProd = CATALOG_PRODUCTS.find((p) => p.id === it.productId);
                return {
                  productId: it.productId,
                  quantity: it.quantity,
                  unitMRP: catProd?.mrp || it.unitPrice,
                  unitBachatPrice: it.unitPrice,
                  cashbackEarned: (catProd?.cashbackAmount || 0) * it.quantity,
                };
              }),
            },
          },
        });

        // 2. Conditional inventory reservation in PostgreSQL (Filtered to assigned store)
        for (const item of newOrder.items) {
          const storeInv = await tx.storeInventory.findFirst({
            where: { storeId: assignedHub.id, productId: item.productId }
          });
          if (storeInv) {
            const updated = await tx.storeInventory.updateMany({
              where: {
                storeId: assignedHub.id,
                productId: item.productId,
                quantityAvailable: { gte: item.quantity },
              },
              data: {
                quantityAvailable: { decrement: item.quantity },
                quantityReserved: { increment: item.quantity },
              },
            });
            if (updated.count === 0) {
              throw new Error(`Insufficient stock available at store ${assignedHub.name} to reserve product ${item.name || item.productId}`);
            }
          }
        }

        // 2b. Deduct applied wallet credits atomically from PostgreSQL RewardAccount
        if (newOrder.creditDeduction > 0) {
          const userReward = await tx.rewardAccount.findUnique({
            where: { userId: dbUser.id },
          });
          if (userReward) {
            await tx.rewardAccount.update({
              where: { userId: dbUser.id },
              data: {
                balance: { decrement: newOrder.creditDeduction },
              },
            });
          }
        }

        // 3. Double-Entry Financial Ledger Posting (Only for 100% wallet prepaid orders at checkout)
        // Online UPI orders settle when gateway webhook confirms status === 'SUCCESS'
        if (isInstantPaid) {
          await financialLedger.recordOrderSettlement({
            orderId: newOrder.id,
            grossAmount: newOrder.creditDeduction,
            walletPaid: newOrder.creditDeduction,
            gatewayPaid: 0,
            idempotencyKey: `settle-${newOrder.id}`,
          }, tx);
        }

        // 4. Create durable OutboxEvent for downstream dispatch
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'ORDER',
            aggregateId: newOrder.id,
            eventType: 'ORDER_PLACED',
            payload: {
              orderId: newOrder.id,
              orderNumber: newOrder.orderNumber,
              userId: dbUser.id,
              totalPayable: newOrder.totalPayable,
              paymentMethod: newOrder.paymentMethod,
              paymentStatus: newOrder.paymentStatus,
              itemsCount: newOrder.items.length,
              hubId: assignedHub.id,
              fulfilmentType: newOrder.fulfilmentType,
              deliveryOtp,
            },
            idempotencyKey: `outbox-order-placed-${newOrder.id}`,
            status: 'PENDING',
          },
        });
      });
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production. Cannot place order without persistent database.');
    }

    // Atomic catalog stock decrement in memory
    for (const item of items) {
      const product = CATALOG_PRODUCTS.find((p) => p.id === item.productId || p.id === item.product?.id);
      if (product) {
        const rawQty = Number(item.quantity);
        if (isNaN(rawQty) || rawQty <= 0) continue;
        const qty = Math.max(1, Math.min(99, Math.floor(rawQty)));
        product.stockQuantity = Math.max(0, (product.stockQuantity || 50) - qty);
        if (product.stockQuantity === 0) product.inStock = false;
      }
    }

    // 2. Resilient active store persistence
    addOrder(newOrder);

    // 3. Deduct applied wallet credits from Redis if applicable
    if (creditDeduction > 0 && isRedisConfigured() && authenticatedUserId) {
      try {
        await redisSet(`wallet:${authenticatedUserId}`, Math.max(0, verifiedWalletBalance - creditDeduction));
      } catch {}
    }

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
