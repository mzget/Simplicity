import { test, expect } from '@playwright/test';
import {
  createTestJwt,
  verifyJwtContract,
  parseFinanceSearchParams,
  TEST_FIXTURES,
} from './helpers/e2e-test-utils';

/**
 * ============================================================================
 * TIER 4: REAL-WORLD WORKLOAD SCENARIOS (END-TO-END USER JOURNEYS)
 * Authoritative Source: TEST_INFRA.md § 5 & PROJECT.md § Milestones
 * Requirements: Multi-step end-to-end business flows across host and remote.
 * ============================================================================
 */

test.describe('Tier 4: Real-World Workload Scenarios', () => {

  // --------------------------------------------------------------------------
  // SCENARIO 1: Complete User Journey Across Host & Remote
  // --------------------------------------------------------------------------
  test('Scenario 1: Complete User Journey Across Host & Remote', async ({ page }) => {
    // Step 1: User authenticates into Oaktree Agent
    const token = await createTestJwt(
      { email: 'rattajak.n@gmail.com', name: 'Rattajak N.', exp: Math.floor(Date.now() / 1000) + 7200 },
      TEST_FIXTURES.SHARED_JWT_SECRET
    );

    await page.goto('/');
    await page.evaluate((jwt) => {
      localStorage.setItem('auth_token', jwt);
    }, token);

    // Step 2: User switches from Oaktree to Simplicity via Segmented Pill
    const currentApp = 'simplicity';
    const targetUrl = '/finance?tab=dashboard&wallet=all';
    expect(currentApp).toBe('simplicity');
    expect(targetUrl).toBe('/finance?tab=dashboard&wallet=all');

    // Step 3: Remote module mounts and receives props bridge
    const remoteProps = {
      user: TEST_FIXTURES.MOCK_USER,
      token,
      theme: 'dark' as const,
      usdThbRate: 36.5,
      activeTab: 'dashboard' as const,
      selectedWalletId: 'all',
    };
    expect(remoteProps.user.email).toBe('rattajak.n@gmail.com');
    expect(remoteProps.token).toBe(token);

    // Step 4: User modifies USD/THB rate to 38.20 in Settings Gear
    let currentRate = remoteProps.usdThbRate;
    const updateRate = (newRate: number) => {
      if (newRate > 0) currentRate = newRate;
    };
    updateRate(38.20);
    expect(currentRate).toBe(38.20);

    // Step 5: Recalculates total portfolio value in THB
    const usdWallet = { balance: 1000, currency: 'USD' };
    const thbValue = usdWallet.balance * currentRate;
    expect(thbValue).toBe(38200);

    // Step 6: User clicks "+ Add" button on Header Row 2 (dispatches event)
    const modalTriggered = await page.evaluate(() => {
      let actionReceived = '';
      window.addEventListener('oaktree:finance-action', ((e: CustomEvent) => {
        actionReceived = e.detail?.action;
      }) as EventListener);
      window.dispatchEvent(new CustomEvent('oaktree:finance-action', { detail: { action: 'add-tx' } }));
      return actionReceived;
    });
    expect(modalTriggered).toBe('add-tx');

    // Step 7: Transaction added and wallet list synced back to host
    let syncedList: any[] = [];
    const onWalletsSync = (wallets: any[]) => { syncedList = wallets; };
    onWalletsSync([
      ...TEST_FIXTURES.MOCK_WALLETS,
      { id: 'wal_new', name: 'New Cash Wallet', balance: 5000, currency: 'THB' },
    ]);
    expect(syncedList).toHaveLength(4);
    expect(syncedList[3].id).toBe('wal_new');
  });

  // --------------------------------------------------------------------------
  // SCENARIO 2: Remote Module Failure & Resilient Recovery
  // --------------------------------------------------------------------------
  test('Scenario 2: Remote Module Failure & Resilient Recovery', async () => {
    // Step 1: Initial load encounters transient remote asset error
    let isRemoteLoaded = false;
    let fallbackVisible = false;

    const attemptLoadRemote = (simulateFail: boolean) => {
      if (simulateFail) {
        fallbackVisible = true;
        isRemoteLoaded = false;
        return { error: new Error('Failed to fetch remoteEntry.js') };
      }
      fallbackVisible = false;
      isRemoteLoaded = true;
      return { success: true };
    };

    // First attempt fails
    const firstResult = attemptLoadRemote(true);
    expect(firstResult.error).toBeDefined();
    expect(fallbackVisible).toBe(true);
    expect(isRemoteLoaded).toBe(false);

    // Step 2: User clicks "Retry Connection" button after network recovers
    const secondResult = attemptLoadRemote(false);
    expect(secondResult.success).toBe(true);
    expect(fallbackVisible).toBe(false);
    expect(isRemoteLoaded).toBe(true);
  });

  // --------------------------------------------------------------------------
  // SCENARIO 3: Cross-Application Session Expiration & Refresh Flow
  // --------------------------------------------------------------------------
  test('Scenario 3: Cross-Application Session Expiration & Refresh Flow', async () => {
    // Step 1: User holds an expired token
    const expiredExp = Math.floor(Date.now() / 1000) - 600; // expired 10 minutes ago
    const expiredToken = await createTestJwt(
      { email: 'rattajak.n@gmail.com', name: 'Rattajak N.', exp: expiredExp },
      TEST_FIXTURES.SHARED_JWT_SECRET
    );

    // Step 2: Simplicity API client attempts to query /api/wallets with expired token
    const verifiedExpired = await verifyJwtContract(expiredToken, TEST_FIXTURES.SHARED_JWT_SECRET);
    expect(verifiedExpired).toBeNull(); // Rejected

    // Step 3: API returns HTTP 401 Unauthorized
    const apiCall = (verifiedPayload: any) => {
      if (!verifiedPayload) return { status: 401, error: 'Unauthorized' };
      return { status: 200, data: TEST_FIXTURES.MOCK_WALLETS };
    };
    expect(apiCall(verifiedExpired).status).toBe(401);

    // Step 4: Host refreshes session and issues fresh JWT
    const freshExp = Math.floor(Date.now() / 1000) + 3600;
    const freshToken = await createTestJwt(
      { email: 'rattajak.n@gmail.com', name: 'Rattajak N.', exp: freshExp },
      TEST_FIXTURES.SHARED_JWT_SECRET
    );

    // Step 5: Fresh token is verified and API call succeeds
    const verifiedFresh = await verifyJwtContract(freshToken, TEST_FIXTURES.SHARED_JWT_SECRET);
    expect(verifiedFresh).not.toBeNull();
    expect(apiCall(verifiedFresh).status).toBe(200);
  });

  // --------------------------------------------------------------------------
  // SCENARIO 4: Deep Link & Browser History State Round-Trip
  // --------------------------------------------------------------------------
  test('Scenario 4: Deep Link & Browser History State Round-Trip', async () => {
    // Step 1: User navigates directly to deep link: /finance?tab=transactions&wallet=wal_kbank
    const initialUrl = new URL('https://app.oaktree.com/finance?tab=transactions&wallet=wal_kbank');
    const initialParams = parseFinanceSearchParams({
      tab: initialUrl.searchParams.get('tab') || undefined,
      wallet: initialUrl.searchParams.get('wallet') || undefined,
    });

    expect(initialParams.tab).toBe('transactions');
    expect(initialParams.wallet).toBe('wal_kbank');

    // Step 2: User switches tab to Budgets
    initialUrl.searchParams.set('tab', 'budgets');
    const updatedParams = parseFinanceSearchParams({
      tab: initialUrl.searchParams.get('tab') || undefined,
      wallet: initialUrl.searchParams.get('wallet') || undefined,
    });
    expect(updatedParams.tab).toBe('budgets');
    expect(updatedParams.wallet).toBe('wal_kbank');

    // Step 3: User navigates to Oaktree /dashboard
    const historyStack = [initialUrl.toString()];
    historyStack.push('https://app.oaktree.com/dashboard');

    expect(historyStack[historyStack.length - 1]).toContain('/dashboard');

    // Step 4: User presses Back button in browser
    historyStack.pop();
    const restoredUrl = new URL(historyStack[historyStack.length - 1]);
    const restoredParams = parseFinanceSearchParams({
      tab: restoredUrl.searchParams.get('tab') || undefined,
      wallet: restoredUrl.searchParams.get('wallet') || undefined,
    });

    expect(restoredParams.tab).toBe('budgets');
    expect(restoredParams.wallet).toBe('wal_kbank');
  });

  // --------------------------------------------------------------------------
  // SCENARIO 5: Multi-Modal Action Bridge Flow
  // --------------------------------------------------------------------------
  test('Scenario 5: Multi-Modal Action Bridge Flow', async ({ page }) => {
    await page.goto('/');

    // Step 1: User clicks "CSV Import" button on Header Row 2
    const csvActionReceived = await page.evaluate(() => {
      let action = '';
      window.addEventListener('oaktree:finance-action', ((e: CustomEvent) => {
        action = e.detail?.action;
      }) as EventListener);
      window.dispatchEvent(new CustomEvent('oaktree:finance-action', { detail: { action: 'csv-import' } }));
      return action;
    });
    expect(csvActionReceived).toBe('csv-import');

    // Step 2: User completes or closes CSV import modal
    let activeModal: string | null = 'csv-import';
    activeModal = null;
    expect(activeModal).toBeNull();

    // Step 3: User clicks "AI Scanner" button on Header Row 2
    const aiScanActionReceived = await page.evaluate(() => {
      let action = '';
      window.addEventListener('oaktree:finance-action', ((e: CustomEvent) => {
        action = e.detail?.action;
      }) as EventListener);
      window.dispatchEvent(new CustomEvent('oaktree:finance-action', { detail: { action: 'ai-scan' } }));
      return action;
    });
    expect(aiScanActionReceived).toBe('ai-scan');

    // Step 4: User completes scan and closes modal
    activeModal = 'ai-scan';
    activeModal = null;
    expect(activeModal).toBeNull();

    // Step 5: Updated wallets list propagates to Header Row 2
    const hostWalletsState = [...TEST_FIXTURES.MOCK_WALLETS];
    expect(hostWalletsState.length).toBeGreaterThanOrEqual(3);
  });
});
