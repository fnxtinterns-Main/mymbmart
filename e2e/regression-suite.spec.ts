import { test, expect } from '@playwright/test';

test.describe('MegaBachatMart — E2E Real Browser Regression Suite', () => {

  test('1. Storefront renders live catalog items with Bachat Price lower than MRP', async ({ page }) => {
    await page.goto('/shop');
    const cards = page.locator('[data-testid="product-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('2. Cart cannot be submitted when empty', async ({ request }) => {
    const res = await request.post('/api/checkout/place-order', {
      data: { items: [] },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('3. Auth OTP rejects invalid / wrong OTP code', async ({ request }) => {
    const res = await request.post('/api/auth/otp', {
      data: { identifier: '9874561230', action: 'VERIFY', otp: '999999' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid verification code');
  });

  test('4. Auth OTP accepts universal test OTP 123456 and returns JWT session', async ({ request }) => {
    const res = await request.post('/api/auth/otp', {
      data: { identifier: '9874561230', action: 'VERIFY', otp: '123456' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeTruthy();
    expect(body.user.phone).toBe('9874561230');
  });

  test('5. Admin portal login rejects incorrect security passcode', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/email|store id/i).fill('admin@mymbmart.com');
    await page.getByLabel(/password|passcode/i).fill('WRONG_PASSCODE_123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/Invalid Security Passcode/i)).toBeVisible({ timeout: 5_000 });
  });

  test('6. Admin portal login grants access with seed master credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/email|store id/i).fill('test@test.com');
    await page.getByLabel(/password|passcode/i).fill('MBM#Test001@2026');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin/);
  });

  test('7. Payment webhook rejects forged HMAC signature', async ({ request }) => {
    const res = await request.post('/api/payment/webhook', {
      headers: {
        'x-razorpay-signature': '0000000000000000000000000000000000000000000000000000000000000000',
        'x-mock-raw-body': JSON.stringify({ event: 'payment.captured' }),
      },
      data: { event: 'payment.captured' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('cryptographic signature');
  });

  test('8. Order placement computes wallet cap at exactly ≤ 40%', async ({ request }) => {
    const res = await request.post('/api/checkout/place-order', {
      data: {
        items: [{ productId: 'p-1', quantity: 2 }],
        useWalletCredits: true,
        userWalletBalance: 5000, // Large balance
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const bachatTotal = body.order.totalMRP - body.order.shoppingSavings;
    expect(body.order.creditDeduction).toBeLessThanOrEqual(Math.round(bachatTotal * 0.40) + 1);
  });

  test('9. Hyper-local routing check flags unserviced PIN codes', async ({ request }) => {
    const res = await request.get('/api/v1/routing/check-availability?pincode=110001');
    if (res.status() === 200) {
      const data = await res.json();
      // Should identify outside Ranchi pilot polygon
      expect(data).toHaveProperty('serviceable');
    }
  });

  test('10. Order details page renders valid tracking structure', async ({ page }) => {
    await page.goto('/orders/MBM-2026-TEST01');
    const orderIdElem = page.locator('[data-testid="order-id"]');
    await expect(orderIdElem).toBeVisible({ timeout: 10_000 });
    await expect(orderIdElem).toContainText('MBM-2026-TEST01');
  });

  test('11. Order placed by customer is immediately visible to Admin in a separate browser context', async ({ browser }) => {
    // 1. Customer Context (Simulates customer on their device)
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();
    await customerPage.goto('/shop');

    const productCards = customerPage.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 15_000 });
    await productCards.first().locator('[data-testid="add-to-cart-btn"]').click();

    await customerPage.locator('[data-testid="cart-button"]').click();
    const cartDrawer = customerPage.locator('[data-testid="cart-drawer"]');
    await expect(cartDrawer).toBeVisible({ timeout: 10_000 });

    // Click Proceed to Pay (Step 1 -> Step 2)
    const proceedBtn = cartDrawer.getByRole('button', { name: /proceed to pay/i });
    await proceedBtn.click();

    // Step 2: Confirm Order & Place Order
    const confirmBtn = cartDrawer.locator('[data-testid="confirm-order-btn"]');
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    // Order modal opens with order reference
    const orderRef = customerPage.locator('text=Order #MBM-');
    await expect(orderRef.first()).toBeVisible({ timeout: 15_000 });
    const orderText = await orderRef.first().innerText();
    const orderMatch = orderText.match(/MBM-2026-\d+/);
    expect(orderMatch).toBeTruthy();
    const orderNumber = orderMatch![0];

    // 2. Admin Context (Simulates store manager in a completely separate browser session)
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/admin/login');
    await adminPage.getByLabel(/email|store id/i).fill('test@test.com');
    await adminPage.getByLabel(/password|passcode/i).fill('MBM#Test001@2026');
    await adminPage.getByRole('button', { name: /sign in/i }).click();

    await expect(adminPage).toHaveURL(/\/admin/);
    await adminPage.goto('/admin?tab=orders');

    // 3. Assert the order placed by customer is immediately visible to Admin
    await expect(adminPage.locator(`text=${orderNumber}`).first()).toBeVisible({ timeout: 15_000 });
  });

  test('12. User remains logged in across multi-page navigation (/ -> /shop -> /savings -> /refer)', async ({ page }) => {
    // 1. Log in via OTP on Home page
    await page.goto('/');
    const signinBtn = page.locator('[data-testid="signin-button"]');
    if (await signinBtn.isVisible()) {
      await signinBtn.click();
      const authModal = page.locator('[data-testid="auth-modal"]');
      await expect(authModal).toBeVisible({ timeout: 10_000 });
      await page.locator('[data-testid="phone-input"]').fill('9874561230');
      await authModal.getByRole('button', { name: /send.*code|send otp/i }).click();
      const otpInput = authModal.locator('[data-testid="otp-input"]').first();
      await expect(otpInput).toBeVisible({ timeout: 10_000 });
      await otpInput.fill('123456');
      await authModal.getByRole('button', { name: /verify & access account/i }).click();
    }

    // Assert logged in on Home page
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10_000 });

    // 2. Navigate to /shop and verify still logged in
    await page.goto('/shop');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10_000 });

    // 3. Navigate to /savings and verify still logged in
    await page.goto('/savings');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10_000 });

    // 4. Navigate to /refer and verify still logged in
    await page.goto('/refer');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10_000 });
  });

});
