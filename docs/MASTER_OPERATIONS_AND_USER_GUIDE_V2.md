---
title: MegaBachatMart — Master Operations & Step-by-Step User Guide (Version 2.0)
audience: A1 (Junior Developer Onboarding), A2 (Daily Engineering Work), A3 (Tech Lead / Architecture Review), A4 (Owner, Store Managers & Non-Technical Stakeholders), A5 (Future Maintainers)
status: Authoritative (Production-Ready / Phase 1 Ranchi Live)
owner: @tech-lead & @engineering-team
version: 2.0
last_updated: 2026-11-17
related: [megabachatmart_master_technical_srs.md, megabachatmart_v2_consolidated_architecture.md, megabachatmart_technical_risk_register.md, ADR-001, ADR-002, ADR-003]
---

# MegaBachatMart — Master Operations & Step-by-Step User Guide (v2.0)

> **"Every line of code has an unambiguous purpose. Every business actor has an explicit, tested workflow. This document is the single authoritative operating manual for MegaBachatMart — designed so any junior engineer, retail store manager, customer support executive, or platform administrator can understand, operate, and maintain every feature without ambiguity."**

---

## 1. System Overview & The Five Key Actors

MegaBachatMart is an **agent-ready, dual-commerce hyperlocal marketplace** engineered for Tier-2 and Tier-3 Indian cities (launched in Ranchi Central, Pincode `834001`). The platform bridges the gap between quick-commerce speed and neighborhood retail by uniting:
1. **20–30 Minute Quick-Commerce Home Delivery** powered by local neighborhood partner Kiranas.
2. **Dark Store Collection Counter (Self-Pickup)** offering scheduled 30-minute collection slots with zero delivery fees.
3. **Hyperlocal Shop Digitalization** with zero unfair commissions, instant bulk CSV inventory onboarding, and working capital credit lines.
4. **Authentic Rural Self-Help Group (SHG) & Farmer Supply Chains** providing direct farm produce, cold-pressed oils, and tribal handicrafts.
5. **Autonomous AI Agent Readiness** allowing in-browser WebMCP and external LLM crawlers to discover inventory, verify serviceability, and read token-efficient content.

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
│  - Browse Local SKUs  │         │  - Local Shop Store   │ │  - Artisanal Goods    │
│  - 20-min Quick Deliv │         │  - Bulk CSV Ingestion │ │  - Direct Farm Supply │
│  - Dark Store Pickup  │         │  - 20-min Dispatch    │ │  - Community Pricing  │
│  - Wallet & Cashback  │         │  - Partner Portal Deck│ │  - Producer Portal    │
│  - UPI & QR Payments  │         │  - T+1 Bank Payouts   │ │  - Fair Trade POs     │
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
            │  - Audit Reports│  - Micro-Hub Ops│
            └─────────────────┴─────────────────┘
```

---

## 2. Infrastructure, Subdomains & Hostinger Topology

MegaBachatMart is deployed across three primary domain endpoints to guarantee clean separation between public consumer traffic, partner operations, and administrative functions:

### 2.1 Subdomain Mapping Architecture

| Domain / Subdomain | Target Directory / Port | Purpose & Target Users |
|---|---|---|
| **`mymbmart.com`** | `/home/u369924234/domains/mymbmart.com/public_html` | **Consumer Storefront & Public Landing.** Catalog browsing, cart, checkout, order tracking, savings calculator. |
| **`partners.mymbmart.com`** | `/home/u369924234/domains/mymbmart.com/public_html/partners` | **Dedicated Partner Onboarding & Merchant Deck.** Hub for Kirana owners, SHG women cooperatives, and FPOs to register, sign in, manage inventory, and track settlements. |
| **`admin.mymbmart.com`** | `/home/u369924234/domains/mymbmart.com/public_html/admin` | **Central Operations Hub.** Super admin cockpit, KYC approvals, dispatch monitor, staff RBAC/2FA, and consolidated master reporting. |

### 2.2 Hostinger hPanel Configuration Rules
1. **Subdomain Creation:**
   - In Hostinger hPanel under **Websites → Domains → Subdomains**, create `partners` and `admin`.
   - Set the custom folder directory paths as listed in the table above.
2. **Reverse Proxy / Next.js Routing:**
   - In single-instance Node.js deployments, Nginx or Next.js `middleware.ts` inspects the incoming `Host` header (`partners.mymbmart.com` or `admin.mymbmart.com`) and transparently rewrites requests to `/partners` and `/admin` respectively, while retaining full path fidelity.

---

## 3. STEP 1: How to Login as Every Actor Type

MegaBachatMart enforces role-isolated authentication paths with specific session storage keys.

### 3.1 Consumer Login (Storefront)
Consumers can authenticate from any page without mandatory passwords:
- **Location:** Click **"Sign In / Join"** in the top navigation bar (`/` or `/shop`).
- **Path A: Passwordless Mobile OTP (Recommended)**
  1. Click **"Sign In / Join"** to launch the authentication modal.
  2. Select the **"Mobile OTP"** tab.
  3. Enter the 10-digit Indian mobile number (e.g. `9876543210`).
  4. *(Optional)* Enter a Referral Code (e.g. `MBM2026`) to activate ₹50 welcome cashback.
  5. Click **"Get Instant OTP"**.
  6. The system sends a 6-digit OTP (for local development/testing, default test code: `123456`).
  7. Enter the 6 digits and click **"Verify & Access Account"**.
  8. The user's profile, digital wallet balance, and order history load instantly.
- **Path B: Mobile / Email + Password**
  1. Toggle to the **"Password"** tab in the modal.
  2. Enter registered credentials and click **"Sign In with Password"**.

---

### 3.2 Master Administrator Login (Admin Hub)
Administrators supervise the platform, approve merchant KYC, monitor delivery fleets, and audit financial ledgers.
- **URL:** `https://admin.mymbmart.com` (or `http://localhost:3000/admin`)
- **Default Master Admin Credentials:**
  - **Username / Email:** `admin@megabachatmart.com` (or `9999999999`)
  - **Password:** `MBM#Admin2026`
