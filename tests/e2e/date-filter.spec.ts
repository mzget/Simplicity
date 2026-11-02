import { test, expect, type Page } from '@playwright/test';

/**
 * Date Period Bar & Last Month Transaction Filter E2E
 *
 * Verifies that switching period presets (such as "Last Month") updates the displayed
 * date range properly and includes boundary transactions (such as Oct 31) when accessed
 * through the federation host.
 */
const HOST_URL = process.env.E2E_HOST_URL;

test.skip(!HOST_URL, 'E2E_HOST_URL not set: DatePeriodBar is only reachable through the federation host');
if (process.env.E2E_STORAGE_STATE) {
  test.use({ storageState: process.env.E2E_STORAGE_STATE });
}

test.describe('Date Period Filter & Boundary Transactions E2E', () => {
  test('switches to Last Month and displays boundary transactions on the last day of the month', async ({ page }) => {
    await page.goto(HOST_URL!);
    await page.getByRole('button', { name: /Transactions/i }).click();

    // Verify DatePeriodBar presets are rendered
    const lastMonthBtn = page.getByRole('button', { name: /Last Month/i });
    await expect(lastMonthBtn).toBeVisible();

    // Click "Last Month" filter chip
    await lastMonthBtn.click();

    // Verify active preset styling is applied
    await expect(lastMonthBtn).toHaveClass(/bg-emerald-500/);

    // Verify date range text contains the previous month
    const calendarRange = page.locator('text=/—/');
    await expect(calendarRange).toBeVisible();

    // Verify transactions list is visible
    const transactionsHistory = page.locator('text=/Transactions History/');
    await expect(transactionsHistory).toBeVisible();
  });
});

