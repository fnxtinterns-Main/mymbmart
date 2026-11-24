---
title: MegaBachatMart — Master Operations & Step-by-Step User Guide
audience: A1 (Junior Developer Onboarding), A2 (Daily Work), A4 (Owner & Non-Technical Stakeholders)
status: Authoritative (Phase 1 Ranchi Central Live)
owner: @tech-lead
version: 1.0
last_updated: 2026-11-16
related: [megabachatmart_master_technical_srs.md, megabachatmart_v2_consolidated_architecture.md, megabachatmart_technical_risk_register.md, ADR-001, ADR-002, ADR-003]
---

# MegaBachatMart — Master Operations & Step-by-Step User Guide

> **"Every line of code has a purpose. Every actor has a clear path. This document is the master operational blueprint that enables any junior engineer, store manager, or founder to understand, operate, and maintain every workflow of MegaBachatMart."**

---

## 1. System Overview & The Five Key Actors

MegaBachatMart is a **Dual-Commerce Hyperlocal Marketplace** combining **20–30 minute quick-commerce delivery**, **dark store self-pickup**, **local Kirana merchant fulfillment**, and **authentic rural Self-Help Group (SHG) producer supply chains** in Tier-2/3 cities (starting with Ranchi Central, Pincode 834001).

```
                      ┌───────────────────────────────────────────────┐
                      │              MEGABACHATMART                   │
                      │         Hyperlocal Platform Core              │
                      └───────┬───────────────────────────────┬───────┘
                              │                               │
            ┌─────────────────┴───────────────┐               │
            ▼                                 ▼               ▼
┌───────────────────────┐         ┌───────────────────────┐ ┌───────────────────────┐
│     1. CONSUMER       │         │  2. MERCHANT PARTNER  │ │    3. SHG PRODUCER    │
│  - Browse Local SKUs  │         │  - Local Kirana Store │ │  - Artisanal Goods    │
│  - 20-min Quick Deliv │         │  - Bulk CSV Ingestion │ │  - Direct Farm Supply │
│  - Dark Store Pickup  │         │  - 20-min Dispatch    │ │  - Community Pricing  │
│  - Wallet & Cashback  │         │  - Partner Portal     │ │  - Producer Portal    │
└───────────────────────┘         └───────────────────────┘ └───────────────────────┘
            │                                 │                       │
            └─────────────────┬───────────────┴───────────────────────┘
                              ▼
            ┌───────────────────────────────────┐
            │          ADMINISTRATION           │
            ├─────────────────┬─────────────────┤
            │  4. STORE ADMIN │  5. FIELD STAFF │
            │  - KYC Review   │  - Delivery     │
            │  - Master Cat   │  - Pick & Pack  │
            │  - RBAC & 2FA   │  - QR / OTP     │
            └─────────────────┴─────────────────┘
```

---

## 2. STEP 1: How to Login as Every Actor Type

MegaBachatMart provides dedicated, role-isolated authentication paths for each type of participant.

### 2.1 Consumer Login (Storefront)
Consumers can sign in from any page using either passwordless mobile OTP or account password.