- **Security & Session Protocol:**
  - Tokens are stored in `localStorage` under `mbm_admin_token` and `mbm_admin_user`.
  - For local development, navigating to `/admin` auto-provisions a `SUPER_ADMIN` session for uninterrupted development.

---

### 3.3 Merchant Partner & Kirana Store Login (Partner Deck)
Local shop owners access their operational deck using the Store ID and temporary password dispatched to them by the Admin after KYC approval.
- **URL:** `https://partners.mymbmart.com` (or `/shop/login`)
- **Credentials:**
  - **Store ID / Mobile:** Generated Store ID (e.g., `MBM-SHP-834006-03` or registered mobile `9431109876`).
  - **Password:** Dispatched password (e.g., `MBM#Chot834@2026`).
- **One-Click Pre-Approved Testing:**
  - On `/partners` and `/shop/login`, click the **"Chotanagpur Tribal Hub"** card to auto-populate test credentials and sign in instantly.
- **Post-Login Redirection:** Routes directly to `/shop/portal` (the Merchant Operations Cockpit).

---

### 3.4 SHG Producer Partner Login
Rural women cooperatives and Self-Help Groups access their producer portal to review direct purchase orders (POs) and fair-trade settlements.
- **URL:** `http://localhost:3000/producer`
- **Credentials:** Registered SHG Contact Mobile + OTP or Producer ID (`MBM-PRD-XXX`).

---

## 4. STEP 2: How to Add Admins & Manage Staff Roles (RBAC & 2FA)

To enforce strict segregation of duties and comply with ISO/IEC 27001 security standards, internal administration uses **Role-Based Access Control (RBAC)** and **Two-Factor Authentication (2FA)**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ROLE-BASED ACCESS CONTROL                       │
├─────────────────────┬──────────────────────────────────────────────────┤
│ ROLE                │ PERMISSIONS & OPERATIONAL BOUNDARIES             │
├─────────────────────┼──────────────────────────────────────────────────┤
│ SUPER_ADMIN         │ Full system access: Staff roles, DB, financial   │
│ STORE_MANAGER       │ Inventory adjustments, GRN POs, Hub open/close   │
│ DISPATCH_MANAGER    │ Rider assignments, 3PL fleet fallback, routing   │
│ INVENTORY_AUDITOR   │ Stock count adjustments, FEFO expiry quarantine  │
│ PICKUP_CASHIER      │ Handover verification (QR/OTP), Pay-at-Store     │
└─────────────────────┴──────────────────────────────────────────────────┘
```

### 4.1 Step-by-Step: Adding a New Admin or Staff Member
1. Log in to the Admin Dashboard (`/admin`).
2. In the left navigation menu, click **"Staff Roles & 2FA"** (tab with the ShieldCheck icon).
3. Click the emerald **"+ Provision New Staff Account"** button in the top right.
4. Complete the Staff Provisioning Form:
   - **Full Name:** e.g., `Pooja Sharma`
   - **Official Email:** e.g., `pooja.sharma@mymbmart.com`
   - **Mobile Number:** e.g., `9835012345`
   - **Assigned Hub:** Select primary operating micro-hub (e.g., `Ranchi Central (MBM-RCH-01)`).
   - **Assigned Role:** Select from dropdown (`SUPER_ADMIN`, `STORE_MANAGER`, `DISPATCH_MANAGER`, `INVENTORY_AUDITOR`, `PICKUP_CASHIER`).
5. Click **"Save & Generate Staff Credentials"**.
6. The system generates an internal Staff ID (e.g. `MBM-STF-009`) and a temporary login password.

### 4.2 Step-by-Step: Enforcing Two-Factor Authentication (2FA)
1. On the **Staff Roles & 2FA** screen, find the staff member's record.
2. In the **2FA Status** column, click **"Enable 2FA / Setup TOTP"**.
3. A modal presents:
   - A standardized **Authenticator QR Code** (compatible with Google Authenticator, Microsoft Authenticator, or Authy).
   - A base32 secret key (e.g. `MBM2FAK779X4ABCD`).
4. The staff member scans the QR code with their mobile device.
5. Enter the 6-digit rolling code displayed on the authenticator app.
6. Click **"Verify & Activate 2FA"**. The account status switches to **"ENFORCED"**, requiring TOTP verification on every subsequent login.

---

## 5. STEP 3: How to Onboard Kirana Stores & SHGs

MegaBachatMart connects local neighborhood Kirana stores to quick commerce with zero upfront hardware investment.

```
       PROSPECTIVE SHOP                     ADMIN DESK                    MERCHANT PORTAL
              │                                  │                               │
    Fill Registration Form                       │                               │
   (/partners or /shop/register)──POST Application─► Arrival in KYC Queue         │
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
   • Portal URL: /partners                       │                               │
              │                                  │                               │
              └───────────────────Login with Credentials────────────────────────►│
                                                                                 │
                                                                           Upload Bulk CSV
                                                                                 │
                                                                           Products Live!
