# MegaBachatMart — www.mymbmart.com
### *Bachat Bhi. Kamai Bhi. Apni Community Ke Saath.*

MegaBachatMart is India's community e-commerce movement built on the **PROSUMER REVOLUTION** (Producer + Consumer = Prosumer).

Instead of money flowing only from households to corporate middlemen and heavy commission platforms, value stays directly inside the community:
1. **Producer Consumer**: Direct marketplace for Self Help Groups (SHGs), Women Entrepreneurs, and local makers with zero/low commission.
2. **Promoter Consumer**: Every member earns micro-credits through direct referrals and multi-level community shopping activity.
3. **Power Consumer**: Households save 10%–30% on daily essentials via community bulk buying power.

---

## 🎨 Official Brand Identity & Color Palette

Extracted from official brand assets and promotional flyers:
* **Primary Trust Navy (`#0D2C6C`)**: Main headers, logo typography, secure smart-chain badges.
* **Bachat Emerald Green (`#064E3B` / `#16A34A`)**: Official flyer banner, savings counters, SHG direct badges.
* **Energy Saffron Orange (`#FF5722`)**: Logo `"mb"`, sunrise spark, high-converting CTAs (`Shop Now`, `Join Free`).
* **Offer Cyan / Electric Blue (`#0284C7`)**: Logo discount tag `%`, cart wheels, level tiers.
* **Crisp Clean Surfaces (`#FFFFFF` & `#F8FAFC`)**: Cards, passbook ledger, elevated UI elements.

---

## 💎 4-Stream Rewards & Savings Clear Separation

MegaBachatMart explicitly separates all economic benefits so members understand their value:

1. **Shopping Discounts**: Instant price reductions on MRP at checkout (e.g. MRP ₹500 → Bachat Price ₹420).
2. **Actual Cashback**: Real money returned into wallet after order completion, eligible for bank/UPI withdrawal.
3. **Wallet Credits**: Micro-credits accumulated on the platform, redeemable up to 100% on future orders.
4. **Referral Rewards**: Level 1 (Direct), Level 2, and Level 3 commissions earned as your community network shops.

---

## 📱 Mobile App (Android & iOS)

Built with **Next.js 15 + Capacitor** for simultaneous web, Android, and iOS delivery:
* **iOS Safe Areas**: Full support for iOS notch, Dynamic Island, status bar, and bottom home bar.
* **Authentication**: Mobile/Email OTP (SMTP) for initial verification, followed by Password, Google, or Apple Sign-In.
* **Capacitor Integration**: Ready to sync with native Xcode (`ios/`) and Android Studio (`android/`) projects.

### Capacitor Mobile Commands:
```bash
# Add Android platform
npx cap add android

# Add iOS platform (requires macOS with Xcode)
npx cap add ios

# Sync web assets to native mobile shells
npm run build
npx cap sync
```

---

## 🗄️ Database & AWS Cloud Architecture

* **Database Engine**: PostgreSQL + Prisma ORM.
* **AWS RDS Transition**: Currently configured with local/cloud PostgreSQL. Migrating to AWS RDS in production requires only changing the single `DATABASE_URL` environment variable:
  ```env
  DATABASE_URL="postgresql://<admin>:<password>@<aws-rds-endpoint>:5432/mymbmart?sslmode=require"
  ```

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

---

**Powered by FutureNxt E-Commerce | Digital Support by TechNxtAI | Built on Transparent Smart Chain**
