-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'SELLER', 'SHG_PRODUCER', 'STORE_MANAGER', 'RIDER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "FulfilmentType" AS ENUM ('QUICK_COMMERCE', 'STANDARD_MARKETPLACE', 'BOTH');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('OPEN', 'CLOSED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'PROCESSING', 'PACKED', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT_PURCHASE_CASHBACK', 'CREDIT_DIRECT_REFERRAL_L1', 'CREDIT_TEAM_REFERRAL_L2', 'CREDIT_COMMUNITY_REFERRAL_L3', 'CREDIT_PROMOTIONAL_BONUS', 'DEBIT_ORDER_REDEMPTION', 'DEBIT_EXPIRY', 'REVERSAL_REFUND');

-- CreateEnum
CREATE TYPE "LedgerEntryStatus" AS ENUM ('PENDING_RETURN_WINDOW', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "referralCode" TEXT NOT NULL,
    "referredById" TEXT,
    "level" TEXT NOT NULL DEFAULT 'Silver',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedStoreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'HOME',
    "fullAddress" TEXT NOT NULL,
    "landmark" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Ranchi',
    "state" TEXT NOT NULL DEFAULT 'Jharkhand',
    "pincode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "storeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Ranchi',
    "state" TEXT NOT NULL DEFAULT 'Jharkhand',
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "deliveryRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "status" "StoreStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreInventory" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityAvailable" INTEGER NOT NULL DEFAULT 0,
    "quantityReserved" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "type" "FulfilmentType" NOT NULL DEFAULT 'QUICK_COMMERCE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "isSHG" BOOLEAN NOT NULL DEFAULT false,
    "shgGroupName" TEXT,
    "gstin" TEXT,
    "fssaiNumber" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "mrp" DOUBLE PRECISION NOT NULL,
    "bachatPrice" DOUBLE PRECISION NOT NULL,
    "discountPct" INTEGER NOT NULL DEFAULT 0,
    "cashbackPct" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "isSHG" BOOLEAN NOT NULL DEFAULT false,
    "producerName" TEXT,
    "fulfilmentType" "FulfilmentType" NOT NULL DEFAULT 'QUICK_COMMERCE',
    "sellerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "totalMRP" DOUBLE PRECISION NOT NULL,
    "totalBachatPrice" DOUBLE PRECISION NOT NULL,
    "savingsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditsApplied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalPayable" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'UPI',
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "deliveryOtp" TEXT,
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOrder" (
    "id" TEXT NOT NULL,
    "subOrderNumber" TEXT NOT NULL,
    "parentOrderId" TEXT NOT NULL,
    "storeId" TEXT,
    "sellerId" TEXT,
    "fulfilmentType" "FulfilmentType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "trackingNumber" TEXT,
    "assignedRiderPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitMRP" DOUBLE PRECISION NOT NULL,
    "unitBachatPrice" DOUBLE PRECISION NOT NULL,
    "cashbackEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCashbackEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReferralEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lifetimeEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardLedger" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "orderId" TEXT,
    "entryType" "LedgerEntryType" NOT NULL,
    "status" "LedgerEntryStatus" NOT NULL DEFAULT 'CONFIRMED',
    "amount" DOUBLE PRECISION NOT NULL,
    "runningBalance" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "smartChainHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceablePincode" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Ranchi',
    "state" TEXT NOT NULL DEFAULT 'Jharkhand',
    "deliveryActive" BOOLEAN NOT NULL DEFAULT true,
    "pickupActive" BOOLEAN NOT NULL DEFAULT true,
    "deliveryRadiusKm" DECIMAL(4,1) NOT NULL DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceablePincode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingAuditLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "pincode" TEXT NOT NULL,
    "fulfilmentType" TEXT NOT NULL,
    "candidateCount" INTEGER NOT NULL,
    "excludedShops" JSONB NOT NULL,
    "scoredShops" JSONB NOT NULL,
    "selectedShopId" TEXT,
    "selectionReason" TEXT NOT NULL,
    "reservationIds" JSONB,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'DEFAULT',
    "weights" JSONB NOT NULL,
    "acceptanceSlaMinutes" INTEGER NOT NULL DEFAULT 5,
    "pickingSlaMinutes" INTEGER NOT NULL DEFAULT 15,
    "softReservationTtlMin" INTEGER NOT NULL DEFAULT 15,
    "maxRerouteAttempts" INTEGER NOT NULL DEFAULT 3,
    "closingBufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "antiStarvationDays" INTEGER NOT NULL DEFAULT 7,
    "antiStarvationBonus" DECIMAL(4,2) NOT NULL DEFAULT 0.05,
    "updatedBy" TEXT NOT NULL DEFAULT 'Super Admin',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_memberId_key" ON "User"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "Address_latitude_longitude_idx" ON "Address"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Address_pincode_idx" ON "Address"("pincode");

-- CreateIndex
CREATE UNIQUE INDEX "Store_storeCode_key" ON "Store"("storeCode");

-- CreateIndex
CREATE INDEX "Store_latitude_longitude_idx" ON "Store"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "StoreInventory_storeId_productId_key" ON "StoreInventory"("storeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubOrder_subOrderNumber_key" ON "SubOrder"("subOrderNumber");

-- CreateIndex
CREATE INDEX "SubOrder_parentOrderId_idx" ON "SubOrder"("parentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardAccount_userId_key" ON "RewardAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardLedger_transactionRef_key" ON "RewardLedger"("transactionRef");

-- CreateIndex
CREATE INDEX "RewardLedger_accountId_idx" ON "RewardLedger"("accountId");

-- CreateIndex
CREATE INDEX "RewardLedger_transactionRef_idx" ON "RewardLedger"("transactionRef");

-- CreateIndex
CREATE INDEX "OtpVerification_identifier_idx" ON "OtpVerification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceablePincode_pincode_key" ON "ServiceablePincode"("pincode");

-- CreateIndex
CREATE INDEX "ServiceablePincode_pincode_idx" ON "ServiceablePincode"("pincode");

-- CreateIndex
CREATE INDEX "RoutingRule_priority_isActive_idx" ON "RoutingRule"("priority", "isActive");

-- CreateIndex
CREATE INDEX "RoutingAuditLog_orderId_idx" ON "RoutingAuditLog"("orderId");

-- CreateIndex
CREATE INDEX "RoutingAuditLog_pincode_idx" ON "RoutingAuditLog"("pincode");

-- CreateIndex
CREATE INDEX "RoutingAuditLog_createdAt_idx" ON "RoutingAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingConfig_key_key" ON "RoutingConfig"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedStoreId_fkey" FOREIGN KEY ("assignedStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreInventory" ADD CONSTRAINT "StoreInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreInventory" ADD CONSTRAINT "StoreInventory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_parentOrderId_fkey" FOREIGN KEY ("parentOrderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardAccount" ADD CONSTRAINT "RewardAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardLedger" ADD CONSTRAINT "RewardLedger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "RewardAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

