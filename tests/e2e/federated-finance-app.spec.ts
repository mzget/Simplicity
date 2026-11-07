import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for FederatedFinanceApp (MFE Integration & Boundary Contract)
 * Tests run against the Vite E2E test harness at /test-harness.html
 */

test.describe('FederatedFinanceApp Component & Contract E2E', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/test-harness.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('renders embedded remote app with KPI metrics and wallets shelf', async ({ page }) => {
    // 1. Verify KPI summary cards and sections
    await expect(page.locator('main').getByText('Total Balance')).toBeVisible();
    await expect(page.locator('main').getByText(/Your Wallets & Accounts/i)).toBeVisible();
    await expect(page.locator('main').getByText(/Period/i).first()).toBeVisible();

    // 2. Verify wallets shelf contains wallets inside main
    await expect(page.locator('main').getByText('All Wallets')).toBeVisible();
  });

  test('handles tab navigation between Dashboard, Transactions, Wallets, and Budgets', async ({ page }) => {
    // 1. Switch to Transactions tab via host nav
    await page.getByTestId('host-tab-transactions').click();
    await expect(page.getByText(/Transactions History/i)).toBeVisible();

    // Verify callback recorded in test harness
    const callsAfterTransactions = await page.evaluate(() => window.__E2E_STATE__.tabChangeCalls);
    expect(callsAfterTransactions).toContain('transactions');

    // 2. Switch to Wallets tab
    await page.getByTestId('host-tab-wallets').click();
    await expect(page.locator('main').getByText(/Manage Wallets/i).or(page.locator('main').getByRole('heading', { name: /Wallets/i })).first()).toBeVisible();

    // 3. Switch to Budgets tab
    await page.getByTestId('host-tab-budgets').click();
    await expect(page.locator('main').getByText(/Monthly Budgets/i).or(page.locator('main').getByText(/Budgets/i)).first()).toBeVisible();

    // 4. Switch back to Dashboard
    await page.getByTestId('host-tab-dashboard').click();
    await expect(page.locator('main').getByText(/Recent Activity/i)).toBeVisible();
  });

  test('switches tab from within remote view via "View All Transactions" link', async ({ page }) => {
    // Click in-app link on Dashboard
    const viewAllBtn = page.getByRole('button', { name: /View All Transactions/i });
    await expect(viewAllBtn).toBeVisible();
    await viewAllBtn.click();

    // Verify Transactions view is displayed
    await expect(page.getByText(/Transactions History/i)).toBeVisible();

    // Verify outbound onTabChange was dispatched to host
    const tabCalls = await page.evaluate(() => window.__E2E_STATE__.tabChangeCalls);
    expect(tabCalls).toContain('transactions');
  });

  test('ADR-0021 Contract: pendingAction="add-tx" triggers Add Transaction modal and calls onActionConsumed', async ({ page }) => {
    // Trigger action from host nav
    await page.getByTestId('host-action-add-tx').click();

    // Verify transaction modal or mobile view opened
    const modalOrView = page.getByTestId('add-transaction-modal').or(page.getByTestId('mobile-transaction-view'));
    await expect(modalOrView).toBeVisible();

    // Verify onActionConsumed was called by the Remote
    const consumedCalls = await page.evaluate(() => window.__E2E_STATE__.actionConsumedCalls);
    expect(consumedCalls).toContain('add-tx');
  });

  test('ADR-0021 Contract: pendingAction="ai-scan" opens Receipt Scanner modal and calls onActionConsumed', async ({ page }) => {
    await page.getByTestId('host-action-ai-scan').click();

    // Verify scanner modal appears
    await expect(page.getByText(/AI Receipt & Slip Scanner/i)).toBeVisible();

    const consumedCalls = await page.evaluate(() => window.__E2E_STATE__.actionConsumedCalls);
    expect(consumedCalls).toContain('ai-scan');
  });

  test('ADR-0021 Contract: pendingAction="csv-import" opens CSV Import modal and calls onActionConsumed', async ({ page }) => {
    await page.getByTestId('host-action-csv-import').click();

    // Verify CSV modal appears
    await expect(page.getByText(/Import CSV/i).or(page.getByText(/Import Transactions/i))).toBeVisible();

    const consumedCalls = await page.evaluate(() => window.__E2E_STATE__.actionConsumedCalls);
    expect(consumedCalls).toContain('csv-import');
  });

  test('ADR-0021 Contract: pendingAction="add-wallet" opens Add Wallet modal and calls onActionConsumed', async ({ page }) => {
    await page.getByTestId('host-action-add-wallet').click();

    // Verify Add Wallet modal appears
    await expect(page.getByText(/Create New Wallet/i).or(page.getByText(/New Wallet/i))).toBeVisible();

    const consumedCalls = await page.evaluate(() => window.__E2E_STATE__.actionConsumedCalls);
    expect(consumedCalls).toContain('add-wallet');
  });

  test('syncs theme between light and dark modes', async ({ page }) => {
    const scopeContainer = page.locator('.simplicity-scope').first();
    await expect(scopeContainer).toHaveClass(/dark/);

    // Toggle to Light theme
    await page.getByTestId('host-theme-toggle').click();
    await expect(scopeContainer).not.toHaveClass(/dark/);

    // Toggle back to Dark theme
    await page.getByTestId('host-theme-toggle').click();
    await expect(scopeContainer).toHaveClass(/dark/);
  });

  test('synchronizes wallet selection changes with the host', async ({ page }) => {
    await page.getByTestId('host-wallet-select').selectOption('wal_kbank');

    const walletCalls = await page.evaluate(() => window.__E2E_STATE__.walletChangeCalls);
    expect(walletCalls).toContain('wal_kbank');
  });
});
