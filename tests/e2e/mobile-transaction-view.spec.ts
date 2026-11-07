import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Test Suite for MobileTransactionView
 * Covers mobile full-screen transaction layout, mode switching,
 * input validation, category expansion, and ADR-0021 history guard.
 */

test.describe('MobileTransactionView E2E (Mobile Viewport)', () => {
  test.setTimeout(60000);
  // Enforce mobile viewport below 768px (e.g., iPhone 13/14: 390x844)
  test.use({ viewport: { width: 390, height: 844 } });

  const openMobileTx = async (page: Page) => {
    await page.goto('/test-harness.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await page.getByTestId('host-action-add-tx').click();
    await expect(page.getByTestId('mobile-transaction-view')).toBeVisible();
  };

  test('renders full-screen mobile transaction view with header, back button, and sticky save button', async ({ page }) => {
    await openMobileTx(page);
    const view = page.getByTestId('mobile-transaction-view');

    // 1. Verify view container is visible and has Remote Modal Tier z-index
    await expect(view).toBeVisible();
    await expect(view).toHaveClass(/z-\[var\(--oaktree-z-remote-modal,1400\)\]/);

    // 2. Verify top navigation bar elements
    await expect(view.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(view.getByRole('heading', { name: 'New Transaction' })).toBeVisible();
    await expect(view.getByRole('button', { name: 'Scan Receipt with AI' })).toBeVisible();

    // 3. Verify sticky bottom save button is in viewport
    const saveButton = view.getByRole('button', { name: 'Save Transaction' });
    await expect(saveButton).toBeInViewport();
  });

  test('switches between Expense, Income, and Transfer modes with dynamic field rendering', async ({ page }) => {
    await openMobileTx(page);
    const view = page.getByTestId('mobile-transaction-view');

    // Default is Expense mode: category group is visible
    await expect(view.getByRole('radiogroup', { name: 'Category' })).toBeVisible();

    // Switch to Income mode
    const incomeTab = view.getByRole('tab', { name: 'Income' });
    await incomeTab.click();
    await expect(incomeTab).toHaveAttribute('aria-selected', 'true');
    await expect(view.getByText('Salary')).toBeVisible();

    // Switch to Transfer mode
    const transferTab = view.getByRole('tab', { name: 'Transfer' });
    await transferTab.click();
    await expect(transferTab).toHaveAttribute('aria-selected', 'true');

    // Category should be hidden; From Wallet and To Wallet should be visible
    await expect(view.getByRole('radiogroup', { name: 'Category' })).toHaveCount(0);
    await expect(view.getByLabel('From Wallet')).toBeVisible();
    await expect(view.getByLabel('To Wallet')).toBeVisible();

    // Switch back to Expense mode
    const expenseTab = view.getByRole('tab', { name: 'Expense' });
    await expenseTab.click();
    await expect(expenseTab).toHaveAttribute('aria-selected', 'true');
    await expect(view.getByRole('radiogroup', { name: 'Category' })).toBeVisible();
  });

  test('sanitizes amount input and validates non-empty positive value on submit', async ({ page }) => {
    await openMobileTx(page);
    const view = page.getByTestId('mobile-transaction-view');
    const amountInput = view.getByLabel(/Amount \(THB\)/i);

    // 1. Verify sanitization: letters and extra dots are stripped
    await amountInput.pressSequentially('abc150..5xyz');
    await expect(amountInput).toHaveValue('150.5');

    // 2. Clear amount and attempt submit: validation error should appear
    await amountInput.clear();
    await view.getByRole('button', { name: 'Save Transaction' }).click();

    // View should remain open and display validation message
    await expect(view).toBeVisible();
    await expect(view.getByText(/Please enter an amount/i).or(view.getByText(/Amount must be greater than 0/i))).toBeVisible();
  });

  test('category list expansion: expands via "Show all" and collapses via "Show less"', async ({ page }) => {
    await openMobileTx(page);
    const view = page.getByTestId('mobile-transaction-view');
    const categoryGroup = view.getByRole('radiogroup', { name: 'Category' });

    // Initial count should be 8 or fewer
    const initialCount = await categoryGroup.getByRole('radio').count();
    expect(initialCount).toBeLessThanOrEqual(8);

    // Click "Show all" to expand
    const showAllBtn = view.getByRole('button', { name: /Show all/i });
    if (await showAllBtn.isVisible()) {
      await showAllBtn.click();
      const expandedCount = await categoryGroup.getByRole('radio').count();
      expect(expandedCount).toBeGreaterThan(initialCount);

      // Verify "Show less" button appears
      const showLessBtn = view.getByRole('button', { name: /Show less/i });
      await expect(showLessBtn).toBeVisible();
      await showLessBtn.click();
      expect(await categoryGroup.getByRole('radio').count()).toBe(initialCount);
    }
  });

  test('renders hashtag chips when typing in the hashtags input field', async ({ page }) => {
    await openMobileTx(page);
    const view = page.getByTestId('mobile-transaction-view');

    // Type tags in hashtags input
    const hashtagInput = view.getByLabel('Hashtags');
    await hashtagInput.fill('food weekend dinner');

    // Verify chips are rendered
    const chipsContainer = view.getByTestId('hashtag-chips');
    await expect(chipsContainer).toBeVisible();
    await expect(chipsContainer).toContainText('#food');
    await expect(chipsContainer).toContainText('#weekend');
    await expect(chipsContainer).toContainText('#dinner');
  });

  test('closes mobile view when Back button is clicked', async ({ page }) => {
    await openMobileTx(page);
    const view = page.getByTestId('mobile-transaction-view');

    await view.getByRole('button', { name: 'Back' }).click();
    await expect(view).toBeHidden();
  });

  test('ADR-0021 History Guard: embedded mode does NOT push or pop browser history', async ({ page }) => {
    // 1. In embedded mode (default isEmbedded=true)
    await page.goto('/test-harness.html?isEmbedded=true');
    await expect(page.locator('main')).toBeVisible();

    // Verify initial call count
    const initialPushCalls = await page.evaluate(() => window.__E2E_STATE__.historyPushStateCalls);
    const initialBackCalls = await page.evaluate(() => window.__E2E_STATE__.historyBackCalls);
    expect(initialPushCalls).toBe(0);
    expect(initialBackCalls).toBe(0);

    // Open mobile view
    await page.getByTestId('host-action-add-tx').click();
    await expect(page.getByTestId('mobile-transaction-view')).toBeVisible();

    // In embedded mode, history.pushState MUST NOT have been called
    const pushCallsAfterOpen = await page.evaluate(() => window.__E2E_STATE__.historyPushStateCalls);
    expect(pushCallsAfterOpen).toBe(0);

    // Click back button to close
    await page.getByTestId('mobile-transaction-view').getByRole('button', { name: 'Back' }).click();
    await expect(page.getByTestId('mobile-transaction-view')).toBeHidden();

    // In embedded mode, history.back MUST NOT have been called
    const backCallsAfterClose = await page.evaluate(() => window.__E2E_STATE__.historyBackCalls);
    expect(backCallsAfterClose).toBe(0);
  });

  test('ADR-0021 History Guard: standalone mode (isEmbedded=false) pushes history state', async ({ page }) => {
    await page.goto('/test-harness.html?isEmbedded=false');
    await expect(page.locator('main')).toBeVisible();

    // Open mobile view
    await page.getByTestId('host-action-add-tx').click();
    await expect(page.getByTestId('mobile-transaction-view')).toBeVisible();

    // In standalone mode, history.pushState MUST have been called
    const pushCallsAfterOpen = await page.evaluate(() => window.__E2E_STATE__.historyPushStateCalls);
    expect(pushCallsAfterOpen).toBeGreaterThan(0);
  });
});