```

### 5.1 Merchant Partner Application Submission
Prospective partners can apply from multiple touchpoints:
- **URL A:** `https://partners.mymbmart.com` (Click **"Join as Partner"**).
- **URL B:** `http://localhost:3000/shop/register`
- **URL C:** Storefront Header (Click **"Partner as Kirana Store"**).

#### Multi-Stage Application Form:
1. **Stage 1: Store & Proprietor Information**
   - Store Name (e.g., `Gupta Kirana & General Store`)
   - Proprietor Name (e.g., `Rajesh Gupta`)
   - WhatsApp Mobile Number (10 digits)
   - Store Physical Address (Street, Ward, Landmark)
   - Postal Pincode (e.g., `834001`)
   - Business Model (`Kirana & Daily Grocery`, `Supermarket`, `Organic Produce`, `SHG Cooperative`)
2. **Stage 2: Statutory Licenses & KYC**
   - 14-Digit FSSAI Food License / Registration Number
   - Municipal Trade License Number
   - Proprietor / Firm PAN Card Number
   - *(Optional)* GSTIN Number
3. **Stage 3: Settlement Bank Account**
   - Bank Name & Branch (e.g., `State Bank of India, Ranchi Main Branch`)
   - Account Number
   - IFSC Code
4. **Stage 4: Review & Agreement**
   - Accept the Merchant Partner Agreement (0% platform commission on staples, daily T+1 payout terms).
   - Click **"Submit Application for Admin Review"**. Instant reference issued (e.g. `APP-RCH-2026-081`).

---

### 5.2 Admin Review, KYC Approval & Multi-Channel Dispatch
1. Log in to the Admin Dashboard (`/admin`).
2. Click **"Merchant Onboarding & KYC"** in the sidebar.
3. Review the pending applications table.
4. Click **"Review & KYC"** on any applicant to open the audit drawer:
   - **Tab 1 (KYC & Details):** Verify store physical location, contact info, and bank details.
   - **Tab 2 (Uploaded Documents):** Inspect uploaded certificates for FSSAI, Trade License, PAN, and storefront photos.
   - **Checklist:** Confirm statutory validity, serviceability radius, and penny-drop bank account check.
   - **Tab 3 (Credentials & Dispatch):**
     - **Store ID:** System auto-generates format `MBM-SHP-[PINCODE]-[SEQ]` (e.g. `MBM-SHP-834001-09`).
     - **Password:** System auto-generates a secure readable password (e.g. `MBM#Gupt834@2026`).
     - **WhatsApp Dispatch:** Shows live preview of WhatsApp template message.
     - **Email Dispatch:** Shows live preview of official HTML welcome email.
5. Click **"Approve & Dispatch Credentials"**.
6. The applicant's record is marked `APPROVED`, and their account is immediately active for sign-in.

---

## 6. STEP 4: How to Add Products & Ingest Inventory

There are two primary methods for listing products on MegaBachatMart:
- **Method A (Bulk CSV via Merchant Portal):** Used by partner Kirana stores to list hundreds of items in seconds.
- **Method B (Master Catalogue via Admin Dashboard):** Used by platform admins to define central Master SKUs, categories, and warehouse batches.

---

### 6.1 Method A: Bulk CSV Product Upload (Merchant Portal)

When a partner store uploads a validated CSV, **items are published to the storefront catalog instantly** tagged with their store name.

#### Step-by-Step Procedure:
1. Log in to the Partner Portal (`/shop/portal` or `/partners`).
2. Scroll to the **"Bulk Product Upload via CSV"** section.
3. Click **"Download CSV Template"** (or click **"Load 6 Demo FMCG Items"** for quick testing).
4. The official CSV format contains 11 columns:
   ```csv
   productId,productName,category,unit,mrp,bachatPrice,stockQuantity,expiryDate,batchNumber,imageUrl,isReturnable
   ```

