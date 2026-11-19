import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'mbm_webhook_secret_key_2026';

/**
 * Timing-safe cryptographic HMAC-SHA256 signature verification for payment webhooks
 */
export function verifyWebhookSignature(rawPayload: string, signature?: string | null, secret = WEBHOOK_SECRET): boolean {
  if (!signature) return false;
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');
    
    if (signature.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * PII Masking utility for CloudWatch and production server logs
 * Defends against over-matching order IDs, handles single-char emails safely.
 */
export function maskPII(text: string): string {
  if (!text) return '';
  return text
    // Mask 10-digit Indian phone numbers starting with 6-9: e.g. 9874561230 -> 98XXXX1230
    .replace(/(?<![A-Za-z0-9_-])([6-9]\d)\d{4}(\d{4})(?![A-Za-z0-9_-])/g, '$1XXXX$2')
    // Mask Indian PAN card: ABCDE1234F -> ABCXXXX34F
    .replace(/\b([A-Z]{3})[A-Z]{2}[0-9]{2}([0-9]{2}[A-Z]{1})\b/g, '$1XXXX$2')
    // Mask 12-digit Aadhaar card (e.g. 2345 6789 0123 -> XXXX-XXXX-0123; avoids prefix like ORD-123456789012)
    .replace(/(?<![A-Za-z0-9_-])([2-9]\d{3})[\s-]?(\d{4})[\s-](\d{4})(?![A-Za-z0-9_-])/g, 'XXXX-XXXX-$3')
    // Mask email addresses: handles single-char 'a@b.com' -> 'a***@b.com', 'ab@c.com' -> 'a***b@c.com', 'rahul@gmail.com' -> 'r***l@gmail.com'
    .replace(/\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, (_match, local, domain) => {
      if (local.length === 1) return `${local}***@${domain}`;
      if (local.length === 2) return `${local[0]}***${local[1]}@${domain}`;
      return `${local[0]}***${local[local.length - 1]}@${domain}`;
    });
}

/**
 * Split Payment Calculator
 */
export function calculateSplitPayment(totalPayable: number, requestedWalletCredits: number, userWalletBalance: number) {
  // Closed-loop credit max 40% cap
  const maxAllowedFromWallet = Math.min(userWalletBalance, Math.round(totalPayable * 0.40));
  const walletDeducted = Math.min(requestedWalletCredits, maxAllowedFromWallet);
  const remainingGatePayable = Math.max(0, totalPayable - walletDeducted);

  return {
    totalPayable,
    walletDeducted,
    gatewayPayable: remainingGatePayable,
    isSplitPayment: walletDeducted > 0 && remainingGatePayable > 0,
  };
}

/**
 * Cart Abandonment Detector (Triggers re-engagement after idle threshold)
 */
export function isCartAbandoned(lastActivityTimestamp: string, idleThresholdHours = 24): boolean {
  const lastActive = new Date(lastActivityTimestamp).getTime();
  if (isNaN(lastActive)) return false;
  const now = Date.now();
  const diffHours = (now - lastActive) / (1000 * 60 * 60);
  return diffHours >= idleThresholdHours;
}

/**
 * Post-Delivery Return & Refund Processor
 */
export function processReturnRequest(order: {
  id: string;
  status: string;
  cashbackEarnable: number;
  cashbackCredited: boolean;
  totalPayable: number;
  creditDeduction: number;
}) {
  if (order.status !== 'DELIVERED') {
    throw new Error('Only delivered orders can initiate a post-delivery return request.');
  }

  return {
    orderId: order.id,
    returnStatus: 'REVERSE_PICKUP_INITIATED',
    cashbackReversed: order.cashbackCredited ? order.cashbackEarnable : 0,
    cashbackCredited: false,
    walletWithdrawalLocked: true, // Lock wallet withdrawal until warehouse physical QA inspection
    refundOnInspectionApproval: {
      gatewayRefund: Math.max(0, order.totalPayable),
      walletCreditReimbursement: order.creditDeduction,
    }
  };
}