- **URL:** Click **"Sign In / Join"** on the top right of the navigation header (`/` or `/shop`).
- **Flow 1: Passwordless Mobile OTP (Recommended)**
  1. Open the storefront header and click **"Sign In / Join"**.
  2. Select the **"Mobile OTP"** tab.
  3. Enter your 10-digit mobile number (e.g. `9876543210`).
  4. (Optional) Enter a Referral Code (e.g. `MBM2026` or friend's code) to claim welcome cashback.
  5. Click **"Get Instant OTP"**.
  6. The system dispatches a 6-digit OTP (for local test development, default test code: `123456`).
  7. Enter the 6 digits and click **"Verify & Access Account"**.
  8. Your wallet, previous orders, and personalized discounts immediately synchronize.
- **Flow 2: Email / Phone + Password**
  1. In the login modal, toggle to **"Password"** mode.
  2. Enter registered Email/Phone and Password.
  3. Click **"Sign In with Password"**.

---

### 2.2 Administrator Master Login (Admin Hub)
Administrators manage the catalog, routing engine, orders, KYC approvals, and staff roles.

- **URL:** `http://localhost:3000/admin` (or `/admin/login`)
- **Default Master Admin Credentials:**
  - **Username / Email:** `admin@megabachatmart.com` (or `9999999999`)
  - **Password:** `MBM#Admin2026`
- **Session Persistence:**
  - Session tokens are stored securely in `localStorage` under `mbm_admin_token` and `mbm_admin_user`.
  - In development/sandbox environments, visiting `/admin` automatically provisions an authenticated session with full **SUPER_ADMIN** privileges.

---

### 2.3 Merchant & Kirana Partner Login (Shop Portal)
Local shopkeepers and Kirana partners log in to their dedicated partner portal using the Store ID and temporary password dispatched to them by the Admin after KYC approval.

- **URL:** `http://localhost:3000/shop/login`
- **Credentials:**
  - **Store ID / Mobile:** Generated Shop ID (e.g., `MBM-SHP-834006-03` or registered mobile `9431109876`).
  - **Password:** The password received on WhatsApp/Email (e.g., `MBM#Chot834@2026`).
- **Quick Demo Testing:**
  - On `/shop/login`, click the **"Quick Test Merchant Accounts"** box for **Chotanagpur Tribal Hub** to automatically fill credentials and log in with one click.
- **Post-Login Redirection:** Automatically routes to `/shop/portal` where the shopkeeper can view orders and upload inventory in bulk via CSV.

---

### 2.4 SHG Producer Partner Login
Rural women cooperatives and Self Help Group producers access their producer portal to view procurement POs and payment settlements.

- **URL:** `http://localhost:3000/producer`
- **Credentials:** Registered SHG Member Mobile + OTP or Producer ID.

---

## 3. STEP 2: How to Add Admins & Manage Staff Roles (RBAC & 2FA)

To maintain absolute separation of duties, MegaBachatMart enforces **Role-Based Access Control (RBAC)** and **Two-Factor Authentication (2FA)** for all internal administrative staff.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ROLE-BASED ACCESS CONTROL                       │
├─────────────────────┬──────────────────────────────────────────────────┤
│ ROLE                │ PERMISSIONS                                      │
├─────────────────────┼──────────────────────────────────────────────────┤
│ SUPER_ADMIN         │ Full system access: Staff roles, DB, financial   │
│ STORE_MANAGER       │ Inventory adjustments, GRN POs, Hub open/close   │
│ DISPATCH_MANAGER    │ Rider assignments, 3PL fleet fallback, routing   │
│ INVENTORY_AUDITOR   │ Stock count adjustments, FEFO expiry quarantine  │
│ PICKUP_CASHIER      │ Handover verification (QR/OTP), Pay-at-Store     │
└─────────────────────┴──────────────────────────────────────────────────┘
```

### 3.1 Step-by-Step: Adding a New Admin / Staff Member
1. Log in to the Admin Dashboard (`/admin`).
2. In the left sidebar navigation, click **"Staff Roles & 2FA"** (tab icon: ShieldCheck).
3. Click the **"+ Provision New Staff Account"** button in the top right.
4. Fill in the Staff Member Form:
   - **Full Name:** e.g., `Pooja Sharma`
   - **Official Email:** e.g., `pooja.sharma@mymbmart.com`
   - **Mobile Number:** e.g., `9835012345`
   - **Assigned Store / Hub:** Select `Ranchi Central (MBM-RCH-01)`.
   - **Assigned Role:** Choose from the dropdown:
     - `SUPER_ADMIN`
     - `STORE_MANAGER`
     - `DISPATCH_MANAGER`
     - `INVENTORY_AUDITOR`
     - `PICKUP_CASHIER`
5. Click **"Save & Generate Staff Credentials"**.
6. The system generates an internal Staff ID (e.g. `MBM-STF-009`) and a temporary login password.

### 3.2 Step-by-Step: Enforcing Two-Factor Authentication (2FA)
1. On the **Staff Roles & 2FA** screen, locate the employee's row.
2. In the **2FA Status** column, click **"Enable 2FA / Setup TOTP"**.
3. A modal presents:
   - A standard **Authenticator QR Code** (compatible with Google Authenticator, Microsoft Authenticator, or Authy).
   - A 16-character secret key (e.g., `MBM2FAK779X4ABCD`).
4. The staff member scans the QR code with their mobile device.
5. Enter the 6-digit rolling TOTP code displayed on the phone to verify.
6. Once verified, the account's 2FA status turns **"ENFORCED (Active)"**. Every future login to `/admin` will require entering the TOTP code.

---

## 4. STEP 3: How to Onboard Merchant Shops & Kirana Partners

MegaBachatMart connects local neighborhood Kirana stores to quick commerce without forcing them to buy expensive hardware.

```
       PROSPECTIVE SHOP                     ADMIN DESK                    MERCHANT PORTAL
              │                                  │                               │
    Fill Registration & Docs                     │                               │
   (/shop/register or Sign In) ──POST Application─► Arrival in KYC Queue         │
              │                             (Status: PENDING_REVIEW)             │
              │                                  │                               │
              │                            Review FSSAI, Trade Lic,              │
              │                             Premises & Bank Details              │
              │                                  │                               │
              │                            Click: "Approve & Dispatch"           │
              │                                  │                               │
     Receive WhatsApp + Email ◄─Send Credentials─┤                               │
   • Store ID: MBM-SHP-834001-09                 │                               │
   • Password: MBM#Gpt834@2026                   │                               │
   • Portal URL: /shop/login                     │                               │
              │                                  │                               │
              └───────────────────Login with Credentials────────────────────────►│
                                                                                 │
                                                                           Upload Bulk CSV
                                                                                 │
                                                                           Products Live!
```

### 4.1 Shop Partner Application Submission (Public Storefront)
Prospective shopkeepers can apply directly from the website:
- **Option A:** Click **"Partner as Kirana Store"** in the top navigation bar.
- **Option B:** Open the **"Sign In / Join"** modal and click **"Kirana or Retail Shop Owner? Apply Now →"**.
- **Direct URL:** `http://localhost:3000/shop/register`

#### Step-by-Step Multi-Stage Application Form:
1. **Stage 1: Store & Proprietor Information**
   - Store Name (e.g., `Gupta Kirana & General Store`)
   - Proprietor Name (e.g., `Rajesh Gupta`)
   - WhatsApp Mobile Number (10 digits)
   - Email Address
   - Physical Store Address (Street, Landmark, Ward)
   - Postal Pincode (e.g., `834001`)
   - Business Model (`Kirana & Daily Grocery`, `Supermarket`, `Organic Produce`, `Dairy & Bakery`, or `SHG Cooperative`)
   - Years in Operation
2. **Stage 2: Statutory Licenses & KYC**
   - 14-Digit FSSAI Food License / Registration Number
   - Municipal Corporation Trade License Number
   - Proprietor / Firm PAN Card Number
   - (Optional) GSTIN Number
3. **Stage 3: Settlement Bank Account**
   - Bank Name (e.g., `State Bank of India, Main Branch Ranchi`)
   - Bank Account Number
   - Bank IFSC Code
4. **Stage 4: Review & Submit**
   - Review all entered fields and accept the Merchant Partner Agreement.
   - Click **"Submit Application for Admin Review"**.
   - An instant **Application Reference** is issued (e.g., `APP-RCH-2026-081`).

---

### 4.2 Admin Review, Credential Generation & Multi-Channel Dispatch
1. Log in to the Admin Dashboard (`/admin`).
2. Click **"Merchant Onboarding & KYC"** (tab with `Kirana` badge).
3. The queue displays all applications filtered by `PENDING_REVIEW`, `APPROVED`, or `REJECTED`.
4. Click **"Review & KYC"** on any pending application to open the review drawer.
5. In the drawer:
   - **Tab 1 (KYC & Details):** Verify store premises, business type, and bank account for daily settlements.
   - **Tab 2 (Uploaded Documents):** Review photos of Trade License certificate, FSSAI certificate, storefront, and PAN card.
   - **Checklist:** Confirm FSSAI validity, address within serviceable delivery radius, and penny-drop bank account check.
   - **Tab 3 (Credentials & Dispatch):**
     - **Store ID:** System auto-suggests formatted ID: `MBM-SHP-[PINCODE]-[SEQ]` (e.g. `MBM-SHP-834001-09`).
     - **Password:** System auto-generates a secure human-readable password (e.g. `MBM#Gupt834@2026`) with a "Regenerate" and "Copy" button.
     - **WhatsApp Dispatch Simulation:** Shows exact preview of WhatsApp business notification.
     - **Email Dispatch Simulation:** Shows transactional HTML email format.
6. Click **"Approve & Dispatch Credentials"**.
7. The account status switches to `APPROVED` and active merchant credentials are automatically recorded.

---

## 5. STEP 4: How to Add Products & Ingest Inventory

There are two primary ways to list products on MegaBachatMart:
1. **Method A (Bulk CSV via Merchant Portal):** Used by partner Kirana stores to upload hundreds of products in seconds.
2. **Method B (Master Catalogue via Admin Dashboard):** Used by platform admins to define official Master SKUs, categories, and FEFO batches.

---

### 5.1 Method A: Bulk CSV Product Upload (Merchant Portal)

This allows any onboarded shopkeeper to upload their inventory spreadsheet. When confirmed, **products are automatically published to the live storefront catalog** so customers can purchase them immediately!

#### Step-by-Step Ingestion:
1. Log in to the Merchant Portal at `http://localhost:3000/shop/login`.
2. Once on `/shop/portal`, locate the **"Bulk Product Upload via CSV"** section.
3. Click **"Download CSV Template"** (or use the one-click **"Load 6 Demo FMCG Items"** button for testing).
4. The official CSV structure is:
   ```csv
   productId,productName,category,unit,mrp,bachatPrice,stockQuantity,expiryDate,batchNumber,image,isReturnable
   ```

#### Field Specifications:
| Column | Type | Mandatory? | Description & Rules | Example |
|---|---|---|---|---|
| `productId` | String | Yes | Unique item code | `RCH-KRN-101` |
| `productName` | String | Yes | Brand & full item description | `Fortune Sunlite Sunflower Oil` |
| `category` | Enum | Yes | `Groceries`, `Daily Essentials`, `SHG Specials`, `Spices`, `Home & Kitchen` | `Groceries` |
| `unit` | String | Yes | Weight / volume packaging unit | `1 Litre Pouch` |
| `mrp` | Number | Yes | Original Printed MRP ($\text{₹}$) | `160` |
| `bachatPrice` | Number | Yes | Offered discounted selling price ($\le \text{MRP}$) | `138` |
| `stockQuantity` | Integer | Yes | Available stock units in store | `60` |
| `expiryDate` | YYYY-MM-DD | Yes | Product expiration date for FEFO | `2027-04-15` |
| `batchNumber` | String | Yes | Manufacturer batch number | `BCH-FTN-2026-A1` |
| `image` | File / Image | Optional | Product photo file name (e.g. `RCH-KRN-101.jpg`) or upload real photo directly in table | `RCH-KRN-101.jpg` |
| `isReturnable` | Boolean | Optional | `true` or `false` | `true` |

5. Drag & Drop or select your `.csv` file in the upload zone.
6. The client parser automatically validates every row:
   - Verifies MRP $> 0$.
   - Verifies offered `bachatPrice` $\le \text{MRP}$.
   - Calculates customer savings ($\text{MRP} - \text{Bachat Price}$) and discount percentage.
7. An interactive **Validated Products Preview Table** appears with item thumbnails, discounts, and batch dates.
8. Click the emerald button: **"Publish & Add to Main Site"**.
9. The system immediately:
   - Registers each SKU and stock bucket in `inventoryStore.ts`.
   - Records the batch receipt.
   - Prepends the newly uploaded items to the dynamic storefront catalog (`CATALOG_PRODUCTS`).
   - Tags each item with `Sold by: [Store Name] ([Pincode])`.
10. Click **"View Newly Added Items on Storefront →"** to see them live on `/shop`!

---

### 5.2 Method B: Master Catalogue & Inventory SKU Creation (Admin Dashboard)

Admins can manage the central Master Catalogue and Dark Store Hub SKUs:
1. Log in to `/admin`.
2. In the left navigation, click **"Inventory & SKUs"**.
3. Select the **"Products & SKUs"** sub-tab.
4. Click **"+ Add New Master SKU"**.
5. Fill in the Master SKU fields:
   - **SKU Code:** Follows the standard naming convention:
     $$\text{Format: } \text{MB-}\{\text{CATEGORY}\}\text{-}\{\text{PRODUCT}\}\text{-}\{\text{VARIANT}\}$$
     *Example:* `MB-GRO-AASH-5K` (MegaBachatMart - Groceries - Aashirvaad - 5kg)
   - **Product Name & Brand:** e.g., `Aashirvaad Superior MP Sharbati Whole Wheat Atta`
   - **Barcode / EAN:** 13-digit retail barcode (e.g. `8901030382910`)
   - **Category & Unit:** e.g., `Groceries`, `5 kg Pack`
   - **MRP & Selling Price:** e.g., MRP ₹295, Selling Price ₹249
   - **HSN Code:** 8-digit GST HSN code (e.g., `19041090`)
   - **FEFO / Batch Tracking:** Toggle `ON` for expiry-sensitive foods.
6. Click **"Save SKU"**.
7. To add inventory units, switch to the **"Purchasing & GRN"** sub-tab and post a Goods Receipt Note (GRN) with batch number, expiry date, and received quantity.

---

## 6. STEP 5: How Consumers Browse, Select, and Buy

Once products are listed (either via Kirana bulk CSV or Master Admin), consumers can immediately purchase them through the customer storefront.

```
                           CUSTOMER STOREFRONT JOURNEY
                                       │
                        1. Visit /shop or / (Homepage)
                                       │
                        2. Location & Serviceability Check
                           (Ranchi Central Hub 834001)
                                       │
                        3. Browse Categories & Kirana Badges
                           ("Sold by: Gupta Kirana Store")
                                       │
                        4. Add to Cart & Choose Fulfilment
                                  ┌────┴────┐
                                  ▼         ▼
                         20-Min Delivery  Self-Pickup (Slot Selection)
                                  └────┬────┘
                                       │
                        5. Atomic Stock Reservation (15-min TTL)
                                       │
                        6. Checkout & Payment
                           (UPI / NetBanking / Cards / Pay at Store / COD)
                                       │
                        7. Handover Verification
                           (Delivery OTP or Counter QR Scan)
```

### 6.1 Browsing & Pin Code Serviceability Check
1. Open the storefront at `http://localhost:3000/shop`.
2. Click **"Ranchi Central, Main Road (834001)"** at the top of the catalog to change or verify location.
3. The customer can either click **"Detect My Current Location"** (GPS) or enter their 6-digit Pincode (e.g. `834001`).
4. The system calls `/api/location/serviceability` to verify that the address falls inside the active dark store / Kirana delivery polygon.

### 6.2 Selecting Items & Adding to Cart
1. Use category filters (`20-Min Quick Commerce`, `Groceries`, `SHG Handcrafted`, `Daily Needs`) or search for any item.
2. Products uploaded by partner shops prominently display:
   - Item image and pack size
   - MRP with strikethrough and bold Bachat Price
   - Discount tag (e.g. `24% OFF`)
   - Micro-cashback reward tag (e.g. `Earn ₹15 Cashback`)
   - Partner Store Badge: `Sold by: [Store Name] (Pincode)`
3. Click the orange **"+ Add"** button. The item is placed in the Cart Drawer with real-time savings calculations.

### 6.3 Choosing Fulfilment: 20-Min Delivery vs Self-Pickup
1. Click the shopping cart icon on the top right to open the **Cart Drawer**.
2. Select your fulfilment preference:
   - **Option 1: ⚡ 20–30 Min Home Delivery** — Dispatch rider assigned from nearest hub.
   - **Option 2: 🏪 Self-Pickup (Ranchi Central Dark Store)** — Zero delivery fees, plus select a convenient 30-minute collection time slot (e.g. `Today, 5:30 PM - 6:00 PM`).
3. Click **"Proceed to Checkout"**.

### 6.4 Atomic Stock Reservation & Payment
1. When checkout is initiated, the system creates a **Soft Reservation** for all order items with a strict 15-minute TTL to ensure no two customers purchase the last unit.
2. Choose your payment method:
   - **Online UPI / QR:** Instant cashless payment via Google Pay, PhonePe, Paytm, or BHIM.
   - **Cash on Delivery (COD):** Pay delivery partner upon arrival.
   - **Pay at Store:** For Self-Pickup orders, pay via cash or UPI at the dark store collection counter.
3. Click **"Place Order"**.
4. Upon successful payment confirmation, the reservation promotes from `SOFT` to `HARD`.

### 6.5 Order Fulfilment & Handover Verification
- **For Delivery Orders:**
  - Rider is assigned via the Dispatch Board (`/admin` -> Dispatch Board).
  - Customer receives live tracking with assigned rider name and phone.
  - Delivery is completed when the customer provides their **4-digit secret delivery OTP** to the rider.
- **For Self-Pickup Orders:**
  - Customer receives a dynamic pickup QR code and 4-digit backup OTP.
  - Customer visits the Ranchi Central collection counter during their scheduled slot.
  - Store cashier scans the customer's QR code or verifies OTP to confirm order handover.

---

## 7. Code Map & Architecture Directory (Junior Developer Tour)

For junior developers joining the team, this map explains where key modules reside in the repository:

```
mymbmart/
├── docs/                                  # Living Documentation & ADRs
│   ├── adr/                               # Architecture Decision Records
│   │   ├── ADR-001-stack-and-monorepo.md  # Why Next.js + TypeScript + Node
│   │   ├── ADR-002-append-only-ledgers.md # Why financial ledgers are append-only
│   │   └── ADR-003-row-lock-reservation.md# Concurrency & atomic stock locking
│   └── MASTER_OPERATIONS_AND_USER_GUIDE.md# This authoritative guide
├── prisma/
│   ├── schema.prisma                      # Complete 75-table consolidated schema
│   └── migrations/                        # SQL migration scripts & ledger triggers
├── src/
│   ├── app/                               # Next.js App Router (Pages & APIs)
│   │   ├── page.tsx                       # Consumer Homepage & Landing
│   │   ├── shop/                          # Consumer Storefront (/shop)
│   │   │   ├── login/page.tsx             # Merchant Partner Login Portal
│   │   │   ├── portal/page.tsx            # Merchant Store & Bulk CSV Uploader
│   │   │   └── register/page.tsx          # Public Shop Registration & KYC
│   │   ├── admin/                         # Admin Operations Dashboard
│   │   │   ├── page.tsx                   # Master Admin Hub & Navigation
│   │   │   └── login/page.tsx             # Staff Login
│   │   ├── api/                           # REST & Dynamic API Endpoints
│   │   │   ├── products/route.ts          # Live Storefront Catalog API
│   │   │   ├── checkout/                  # Cart & Order Placement APIs
│   │   │   └── v1/
│   │   │       ├── admin/merchants/       # Merchant KYC Approval & Dispatch API
│   │   │       ├── shop/apply/            # Public Shop Application API
│   │   │       ├── shop/login/            # Merchant Authentication API
│   │   │       ├── shop/upload-csv/       # Bulk CSV Ingestion API
│   │   │       ├── shop/template-csv/     # Sample CSV Download API
│   │   │       └── routing/               # Hyperlocal Routing & Availability APIs
│   │   └── api-docs/page.tsx              # Interactive OpenAPI Documentation UI
│   ├── components/                        # Reusable React UI Components
│   │   ├── admin/
│   │   │   └── MerchantOnboardingTab.tsx  # Admin KYC Review & WhatsApp Dispatch UI
│   │   ├── Navbar.tsx                     # Header Navigation, Cart Counter & Links
│   │   ├── StoreCatalog.tsx               # Product Grid, Filter Tabs & Shop Badges
│   │   ├── CartDrawer.tsx                 # Shopping Cart, Savings & Slot Selection
│   │   ├── AuthModal.tsx                  # OTP / Password Login & Partner Link
│   │   └── RoutingAdminTab.tsx            # Hyperlocal Routing Diagnostics UI
│   └── lib/                               # Core Domain Services & Stores
│       ├── catalog.ts                     # Live Catalog Store & Dynamic Ingestion
│       ├── shopPartnerStore.ts            # Shop Partner Model, KYC, CSV Parser
│       ├── inventoryStore.ts              # Atomic Stock Ledger & FEFO Batches
│       ├── routingEngine.ts               # 11 Hard Filters & 8 Scoring Factors
│       ├── ordersStore.ts                 # Order State Machine & Dispatch Board
│       ├── pickupSlotsStore.ts            # Ranchi Central Dark Store Slot Manager
│       └── types.ts                       # Shared TypeScript Interfaces
└── public/                                # Static Web Assets (Optimized)
    ├── images/products/                   # Clean local product images
    └── LOgo.jpeg                          # Official Brand Logo
```

---

## 8. Troubleshooting Runbook & Junior FAQs

### Q1: Where do newly uploaded CSV products go? Why do customers see them immediately?
**Answer:** When a shop partner uploads a CSV on `/shop/portal`, the endpoint `/api/v1/shop/upload-csv` invokes `shopPartnerStore.ingestBulkCsvProducts()`. This function simultaneously:
1. Registers each product as an SKU in `inventoryStore.ts` and records batch receipt.
2. Injects formatted product records into `catalog.ts` via `addCatalogProducts()`.
3. Prepends them to the front of `CATALOG_PRODUCTS`. Because the storefront catalog on `/shop` fetches from `/api/products` on load, the new products appear at the top of the browse list instantly with the partner's store badge.

### Q2: What happens if two customers checkout the last item at the exact same second?
**Answer:** The system uses **Pessimistic Row-Locking (ADR-003)**. When checkout preview begins, `createStockReservation()` acquires a database lock on the SKU row (`SELECT ... FOR UPDATE`). Only the first transaction successfully locks the unit and gets an active soft reservation. The second transaction immediately receives a friendly alert: *"Item just sold out in your locality"* and the order is gracefully prevented before payment deduction.

### Q3: How do I test the entire Merchant Onboarding flow locally?
1. Open `http://localhost:3000/shop/register` and submit a new Kirana store application (e.g. `Ranchi Daily Bazaar`).
2. Note the generated application reference (e.g. `APP-RCH-2026-083`).
3. Open `http://localhost:3000/admin` and click **"Merchant Onboarding & KYC"** in the left sidebar.
4. Click **"Review & KYC"** on your application.
5. Review the documents, inspect the generated Store ID and Password, and click **"Approve & Dispatch Credentials"**.
6. Open `http://localhost:3000/shop/login` in an incognito window, enter the generated Store ID and Password, and sign in.
7. Click **"Load 6 Demo FMCG Items"** and click **"Publish & Add to Main Site"**.
8. Open `http://localhost:3000/shop` to see your items live and purchasable on the customer storefront!

### Q4: How do I check API health and endpoints?
- **Health Check:** `http://localhost:3000/api/health` returns `{ status: "ok", timestamp: ... }`.
- **Interactive OpenAPI Documentation:** `http://localhost:3000/api-docs` provides an in-browser Swagger/Redoc UI for all endpoints.

---

## 9. Definition of Done & Quality Standards

Every future Pull Request affecting MegaBachatMart must verify:
- [x] Zero redundant or unused mock files.
- [x] Public asset footprint under 5MB.
- [x] `npm run build` compiles with 0 TypeScript/linter errors.
- [x] Clear TSDoc header comments on every service and store file.
- [x] Updated documentation in `docs/MASTER_OPERATIONS_AND_USER_GUIDE.md` whenever new features or API parameters are introduced.
