import { test, expect } from '@playwright/test';

test.describe('Standalone Access Disabled & Federation-Only Security Gate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('blocks direct standalone URL access and displays Standalone Access Disabled notice', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2')).toContainText('SIMPLICITY FINANCE');
    await expect(page.getByText('Standalone Access Disabled')).toBeVisible();
    await expect(page.getByText('/assets/remoteEntry.js')).toBeVisible();
  });

  test('does not expose login inputs, dashboard tabs, or data mutation buttons on standalone URL', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Add Wallet/i })).toHaveCount(0);
  });

  test('prevents bypassing standalone gate even when auth_token or simplicity_auth_user is injected in localStorage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'fake-injected-token');
      localStorage.setItem(
        'simplicity_auth_user',
        JSON.stringify({ id: 'usr_rattajak_n_gmail_com', email: 'rattajak.n@gmail.com', name: 'Rattajak' })
      );
    });
    await page.reload();

    await expect(page.locator('text=Standalone Access Disabled')).toBeVisible();
    await expect(page.getByRole('button', { name: /Transactions/i })).toHaveCount(0);
  });
});
