import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/securityUtils';
import {
  inventoryStore,
  adjustStock,
  postGoodsReceipt,
  createStockReservation,
  SKUItem
} from '@/lib/inventoryStore';

export async function GET() {
  const skus = inventoryStore.skus;
  const buckets = inventoryStore.stockBuckets;
  const batches = inventoryStore.batches;
  const purchaseOrders = inventoryStore.purchaseOrders;
  const suppliers = inventoryStore.suppliers;
  const ledger = inventoryStore.stockLedger;
  const reservations = inventoryStore.reservations;

  // Calculate Health Metrics
  const totalSkus = skus.length;
  const activeSkus = skus.filter((s) => s.status === 'ACTIVE').length;
  const totalOnHandUnits = buckets.reduce((acc, b) => acc + b.onHand, 0);
  const totalReservedUnits = buckets.reduce((acc, b) => acc + (b.reservedSoft + b.reservedHard), 0);
  const totalAvailableUnits = Math.max(0, totalOnHandUnits - totalReservedUnits);

  // Valuation at Cost
  const totalStockValuation = buckets.reduce((acc, b) => {
    const sku = skus.find((s) => s.skuCode === b.skuCode);
    return acc + b.onHand * (sku?.costPrice || 0);
  }, 0);

  // Low stock alert items (Available <= ROP)
  const lowStockItems = buckets.filter((b) => {
    const avail = b.onHand - (b.reservedSoft + b.reservedHard);
    return avail <= b.reorderPoint;
  });

  // Expiry alerts (< 30 days)
  const now = new Date().getTime();
  const nearExpiryBatches = batches.filter((batch) => {
    const expTime = new Date(batch.expiryDate).getTime();
    const daysLeft = (expTime - now) / (1000 * 3600 * 24);
    return daysLeft <= 30 && batch.remainingQty > 0;
  });

  return NextResponse.json({
    success: true,
    store: {
      id: 'MBM-RCH-01',
      name: 'Ranchi Central Dark Hub',
      city: 'Ranchi, Jharkhand',
    },
    metrics: {
      totalSkus,
      activeSkus,
      totalOnHandUnits,
      totalReservedUnits,
      totalAvailableUnits,
      totalStockValuation,
      lowStockCount: lowStockItems.length,
      nearExpiryCount: nearExpiryBatches.length,
    },
    data: {
      skus,
      buckets,
      batches,
      purchaseOrders,
      suppliers,
      ledger,
      reservations,
      lowStockItems,
      nearExpiryBatches,
    },
  });
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'ADJUST_STOCK') {
      const { skuCode, quantityDelta, reasonCode, notes, createdBy } = body;
      if (!skuCode || quantityDelta === undefined || !reasonCode) {
        return NextResponse.json(
          { success: false, message: 'Missing required adjustment fields.' },
          { status: 400 }
        );
      }
      const result = adjustStock({
        skuCode,
        quantityDelta: Number(quantityDelta),
        reasonCode,
        notes,
        createdBy: createdBy || 'Admin Staff (Ranchi Hub)',
      });
      return NextResponse.json(result);
    }

    if (action === 'POST_GRN') {
      const {
        poNumber,
        skuCode,
        receivedQty,
        batchNumber,
        manufactureDate,
        expiryDate,
        costPrice,
        receivedBy,
      } = body;

      if (!skuCode || !receivedQty || !batchNumber || !expiryDate) {
        return NextResponse.json(
          { success: false, message: 'Missing mandatory GRN fields.' },
          { status: 400 }
        );
      }

      const result = postGoodsReceipt({
        poNumber: poNumber || 'PO-DIRECT-INWARD',
        skuCode,
        receivedQty: Number(receivedQty),
        batchNumber,
        manufactureDate: manufactureDate || new Date().toISOString().split('T')[0],
        expiryDate,
        costPrice: Number(costPrice || 0),
        receivedBy: receivedBy || 'Inward Receiving Manager',
      });
      return NextResponse.json(result);
    }

    if (action === 'RELEASE_RESERVATION') {
      const { reservationId } = body;
      const resIndex = inventoryStore.reservations.findIndex((r) => r.id === reservationId);
      if (resIndex === -1) {
        return NextResponse.json({ success: false, message: 'Reservation not found.' }, { status: 404 });
      }

      const reservation = inventoryStore.reservations[resIndex];
      const bucket = inventoryStore.stockBuckets.find((b) => b.skuCode === reservation.skuCode);

      if (bucket) {
        if (reservation.reservationType === 'SOFT') {
          bucket.reservedSoft = Math.max(0, bucket.reservedSoft - reservation.quantity);
        } else {
          bucket.reservedHard = Math.max(0, bucket.reservedHard - reservation.quantity);
        }
        bucket.updatedAt = new Date().toISOString();
      }

      reservation.status = 'RELEASED';
      return NextResponse.json({ success: true, message: 'Reservation released successfully.' });
    }

    if (action === 'ADD_SKU') {
      const {
        skuCode,
        productName,
        brand,
        category,
        variantName,
        unitOfMeasure,
        mrp,
        sellingPrice,
        costPrice,
        barcode,
        hsnCode,
        isBatchTracked,
        isExpiryTracked,
        reorderPoint,
        reorderQty,
      } = body;

      if (!skuCode || !productName || !mrp || !sellingPrice) {
        return NextResponse.json({ success: false, message: 'Missing product SKU details.' }, { status: 400 });
      }

      const newSku: SKUItem = {
        id: 'sku-' + Date.now(),
        skuCode,
        barcode: barcode || '890' + Math.floor(1000000000 + Math.random() * 9000000000),
        productName,
        brand: brand || 'MegaBachatMart Direct',
        category: category || 'Groceries',
        variantName: variantName || 'Standard Pack',
        unitOfMeasure: unitOfMeasure || 'pcs',
        mrp: Number(mrp),
        sellingPrice: Number(sellingPrice),
        costPrice: Number(costPrice || mrp * 0.75),
        hsnCode: hsnCode || '21069099',
        isBatchTracked: Boolean(isBatchTracked),
        isExpiryTracked: Boolean(isExpiryTracked),
        isReturnable: false,
        status: 'ACTIVE',
      };

      inventoryStore.skus.push(newSku);

      // Create initial empty bucket
      inventoryStore.stockBuckets.push({
        storeId: 'MBM-RCH-01',
        storeName: 'Ranchi Central Dark Hub',
        skuId: newSku.id,
        skuCode: newSku.skuCode,
        productName: newSku.productName,
        category: newSku.category,
        onHand: 0,
        reservedSoft: 0,
        reservedHard: 0,
        damaged: 0,
        quarantined: 0,
        incoming: 0,
        reorderPoint: Number(reorderPoint || 20),
        reorderQty: Number(reorderQty || 50),
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, message: 'New SKU added to Ranchi Central catalog.', sku: newSku });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
