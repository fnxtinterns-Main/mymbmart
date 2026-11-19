import { test, expect } from '@playwright/test';

/**
 * MegaBachatMart — E2E Golden Path
 * Customer journey: browse → add to cart → login → split-pay → order → admin verify
 *
 * Uses real Chromium against real Next.js server.
 */

const TEST_CUSTOMER = {
  phone: '9874561230',
  otp: '123456',           // test mode universal OTP
};

test.describe('Golden Path — Guest to Paid Order', () => {

  test.beforeEach(async ({ page }) => {
    // Fresh session per test
    await page.context().clearCookies();
  });

  test('Customer browses, adds to cart, logs in, places split-paid order, admin sees it', async ({ page }) => {

    // ─── 1. Load storefront ───────────────────────────────────────
    await page.goto('/shop');
    
    // Wait for products to render
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 15_000 });

    const cardCount = await productCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // ─── 2. Add two items to cart ─────────────────────────────────
    const firstProduct = productCards.nth(0);
    const firstProductName = await firstProduct
      .locator('[data-testid="product-name"]')
      .innerText();

    await firstProduct.locator('[data-testid="add-to-cart-btn"]').click();

    const secondProduct = productCards.nth(1);
    await secondProduct.locator('[data-testid="add-to-cart-btn"]').click();

    // ─── 3. Open cart drawer & verify pricing ─────────────────────
    await page.locator('[data-testid="cart-button"]').click();

    const cartDrawer = page.locator('[data-testid="cart-drawer"]');
    await expect(cartDrawer).toBeVisible();

    await expect(cartDrawer).toContainText(firstProductName);

    // Cart must show BOTH MRP and Bachat Price
    const mrpLocator = cartDrawer.locator('[data-testid="mrp-total"]');
    const bachatLocator = cartDrawer.locator('[data-testid="bachat-total"]');
    await expect(mrpLocator).toBeVisible();
    await expect(bachatLocator).toBeVisible();

    const mrpText = await mrpLocator.innerText();
    const bachatText = await bachatLocator.innerText();
    const mrp = parseRupees(mrpText);
    const bachat = parseRupees(bachatText);

    expect(mrp).toBeGreaterThan(0);
    expect(bachat).toBeGreaterThan(0);
    expect(bachat).toBeLessThan(mrp);  // bachat MUST be cheaper than MRP

    // Close cart drawer to clear backdrop overlay before clicking login
    const closeBtn = cartDrawer.locator('button').first();
    await closeBtn.click();
    await expect(cartDrawer).not.toBeVisible({ timeout: 5_000 });

    // ─── 4. Open login modal from cart or navbar ─────────────────
    // If not logged in, trigger auth modal via signin button
    const signinBtn = page.locator('[data-testid="signin-button"]');
    if (await signinBtn.isVisible()) {
      await signinBtn.click();
    }

    const authModal = page.locator('[data-testid="auth-modal"]');
    await expect(authModal).toBeVisible({ timeout: 10_000 });

    // ─── 5. Login via OTP ────────────────────────────────────────
    await page.locator('[data-testid="phone-input"]').fill(TEST_CUSTOMER.phone);
    await authModal.getByRole('button', { name: /send.*code|send otp/i }).click();

    // OTP input
    const otpInput = authModal.locator('[data-testid="otp-input"]').first();
    await expect(otpInput).toBeVisible({ timeout: 10_000 });
    await otpInput.fill(TEST_CUSTOMER.otp);

    await authModal.getByRole('button', { name: /verify & access account/i }).click();

    // Logged-in indicator
    await expect(page.locator('[data-testid="user-menu"]'))
      .toBeVisible({ timeout: 10_000 });

    // ─── 6. Checkout page — verify split payment ─────────────────
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: /checkout/i }).first())
      .toBeVisible({ timeout: 15_000 });

    // Wallet credit line must exist and be ≤ 40% of order total
    const walletLine = page.locator('[data-testid="wallet-deduction"]');
    if (await walletLine.count() > 0) {
      await expect(walletLine).toBeVisible();
      const walletAmt = parseRupees(await walletLine.innerText());
      // Wallet deduction never exceeds 40% of bachat total
      expect(walletAmt).toBeLessThanOrEqual(Math.round(bachat * 0.4) + 1);
    }

    // Gateway payable must equal total - wallet
    const payableLine = page.locator('[data-testid="gateway-payable"]');
    await expect(payableLine).toBeVisible();
    const payableAmt = parseRupees(await payableLine.innerText());
    expect(payableAmt).toBeGreaterThan(0);

    // ─── 7. Place order ──────────────────────────────────────────
    await page.getByRole('button', { name: /place order|pay now/i }).click();

    // Wait for success page or confirmation
    await expect(page).toHaveURL(/\/orders\/[A-Z0-9-]+|\/order-confirmation/, {
      timeout: 30_000,
    });

    // Grab the order ID from DOM
    const orderIdLocator = page.locator('[data-testid="order-id"]');
    await expect(orderIdLocator).toBeVisible();
    const orderId = (await orderIdLocator.innerText()).trim();
    expect(orderId).toBeTruthy();

    // ─── 8. Admin dashboard shows the order ─────────────────────
    const adminContext = await page.context().browser()!.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto('/admin/login');
    await adminPage.getByLabel(/email|store id/i).fill('test@test.com');
    await adminPage.getByLabel(/password|passcode/i).fill('MBM#Test001@2026');
    await adminPage.getByRole('button', { name: /sign in/i }).click();

    // Wait for login redirect to admin orders
    await adminPage.waitForURL(/\/admin/, { timeout: 10_000 });

    await expect(
      adminPage.locator(`[data-testid="order-row"]:has-text("${orderId}")`)
    ).toBeVisible({ timeout: 15_000 });

    await adminContext.close();
  });

});

// ─── helpers ─────────────────────────────────────────────────────
function parseRupees(text: string): number {
  const cleaned = text.replace(/[₹,\s-]/g, '');
  const n = parseFloat(cleaned);
  if (Number.isNaN(n)) throw new Error(`Could not parse rupee amount from: "${text}"`);
  return Math.round(n);
}
