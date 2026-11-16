import { NextResponse } from 'next/server';
import { CATALOG_PRODUCTS } from '@/lib/catalog';

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

    for (const item of items) {
      const product = CATALOG_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) continue;

      const itemMRP = product.mrp * item.quantity;
      const itemBachat = product.bachatPrice * item.quantity;
      const itemSavings = itemMRP - itemBachat;
      const itemCashback = (product.cashbackAmount || 0) * item.quantity;
      const itemReferral = (product.referralRewardAmount || 0) * item.quantity;

      totalMRP += itemMRP;
      totalBachatPrice += itemBachat;
      totalCashbackEarnable += itemCashback;
      totalReferralPool += itemReferral;

      const populatedItem = {
        productId: product.id,
        name: product.name,
        category: product.category,
        unit: product.unit,
        image: product.image,
        mrp: product.mrp,
        bachatPrice: product.bachatPrice,
        quantity: item.quantity,
        subtotalMRP: itemMRP,
        subtotalBachat: itemBachat,
        itemSavings,
        cashbackEarnable: itemCashback,
        fulfilmentType: product.fulfilmentType,
      };

      if (product.fulfilmentType === 'QUICK_COMMERCE') {
        quickCommerceItems.push(populatedItem);
      } else {
        standardMarketplaceItems.push(populatedItem);
      }
    }

    // Split shipments calculation
    const quickSubtotal = quickCommerceItems.reduce((acc, i) => acc + i.subtotalBachat, 0);
    const marketplaceSubtotal = standardMarketplaceItems.reduce((acc, i) => acc + i.subtotalBachat, 0);

    // Free delivery thresholds:
    // Quick Commerce: Free above ₹199, else ₹29
    // Marketplace: Free above ₹499, else ₹49
    const quickDeliveryFee = quickCommerceItems.length > 0 ? (quickSubtotal >= 199 ? 0 : 29) : 0;
    const marketplaceDeliveryFee = standardMarketplaceItems.length > 0 ? (marketplaceSubtotal >= 499 ? 0 : 49) : 0;
    const totalDeliveryFee = quickDeliveryFee + marketplaceDeliveryFee;

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