#### Column Specifications & Validation Rules:
| Column | Type | Required? | Validation Rules | Example |
|---|---|---|---|---|
| `productId` | String | Yes | Unique store SKU code | `RCH-KRN-101` |
| `productName` | String | Yes | Full product name including brand | `Fortune Sunlite Sunflower Oil` |
| `category` | Enum | Yes | `Groceries`, `Daily Essentials`, `SHG Specials`, `Spices`, `Home & Kitchen` | `Groceries` |
| `unit` | String | Yes | Packaging unit & weight | `1 Litre Pouch` |
| `mrp` | Number | Yes | Printed Maximum Retail Price ($\text{₹}$) | `160` |
| `bachatPrice` | Number | Yes | Discounted selling price ($\le \text{MRP}$) | `138` |
| `stockQuantity` | Integer | Yes | Count of available units ($\ge 0$) | `60` |
| `expiryDate` | Date | Yes | Expiration date (`YYYY-MM-DD`) for FEFO compliance | `2027-04-15` |
| `batchNumber` | String | Yes | Manufacturer batch identification | `BCH-FTN-2026-A1` |
| `imageUrl` | URL | Optional | Web image URL. If omitted, smart category fallback renders | `https://images.unsplash.com/...` |
| `isReturnable` | Boolean | Yes | `true` or `false` | `true` |

5. Drag & Drop your `.csv` file onto the upload dropzone.
6. The client parser validates each row:
   - Verifies $\text{MRP} > 0$ and $\text{bachatPrice} \le \text{MRP}$.
   - Verifies expiration date is in the future.
   - Computes customer savings ($\text{MRP} - \text{Bachat Price}$) and discount percentage.
7. An interactive **Validated Products Preview Table** appears.
8. Click **"Publish & Add to Main Site"**.
9. The system immediately:
   - Registers each SKU in `inventoryStore.ts`.
   - Records the incoming batch receipt.
   - Prepends newly uploaded items to the active storefront catalog (`CATALOG_PRODUCTS`).
   - Tags each product with `Sold by: [Store Name] ([Pincode])`.
10. Click **"View Newly Added Items on Storefront →"** to inspect them live on `/shop`!

---

### 6.2 Method B: Master Catalogue & SKU Creation (Admin Dashboard)

Admins control the central master catalog across all dark stores and regional hubs:
1. Log in to `/admin`.
2. In the sidebar, select **"Inventory & SKUs"**.
3. Choose the **"Products & SKUs"** sub-tab.
4. Click **"+ Add New Master SKU"**.
5. Fill in the master product details:
   - **SKU Code:** Standard convention:
     $$\text{Format: } \text{MB-}\{\text{CATEGORY}\}\text{-}\{\text{BRAND}\}\text{-}\{\text{VARIANT}\}$$
     *Example:* `MB-GRO-AASH-5K` (Aashirvaad Atta 5kg)
   - **Product Name & Brand:** e.g., `Aashirvaad Superior MP Sharbati Whole Wheat Atta`
   - **Barcode / EAN:** 13-digit EAN-13 barcode (e.g. `8901030382910`)
   - **Category & Unit:** e.g., `Groceries`, `5 kg Pack`
   - **MRP & Selling Price:** e.g., MRP ₹295, Selling Price ₹249
   - **HSN Code:** 8-digit GST HSN code (e.g., `19041090`)
   - **FEFO / Batch Tracking:** Toggle `ON` for perishable staples.
6. Click **"Save SKU"**.
7. To credit physical stock, switch to the **"Purchasing & GRN"** sub-tab and record a Goods Receipt Note (GRN) with batch number, manufacturing date, expiry date, and unit cost.

---

### 6.3 Method C: Dynamic Product Image Upload API

Merchants and administrators can upload product photos without manually hosting them:
- **API Endpoint:** `POST /api/products/image-upload`
- **Payload:** `multipart/form-data` with `file: [IMAGE_FILE]` and `productId: [ID]`.
- **Allowed Formats:** `.jpg`, `.jpeg`, `.png`, `.webp` (Max size: 5MB).
- **Storage:** Persisted to `/public/images/products/[productId].webp` with automated compression.
- **Smart Fallback Engine:** If no custom image is supplied, the storefront dynamically serves high-resolution, lightweight SVG category vectors to ensure fast loading under 2G/3G connections.

---

## 7. Payment Processing & Financial Architecture

