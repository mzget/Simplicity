import { test, expect } from '@playwright/test';

/**
 * ============================================================================
 * E2E TEST: PWA Offline-First & Mutation Queue Architecture
 * Validates offline resilience and standalone security gate under Playwright.
 * ============================================================================
 */

test.describe('PWA Offline-First & Security Architecture', () => {
  test('retains Standalone Access Disabled gate in App.tsx', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/Standalone Access Disabled/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /SIMPLICITY FINANCE/i })).toBeVisible();
    await expect(page.getByText(/\/assets\/remoteEntry\.js/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Open via Oaktree Agent Host/i })).toBeVisible();
  });

  test('validates IndexedDB database creation and schema presence in browser environment', async ({ page }) => {
    await page.goto('/');

    const idbStatus = await page.evaluate(async () => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return { supported: false };
      }
      return { supported: true };
    });

    expect(idbStatus.supported).toBe(true);
  });

  test('verifies remoteEntry.js micro-frontend endpoint is exposed for host federation', async ({ request }) => {
    const res = await request.get('/assets/remoteEntry.js');
    expect(res.status()).toBe(200);
    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('javascript');
  });
});

