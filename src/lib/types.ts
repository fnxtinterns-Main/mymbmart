export type UserRole = 'CONSUMER' | 'PROMOTER' | 'PRODUCER' | 'ADMIN';

export type RewardType = 'SHOPPING_DISCOUNT' | 'ACTUAL_CASHBACK' | 'WALLET_CREDIT' | 'REFERRAL_REWARD';

export interface UserProfile {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  level: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  referralCode: string;
  referredBy?: string;
  directReferralsCount: number;
  totalTeamCount: number;
}

export interface WalletState {
  balance: number;            // Current spendable balance
  totalSavings: number;       // All-time savings across shopping & discounts
  actualCashback: number;     // Real cashback received to wallet
  walletCredits: number;      // Platform promotional/loyalty credits
  referralRewards: number;    // Commissions earned from direct & level referrals
  lifetimeEarned: number;     // Cumulative total earned
  pendingWithdrawals: number;
}

export interface Transaction {
  id: string;
  date: string;
  title: string;
  type: RewardType | 'WITHDRAWAL' | 'ORDER_PAYMENT' | 'REDEEM_PURCHASE';
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  smartChainHash: string;
  description: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: 'Groceries' | 'SHG Specials' | 'Daily Essentials' | 'Snacks & Pickles' | 'Spices' | 'Home & Kitchen';
  unit: string;
  mrp: number;
  bachatPrice: number;
  discountPercent: number;
  cashbackAmount: number;
  referralRewardAmount: number;
  image: string;
  isSHG: boolean;
  producerName?: string;
  inStock: boolean;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}