### 7.1 Transition UPI / PhonePe Account (`9801506511@ybl`)
While the corporate bank payment gateway undergoes final underwriting (4–5 business days), MegaBachatMart processes cashless transactions via an audited, direct UPI gateway:
- **Official Registered UPI ID:** `9801506511@ybl`
- **Account Beneficiary:** MegaBachatMart / Futurenxt
- **Deep-Link Generation:** During checkout in [`CartDrawer.tsx`](file:///f:/Futurenxt/mymbmart/src/components/CartDrawer.tsx), the application constructs dynamic UPI intent URLs:
  ```text
  upi://pay?pa=9801506511@ybl&pn=MegaBachatMart&am=[TOTAL_AMOUNT]&cu=INR&tn=Order_[ORDER_ID]
  ```
- **Mobile Experience:** Tapping "Pay via UPI App" on mobile directly launches PhonePe, Google Pay, or Paytm with the exact order total and reference ID pre-filled.
- **Desktop Experience:** An on-screen QR code and a one-click "Copy UPI ID" button allow instant scanning and payment verification.

### 7.2 Official Transactional SMTP Mailer
Transactional receipts, KYC credentials, and dispatch alerts are routed through the official Hostinger SMTP server:
- **SMTP Host:** `smtp.hostinger.com`
- **Port:** `465` (SSL) / `587` (TLS)
- **Official From Address:** `support@mymbmart.com`
- **Authentication Password:** `Mymbmart@99`
- **Testing Endpoint:** `POST /api/admin/test-smtp` allows administrators to trigger a diagnostic handshake and confirm mail delivery.

---

## 8. Financial Cockpit & One-Click Report Generation

Both the Partner Deck and Admin Dashboard feature real-time financial cockpits and CSV report generators implemented in [`src/lib/reportGenerator.ts`](file:///f:/Futurenxt/mymbmart/src/lib/reportGenerator.ts).

### 8.1 Partner Portal Financial Deck (`/shop/portal`)
Tailored specifically for the logged-in merchant store:
- **Total Net Sales GMV:** Aggregate gross merchandise value generated by orders fulfilled by this shop.
- **Customer Refunds Processed:** Audited return/refund debits against store accounts.
- **B2B Working Capital Credit Line (Udhar Khata):**
  - Displays total sanctioned credit limit (e.g. ₹50,000).
  - Displays active balance drawn for bulk FMCG procurement.
  - Displays remaining available credit.
- **Daily T+1 Bank Payout:** Live calculation of funds queued for daily NEFT/IMPS settlement to the merchant's registered bank account.
- **"Generate Shop Report" Button:**
  - One-click trigger that compiles a comprehensive CSV statement (`shop_report_[STORE_ID]_[DATE].csv`).
  - Columns include: `OrderId`, `OrderDate`, `DeliveryType`, `DispatchedItems`, `GrossAmount`, `CommissionDeducted`, `RefundAdjustment`, `NetPayoutDue`, and `SettlementStatus`.

### 8.2 Admin Dashboard Master Audit Deck (`/admin`)
Aggregated across all dark stores, partner Kirana hubs, and SHG cooperatives in Jharkhand:
- **Consolidated GMV:** Total network transactions across all active pincodes.
- **Total Customer Refunds:** System-wide return metrics and dispute resolution logs.
- **Platform Commission Ledger:** Net retained margins from non-staple FMCG sales.
- **Inventory Valuation:** Real-time monetary value of stock across all physical hubs.
- **"Generate Master Report" Button:**
  - One-click trigger that compiles the platform-wide audit CSV (`megabachatmart_master_platform_audit_[DATE].csv`).
  - Audits order counts, dispatch latency, partner payouts, and inventory health for regulatory and tax compliance.

---

## 9. STEP 5: How Consumers Browse, Select, and Buy

```
                           CUSTOMER STOREFRONT JOURNEY
                                       │
                        1. Visit /shop or / (Homepage)
                                       │
                        2. Location & Serviceability Check
                           (Ranchi Central Hub 834001)
                                       │
                        3. Browse Categories & Kirana Badges
                           ("Sold by: Chotanagpur Tribal Hub")
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
                           (PhonePe / UPI / Pay at Store / COD)
                                       │
                        7. Handover Verification
                           (Delivery OTP or Counter QR Scan)
```

### 9.1 Location & Pincode Serviceability Check
1. Open the storefront at `https://mymbmart.com/shop`.
2. Click the location selector badge at the top (`Ranchi Central, Main Road - 834001`).
3. Click **"Detect My Current Location"** (GPS) or enter a 6-digit Pincode (e.g. `834001`, `834002`).
4. The system calls `/api/location/serviceability` to verify that the customer is within the 20–30 minute delivery radius of an active partner store or dark store.

### 9.2 Browsing, Product Badges & Adding to Cart
1. Browse categories (`20-Min Quick Commerce`, `Groceries`, `SHG Handcrafted`, `Daily Needs`).
2. Each item displays:
   - High-resolution product image.
   - MRP with strikethrough, bold Bachat Price, and discount percentage (e.g. `24% OFF`).
   - Partner Store Badge: `Sold by: [Store Name] ([Pincode])`.
   - Micro-cashback badge: e.g. `Earn ₹15 Wallet Cashback`.
3. Click **"+ Add"** to place items in the cart drawer.

### 9.3 Fulfilment Selection: 20-Min Delivery vs Self-Pickup
1. Open the **Cart Drawer** by clicking the shopping cart icon.
2. Select your fulfilment method:
   - **⚡ 20–30 Min Home Delivery:** Fast door-to-door delivery dispatched from the nearest partner hub.
   - **🏪 Self-Pickup (Ranchi Central Dark Store):** Zero delivery fees. Choose a convenient 30-minute collection slot (e.g., `Today, 5:30 PM - 6:00 PM`).
3. Click **"Proceed to Checkout"**.

### 9.4 Atomic Stock Soft Reservation (15-Minute TTL)
To prevent overselling the last packet of rice or oil when two customers checkout simultaneously:
- The system acquires a database row-lock and creates an atomic **Soft Reservation** with a 15-minute Time-To-Live (TTL).
- If the customer completes payment, the reservation is permanently committed (`HARD`).
- If payment fails or the customer abandons checkout, the reservation expires automatically and stock returns to the live pool.

### 9.5 Handover Verification (OTP & QR)
- **Home Delivery:** Rider brings the order. The customer provides their private **4-digit secret delivery OTP** (visible on their order tracking screen). The rider enters this OTP into the rider app to complete the order.
- **Dark Store Self-Pickup:** The customer visits the collection counter during their scheduled slot and presents their **Pickup QR Code**. The cashier scans the QR code to confirm handover.

---

## 10. The 12 Agent-Readiness Scan Standards & Implementations

MegaBachatMart is built to be discoverable and interpretable by autonomous AI agents, web crawlers, and LLM search systems. All 12 scan goals have been implemented and verified:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      AGENT-READINESS SCAN RESULTS                      │
├────┬─────────────────────────┬───────────────────────┬─────────────────┤
│ #  │ AUDIT GOAL              │ FIX IMPLEMENTED       │ VERIFIED FILES  │
├────┼─────────────────────────┼───────────────────────┼─────────────────┤
│ 1  │ Content Signals         │ Content-Signal header │ robots.txt      │
│ 2  │ Heading Hierarchy       │ Exactly one <h1>      │ HeroSection.tsx │
│ 3  │ Org/LocalBusiness Schema│ Complete JSON-LD @graph│ layout.tsx      │
│ 4  │ sameAs Social Profiles  │ External profile links│ layout.tsx      │
│ 5  │ Multi-Type Schema       │ 8 distinct schema types│ layout.tsx     │
│ 6  │ Legal & Info Pages      │ About, Contact, Terms │ app/*, Footer   │
│ 7  │ Prices Reachable w/o JS │ Static Offer schema   │ layout.tsx      │
│ 8  │ llms.txt served         │ /llms.txt published   │ public/llms.txt │
│ 9  │ Markdown Negotiation    │ Accept: text/markdown │ middleware.ts   │
│ 10 │ RFC 8288 Link Headers   │ Link: <llms.txt>      │ middleware.ts   │
│ 11 │ In-Browser WebMCP Tools │ registerTool() called │ WebMcpAgent.tsx │
│ 12 │ MCP Server Card         │ SEP-1649 Card served  │ server-card.json│
└────┴─────────────────────────┴───────────────────────┴─────────────────┘
```

### Detailed Breakdown of Audit Fixes:
1. **Goal 1 (Content Signals):** [`public/robots.txt`](file:///f:/Futurenxt/mymbmart/public/robots.txt) and [`src/app/robots.txt/route.ts`](file:///f:/Futurenxt/mymbmart/src/app/robots.txt/route.ts) declare `Content-Signal: search=yes, ai-train=no` to control AI indexing.
2. **Goal 2 (Heading Hierarchy):** [`src/components/HeroSection.tsx`](file:///f:/Futurenxt/mymbmart/src/components/HeroSection.tsx) enforces exactly one semantic `<h1>` naming the site's primary mission with screen-reader context.
3. **Goals 3, 4, 5, 7 (Rich Structured Data):** [`src/app/layout.tsx`](file:///f:/Futurenxt/mymbmart/src/app/layout.tsx) embeds an authoritative JSON-LD `@graph` containing:
   - `Organization` & `LocalBusiness` with Ranchi Central GPS coordinates, phone, and opening hours.
   - `sameAs` links to official profiles on X, LinkedIn, and Instagram.
   - `OnlineStore` with `hasOfferCatalog` containing static `Offer` items with INR pricing reachable without running client JavaScript.
   - `Service`, `FAQPage`, and `WebSite` with deep search actions.
4. **Goal 6 (Legal & Informational Pages):** Complete production pages deployed and linked in [`src/components/Footer.tsx`](file:///f:/Futurenxt/mymbmart/src/components/Footer.tsx):
   - [`/about`](file:///f:/Futurenxt/mymbmart/src/app/about/page.tsx) — Company history, hyperlocal mission, and founder vision.
   - [`/contact`](file:///f:/Futurenxt/mymbmart/src/app/contact/page.tsx) — Registered Ranchi headquarters address, grievance officer contact, and interactive inquiry form.
   - [`/terms`](file:///f:/Futurenxt/mymbmart/src/app/terms/page.tsx) — Terms of Service compliant with the Consumer Protection (E-Commerce) Rules, 2020.
   - [`/privacy`](file:///f:/Futurenxt/mymbmart/src/app/privacy/page.tsx) — Privacy policy compliant with the Digital Personal Data Protection (DPDP) Act, 2023.
   - [`/refund-policy`](file:///f:/Futurenxt/mymbmart/src/app/refund-policy/page.tsx) — Standard 48-hour return window for non-perishables and instant replacement for transit-damaged perishables.
5. **Goal 8 (`/llms.txt`):** Authored and published at [`public/llms.txt`](file:///f:/Futurenxt/mymbmart/public/llms.txt) and [`src/app/llms.txt/route.ts`](file:///f:/Futurenxt/mymbmart/src/app/llms.txt/route.ts), providing LLMs with an executive summary, API routes, and machine-readable markdown links.
6. **Goals 9 & 10 (Markdown Negotiation & Link Headers):**
   - [`src/middleware.ts`](file:///f:/Futurenxt/mymbmart/src/middleware.ts) inspects the `Accept` header. When `Accept: text/markdown` is received, it bypasses heavy HTML and serves a compact, structured markdown representation generated by [`src/lib/homepageMarkdown.ts`](file:///f:/Futurenxt/mymbmart/src/lib/homepageMarkdown.ts), cutting LLM token usage by up to 90%.
   - Injects RFC 8288 `Link` headers pointing to `<https://mymbmart.com/llms.txt>; rel="help"; type="text/plain"` on all responses.
7. **Goal 11 (In-Browser WebMCP Tools):** [`src/components/WebMcpAgentRegistry.tsx`](file:///f:/Futurenxt/mymbmart/src/components/WebMcpAgentRegistry.tsx) registers in-browser tools on page load via `navigator.modelContext.registerTool()`:
   - `search_catalog`: Look up products, discounts, and inventory.
   - `check_serviceability`: Validate delivery to a specific Pincode.
   - `get_partner_terms`: Return commission rates and payout SLA for merchants.
   - Also provides semantic `<form toolname="..." tooldescription="...">` tags for assistive bots.
8. **Goal 12 (SEP-1649 MCP Server Card):** Published at [`public/.well-known/mcp/server-card.json`](file:///f:/Futurenxt/mymbmart/public/.well-known/mcp/server-card.json) and [`src/app/.well-known/mcp/server-card.json/route.ts`](file:///f:/Futurenxt/mymbmart/src/app/.well-known/mcp/server-card.json/route.ts) with `Access-Control-Allow-Origin: *` CORS headers enabled.

---

## 11. Codebase Directory Map & Engineering Reference

```
mymbmart/
├── docs/                                  # Living Documentation & ADRs
│   ├── adr/                               # Architecture Decision Records
│   │   ├── ADR-001-stack-and-monorepo.md  # Why Next.js + TypeScript + Node
│   │   ├── ADR-002-append-only-ledgers.md # Why financial ledgers are append-only
│   │   └── ADR-003-row-lock-reservation.md# Concurrency & atomic stock locking
│   ├── MASTER_OPERATIONS_AND_USER_GUIDE.md# Version 1.0 Guide
│   └── MASTER_OPERATIONS_AND_USER_GUIDE_V2.md # This authoritative v2.0 Guide
├── prisma/
│   ├── schema.prisma                      # Complete 75-table consolidated schema
│   └── migrations/                        # SQL migrations & ledger triggers
├── public/
│   ├── .well-known/mcp/server-card.json   # SEP-1649 MCP Server Card
│   ├── llms.txt                           # AI Agent Site Summary
│   ├── robots.txt                         # Search engine & AI crawler rules
│   ├── images/products/                   # Optimized product photos
│   └── LOgo.jpeg                          # Official Brand Logo
├── src/
│   ├── app/                               # Next.js App Router (34 Routes)
│   │   ├── page.tsx                       # Consumer Homepage & Landing
│   │   ├── partners/page.tsx              # Dedicated Partner Onboarding Hub
│   │   ├── about/page.tsx                 # About Us & Company Story
│   │   ├── contact/page.tsx               # Contact Us & Grievance Officer
│   │   ├── terms/page.tsx                 # Terms of Service
│   │   ├── privacy/page.tsx               # DPDP Act 2023 Privacy Policy
│   │   ├── refund-policy/page.tsx         # Customer Return & Refund Policy
│   │   ├── shop/                          # Consumer Catalog & Partner Sub-routes
│   │   │   ├── login/page.tsx             # Merchant Login
│   │   │   ├── portal/page.tsx            # Merchant Operations Cockpit & CSV
│   │   │   └── register/page.tsx          # Merchant Application Form
│   │   ├── admin/                         # Admin Operations Dashboard
│   │   │   ├── page.tsx                   # Master Admin Hub & Audit Reports
│   │   │   └── login/page.tsx             # Staff Login
│   │   └── api/                           # REST API Endpoints
│   │       ├── products/route.ts          # Live Storefront Catalog API
│   │       ├── products/image-upload/     # Dynamic Product Photo Upload API
│   │       ├── admin/test-smtp/           # Diagnostic SMTP Email API
│   │       └── v1/
│   │           ├── admin/merchants/       # KYC Approval & Dispatch API
│   │           ├── shop/apply/            # Shop Application API
│   │           ├── shop/upload-csv/       # Bulk CSV Ingestion API
│   │           └── routing/               # Hyperlocal Routing & Serviceability
│   ├── components/                        # Reusable React UI Components
│   │   ├── Navbar.tsx                     # Header Navigation, Cart Badge & Account
│   │   ├── HeroSection.tsx                # Hero Banner with Semantic <h1>
│   │   ├── CartDrawer.tsx                 # Cart Drawer, Slot Picker & PhonePe QR
│   │   ├── Footer.tsx                     # Footer with Statutory Legal Links
│   │   └── WebMcpAgentRegistry.tsx        # In-Browser WebMCP Tool Initializer
│   └── lib/                               # Core Domain Services & Stores
│       ├── catalog.ts                     # Live Catalog Store & Dynamic Ingestion
│       ├── shopPartnerStore.ts            # Merchant Partner Model & CSV Parser
│       ├── inventoryStore.ts              # Atomic Stock Ledger & FEFO Batches
│       ├── reportGenerator.ts             # CSV Exporters for Partner & Admin
│       ├── homepageMarkdown.ts            # Token-Efficient Markdown Generator
│       ├── routingEngine.ts               # Hyperlocal Dispatch Scoring Engine
│       └── ordersStore.ts                 # Order State Machine & Ledgers
```

---

## 12. Troubleshooting Runbooks & Junior FAQs

### Q1: When a merchant uploads a CSV, why does it appear on the storefront immediately?
**Answer:** When `/api/v1/shop/upload-csv` processes the spreadsheet, it calls `shopPartnerStore.ingestBulkCsvProducts()`. This function performs three atomic updates:
1. Adds SKUs and quantities to `inventoryStore.ts` with batch tracking.
2. Injects formatted product records into `catalog.ts` via `addCatalogProducts()`.
3. Prepends the items to `CATALOG_PRODUCTS`. Because the customer catalog on `/shop` reads dynamically from this catalog store, new items appear at the top of search results immediately, labeled with `Sold by: [Store Name]`.

### Q2: How does the system handle concurrent checkouts of the last inventory unit?
**Answer:** The platform uses **Pessimistic Concurrency Control (ADR-003)**. When a customer initiates checkout preview, `createStockReservation()` acquires an exclusive row lock (`SELECT ... FOR UPDATE`) on the SKU in PostgreSQL/Prisma. Only one transaction can hold the lock and create a soft reservation. The second transaction receives an immediate out-of-stock notification before any payment can be collected.

### Q3: How do I test the full merchant onboarding and inventory publishing loop?
1. Open `http://localhost:3000/partners` or `/shop/register` and submit a new Kirana store application (e.g., `Shree Ram Provision Store`). Note the application reference ID.
2. Open `http://localhost:3000/admin` and click **"Merchant Onboarding & KYC"**.
3. Locate the pending application, click **"Review & KYC"**, inspect the documents and generated Store ID/Password, and click **"Approve & Dispatch Credentials"**.
4. Open an incognito browser window, visit `http://localhost:3000/partners`, enter the Store ID and Password, and log in to `/shop/portal`.
5. Under **Bulk Product Upload via CSV**, click **"Load 6 Demo FMCG Items"** and click **"Publish & Add to Main Site"**.
6. Visit `http://localhost:3000/shop` to see the 6 items live and purchasable on the customer storefront!

### Q4: How do I test the SMTP mailer?
- Send a `POST` request to `http://localhost:3000/api/admin/test-smtp` with body `{ "recipientEmail": "your-email@example.com" }`.
- The system will initiate an authenticated handshake with `smtp.hostinger.com:465` using `support@mymbmart.com` and dispatch a test verification email.

---

## 13. Definition of Done & Quality Standards

Every future Pull Request must satisfy the following checklist before merging into `main`:
- [x] **Zero Redundant Code:** Redundant mock files, dead routes, and unused test scripts must be removed.
- [x] **Strict TypeScript Cleanliness:** `npx tsc --noEmit` must exit with code `0` (zero errors).
- [x] **Production Build Cleanliness:** `npm run build` must compile all 34 routes cleanly without webpack or SSR prerendering errors.
- [x] **Agent-Readiness Integrity:** `robots.txt`, `llms.txt`, JSON-LD schema nodes, and `/.well-known/mcp/server-card.json` must remain accessible and valid.
- [x] **Documentation Updated:** Any change to API parameters, database entities, or business rules must be documented in `docs/MASTER_OPERATIONS_AND_USER_GUIDE_V2.md`.
