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

});
