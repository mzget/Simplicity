import { test, expect, type Page } from '@playwright/test';

/**
 * Add Transaction modal E2E (responsive: mobile bottom sheet + desktop dialog).
 *
 * The Simplicity remote cannot be opened standalone (federation-only gate, see auth.spec.ts),
 * so these flows must run against the host app that embeds the remote.
 * Provide it via E2E_HOST_URL (an already-authenticated session is required, e.g. E2E_STORAGE_STATE).
 *   E2E_HOST_URL=https://host.example npx playwright test tests/e2e/add-transaction-modal.spec.ts
 */
const HOST_URL = process.env.E2E_HOST_URL;

test.skip(!HOST_URL, 'E2E_HOST_URL not set: modal is only reachable through the federation host');
if (process.env.E2E_STORAGE_STATE) {
  test.use({ storageState: process.env.E2E_STORAGE_STATE });
}

const openModal = async (page: Page) => {
  await page.goto(HOST_URL!);
  await page.getByRole('button', { name: /Transactions/i }).click();
  await page.getByRole('button', { name: /Add/i }).first().click();
  await expect(page.getByTestId('add-transaction-modal')).toBeVisible();
};

for (const viewport of [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
]) {
  test.describe(`Add Transaction modal (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('shows Save button and category grid without scrolling the page', async ({ page }) => {
      await openModal(page);
      const modal = page.getByTestId('add-transaction-modal');
      await expect(page.getByRole('button', { name: 'Save Transaction' })).toBeInViewport();
      await expect(modal.getByRole('radio').first()).toBeInViewport();

      const box = (await modal.boundingBox())!;
      if (viewport.name === 'mobile') {
        expect(box.width).toBeCloseTo(viewport.width, 0);
        expect(box.y + box.height).toBeCloseTo(viewport.height, 0); // docked to bottom
      } else {
        expect(box.width).toBeLessThanOrEqual(512);
        expect(box.y).toBeGreaterThan(0); // centered, not docked
      }
    });

    test('adds an expense: pick category, enter amount, note and hashtags, save', async ({ page }) => {
      await openModal(page);
      await page.getByLabel(/Amount \(THB\)/i).fill('150');
      await page.getByRole('radio').nth(1).click();
      await page.getByLabel('Note / Description').fill('E2E lunch');
      await page.getByLabel('Hashtags').fill('food weekend');
      await expect(page.getByTestId('hashtag-chips')).toContainText('#weekend');
      await page.getByRole('button', { name: 'Save Transaction' }).click();
      await expect(page.getByTestId('add-transaction-modal')).toBeHidden();
    });

    test('switches Income and Transfer modes', async ({ page }) => {
      await openModal(page);
      await page.getByRole('tab', { name: 'Income' }).click();
      await expect(page.getByRole('tab', { name: 'Income' })).toHaveAttribute('aria-selected', 'true');
      await page.getByRole('tab', { name: 'Transfer' }).click();
      await expect(page.getByLabel('From Wallet')).toBeVisible();
      await expect(page.getByLabel('To Wallet')).toBeVisible();
      await expect(page.getByRole('radiogroup', { name: 'Category' })).toHaveCount(0);
    });

    test('rejects non-numeric amount characters and has no spinner', async ({ page }) => {
      await openModal(page);
      const amount = page.getByLabel(/Amount \(THB\)/i);
      await amount.pressSequentially('1a2.3.4');
      await expect(amount).toHaveValue('12.34');
      await expect(amount).toHaveAttribute('type', 'text');
    });

    test('Show all expands the category list', async ({ page }) => {
      await openModal(page);
      const group = page.getByRole('radiogroup', { name: 'Category' });
      const before = await group.getByRole('radio').count();
      await page.getByRole('button', { name: /Show all/i }).click();
      expect(await group.getByRole('radio').count()).toBeGreaterThan(before);
    });
  });
}

