import { test, expect } from '@playwright/test';

test.describe('Authentication User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh session
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('displays login page for unauthenticated visitors', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2')).toContainText('SIMPLICITY');
    await expect(page.locator('text=Authorized: rattajak.n@gmail.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
  });

  test('blocks unauthorized email with access denied alert', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('unauthorized.guest@gmail.com');

    await page.getByRole('button', { name: /Sign In to Vault/i }).click();

    // Verify error banner is displayed
    const errorBanner = page.locator('text=Access Denied');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('rattajak.n@gmail.com');
  });

  test('completes login with authorized Google email, reveals dashboard, and logs out', async ({ page }) => {
    await page.goto('/');

    // Click Google Sign In button
    await page.getByRole('button', { name: /Sign in with Google/i }).click();

    // Verify Dashboard is unlocked
    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Transactions/i })).toBeVisible();

    // Verify User profile dropdown in Navbar
    const profileBtn = page.locator('button[title*="rattajak.n@gmail.com"]');
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Verify dropdown content
    await expect(page.locator('text=Google Authorized Owner')).toBeVisible();
    await expect(page.locator('text=rattajak.n@gmail.com')).toBeVisible();

    // Click Sign Out
    await page.getByRole('button', { name: /Sign Out/i }).click();

    // Verify redirected back to Login Page
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
  });
});
