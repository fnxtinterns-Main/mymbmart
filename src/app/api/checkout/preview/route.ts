import { NextResponse } from 'next/server';
import { getCatalogProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      items = [] as CheckoutItemInput[], 
      pincode = '834001', 
      useWalletCredits = false,
      userWalletBalance = 350 // Default user balance if not passed
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cart is empty. Please add items to checkout.' },
        { status: 400 }
      );
    }

    const quickCommerceItems: any[] = [];
    const standardMarketplaceItems: any[] = [];

    let totalMRP = 0;
    let totalBachatPrice = 0;
    let totalCashbackEarnable = 0;
    let totalReferralPool = 0;

    // Canonical Server-Side Product Price Lookup - ignore client-sent prices
    let dbProducts: any[] = [];
    try {
      const { prisma } = await import('@/lib/prisma');
      const itemIds = items.map((i: any) => i.productId).filter(Boolean);
      dbProducts = await prisma.product.findMany({
        where: { id: { in: itemIds } }
      });
    } catch {}

    for (const item of items) {
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      const dbProduct = dbProducts.find((p) => p.id === item.productId);
      const catalogProduct = getCatalogProducts().find((p) => p.id === item.productId);

      if (!dbProduct && !catalogProduct) continue;

      const canonicalMRP = Number(dbProduct?.mrp ?? catalogProduct?.mrp ?? 0);
      const canonicalBachat = Number(dbProduct?.bachatPrice ?? catalogProduct?.bachatPrice ?? canonicalMRP);
      const cashbackAmount = Number(catalogProduct?.cashbackAmount ?? Math.round(canonicalBachat * 0.05));
      const referralAmount = Number(catalogProduct?.referralRewardAmount ?? Math.round(canonicalBachat * 0.03));
      const fulfilmentType = catalogProduct?.fulfilmentType || 'QUICK_COMMERCE';
      const name = dbProduct?.name || catalogProduct?.name || 'Product';
      const image = dbProduct?.imageUrl || catalogProduct?.image || '';
      const unit = dbProduct?.unit || catalogProduct?.unit || '';
      const category = catalogProduct?.category || 'General';

      const itemMRP = canonicalMRP * qty;
      const itemBachat = canonicalBachat * qty;
      const itemSavings = itemMRP - itemBachat;
      const itemCashback = cashbackAmount * qty;
      const itemReferral = referralAmount * qty;

      totalMRP += itemMRP;
      totalBachatPrice += itemBachat;
      totalCashbackEarnable += itemCashback;
      totalReferralPool += itemReferral;

      const populatedItem = {
        productId: item.productId,
        name,
        category,
        unit,
        image,
        mrp: canonicalMRP,
        bachatPrice: canonicalBachat,
        quantity: qty,
        subtotalMRP: itemMRP,
        subtotalBachat: itemBachat,
        itemSavings,
        cashbackEarnable: itemCashback,
        fulfilmentType,
      };

      if (fulfilmentType === 'QUICK_COMMERCE') {
        quickCommerceItems.push(populatedItem);
      } else {
        standardMarketplaceItems.push(populatedItem);
      }
    }

    // Split shipments calculation
    const quickSubtotal = quickCommerceItems.reduce((acc, i) => acc + i.subtotalBachat, 0);
    const marketplaceSubtotal = standardMarketplaceItems.reduce((acc, i) => acc + i.subtotalBachat, 0);

    // Free delivery thresholds:
    // Self-Pickup is strictly ₹0 delivery fee.
    // Quick Commerce: Free above ₹199, else ₹29
    // Marketplace: Free above ₹499, else ₹49
    const isPickup = body.fulfilmentType === 'SELF_PICKUP' || body.fulfilmentType === 'STORE_PICKUP';
    const quickDeliveryFee = isPickup ? 0 : (quickCommerceItems.length > 0 ? (quickSubtotal >= 199 ? 0 : 29) : 0);
    const marketplaceDeliveryFee = isPickup ? 0 : (standardMarketplaceItems.length > 0 ? (marketplaceSubtotal >= 499 ? 0 : 49) : 0);
    const totalDeliveryFee = isPickup ? 0 : (quickDeliveryFee + marketplaceDeliveryFee);

    const subtotalWithDelivery = totalBachatPrice + totalDeliveryFee;

    // Wallet Credits Deduction:
    // RBI Stored-Value compliance: Maximum 40% of order value or available wallet balance
    const maxAllowableCreditDeduction = Math.min(
      userWalletBalance,
      Math.round(totalBachatPrice * 0.4)
    );
    const appliedCreditDeduction = useWalletCredits ? maxAllowableCreditDeduction : 0;
    const finalPayable = Math.max(0, subtotalWithDelivery - appliedCreditDeduction);

    const totalSavings = (totalMRP - totalBachatPrice) + appliedCreditDeduction;

    // 3-Tier Referral Distribution Simulation
    const referralBreakdown = {
      level1Direct: Math.round(totalReferralPool * 0.625), // ~5% of purchase
      level2Team: Math.round(totalReferralPool * 0.25),     // ~2% of purchase
      level3Community: Math.round(totalReferralPool * 0.125) // ~1% of purchase
    };

    return NextResponse.json({
      success: true,
      pricing: {
        totalMRP,
        totalBachatPrice,
        productDiscount: totalMRP - totalBachatPrice,
        totalDeliveryFee,
        appliedCreditDeduction,
        finalPayable,
        totalSavings,
        cashbackEarnableOnDelivery: totalCashbackEarnable,
      },
      splitShipments: [
        ...(quickCommerceItems.length > 0 ? [{
          type: 'QUICK_COMMERCE',
          title: 'Quick Commerce (10–30 Mins)',
          fulfilmentHub: 'Ranchi Central Dark Store',
          estimatedEta: '20–30 Minutes',
          itemCount: quickCommerceItems.length,
          subtotal: quickSubtotal,
          deliveryFee: quickDeliveryFee,
          isFreeDelivery: quickDeliveryFee === 0,
          freeDeliveryThreshold: 199,
          items: quickCommerceItems,
        }] : []),
        ...(standardMarketplaceItems.length > 0 ? [{
          type: 'STANDARD_MARKETPLACE',
          title: 'Standard Marketplace (2–4 Days)',
          fulfilmentHub: 'Regional Warehouse / Verified Sellers',
          estimatedEta: '2–4 Business Days',
          itemCount: standardMarketplaceItems.length,
          subtotal: marketplaceSubtotal,
          deliveryFee: marketplaceDeliveryFee,
          isFreeDelivery: marketplaceDeliveryFee === 0,
          freeDeliveryThreshold: 499,
          items: standardMarketplaceItems,
        }] : []),
      ],
      walletRules: {
        availableBalance: userWalletBalance,
        maxAllowableDeduction: maxAllowableCreditDeduction,
        isApplied: useWalletCredits,
        remainingBalanceAfterOrder: userWalletBalance - appliedCreditDeduction,
      },
      referralDistribution: referralBreakdown,
      deliveryPincode: pincode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Checkout calculation failed' },
      { status: 500 }
    );
  }
}
