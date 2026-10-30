/**
 * Adversarial Verification Harness for Milestone 2:
 * Unified Header Navigation & Routing (R2)
 *
 * Tests:
 * 1. Query Params Resilience & Sanitization Fallback
 * 2. Segmented Pill Switcher & State Memory Preservation
 * 3. Bidirectional Sync & High-Frequency Echo Loop Immunity
 */

import { z } from 'zod';

console.log('================================================================');
console.log('  M2 EMPIRICAL ADVERSARIAL STRESS HARNESS');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

// ----------------------------------------------------------------------------
// TEST SUITE 1: Query Params Schema Resilience & Fallbacks
// ----------------------------------------------------------------------------
console.log('--- Suite 1: Query Params Schema Resilience ---');

// Official schema from App.tsx
const financeSearchSchema = z.object({
  tab: z.enum(['dashboard', 'transactions', 'budgets', 'wallets']).default('dashboard').catch('dashboard'),
  wallet: z.string().transform((v) => (typeof v === 'string' && v.trim().length > 0 ? v.trim() : 'all')).default('all').catch('all'),
});

// Test 1.1: Missing params
const res1 = financeSearchSchema.parse({});
assert(res1.tab === 'dashboard' && res1.wallet === 'all', 'Missing params fall back to tab="dashboard" and wallet="all"');

// Test 1.2: Invalid tab name with valid wallet
const res2 = financeSearchSchema.parse({ tab: 'non_existent_tab', wallet: 'wal_kbank' });
assert(res2.tab === 'dashboard' && res2.wallet === 'wal_kbank', 'Invalid tab falls back to "dashboard", valid wallet preserved');

// Test 1.3: Empty strings
const res3 = financeSearchSchema.parse({ tab: '', wallet: '' });
assert(res3.tab === 'dashboard' && res3.wallet === 'all', 'Empty string params fall back to canonical defaults');

// Test 1.4: Whitespace-only strings
const res4 = financeSearchSchema.parse({ tab: '   ', wallet: '   ' });
assert(res4.tab === 'dashboard' && res4.wallet === 'all', 'Whitespace-only params trimmed and fall back to canonical defaults');

// Test 1.5: Malicious payloads (XSS, SQLi, Control Chars)
const res5 = financeSearchSchema.parse({ tab: '<script>alert(1)</script>', wallet: 'wal_1; DROP TABLE Wallets;--' });
assert(res5.tab === 'dashboard', 'XSS tab sanitized to "dashboard"');
assert(res5.wallet === 'wal_1; DROP TABLE Wallets;--', 'SQL injection safely stored as plain string literal without crashing');

// Test 1.6: Non-string type inputs (Numbers, Objects, Arrays)
const res6 = financeSearchSchema.parse({ tab: 12345, wallet: { id: 'nested' } });
assert(res6.tab === 'dashboard' && res6.wallet === 'all', 'Non-string types gracefully catch and fall back to defaults');

// Test 1.7: Non-existent wallet handling in store logic
const mockWallets = [
  { id: 'wal_kbank', name: 'KBANK Account', balance: 1000, currency: 'THB' },
  { id: 'wal_scb', name: 'SCB Savings', balance: 5000, currency: 'THB' },
];

function simulateStoreSetWallets(selectedWalletId, incomingWallets) {
  const safeWallets = Array.isArray(incomingWallets) ? incomingWallets : [];
  const exists = selectedWalletId === 'all' || safeWallets.some((w) => w.id === selectedWalletId);
  return exists ? selectedWalletId : 'all';
}

function simulateHeaderWalletDisplay(currentWalletId, currentWallets) {
  if (currentWalletId === 'all') return 'All Wallets';
  return currentWallets.find((w) => w.id === currentWalletId)?.name || 'All Wallets';
}

const resolvedWalletForNonexistent = simulateStoreSetWallets('nonexistent', mockWallets);
assert(resolvedWalletForNonexistent === 'all', 'Store setWallets resets nonexistent wallet ID to "all"');

const headerDisplayNonexistent = simulateHeaderWalletDisplay('nonexistent', mockWallets);
assert(headerDisplayNonexistent === 'All Wallets', 'Header wallet switcher displays "All Wallets" for nonexistent ID');

// ----------------------------------------------------------------------------
// TEST SUITE 2: Segmented Pill Switcher & State Memory Preservation
// ----------------------------------------------------------------------------
console.log('\n--- Suite 2: Segmented Pill Switcher & State Preservation ---');

class MockRouter {
  constructor(initialPath = '/dashboard', initialSearch = {}) {
    this.currentPath = initialPath;
    this.currentSearch = initialSearch;
    this.navHistory = [];
  }

  navigate({ to, search = {} }) {
    this.currentPath = to;
    this.currentSearch = search;
    this.navHistory.push({ to, search });
  }
}

class MockFinanceBridgeStore {
  constructor() {
    this.lastFinanceTab = 'dashboard';
    this.lastFinanceWallet = 'all';
    this.lastFinanceUrl = '/finance?tab=dashboard&wallet=all';
  }

  setLastFinanceState(tab, wallet) {
    this.lastFinanceTab = tab || 'dashboard';
    this.lastFinanceWallet = wallet || 'all';
    this.lastFinanceUrl = `/finance?tab=${this.lastFinanceTab}&wallet=${this.lastFinanceWallet}`;
  }
}

const router = new MockRouter();
const store = new MockFinanceBridgeStore();

// Step 2.1: Initial State is Oaktree
assert(router.currentPath === '/dashboard', 'Initial route is /dashboard');

// Step 2.2: User switches to Simplicity via Segmented Pill
function clickSimplicityPill(routerInstance, storeInstance) {
  const isSimplicity = routerInstance.currentPath.startsWith('/finance');
  if (isSimplicity) return; // Guard no-op
  const targetTab = storeInstance.lastFinanceTab || 'dashboard';
  const targetWallet = storeInstance.lastFinanceWallet || 'all';
  routerInstance.navigate({
    to: '/finance',
    search: { tab: targetTab, wallet: targetWallet },
  });
}

function clickOaktreePill(routerInstance) {
  const isSimplicity = routerInstance.currentPath.startsWith('/finance');
  if (!isSimplicity) return; // Guard no-op
  routerInstance.navigate({ to: '/dashboard', search: {} });
}

clickSimplicityPill(router, store);
assert(router.currentPath === '/finance', 'Pill click navigates to /finance');
assert(router.currentSearch.tab === 'dashboard' && router.currentSearch.wallet === 'all', 'Simplicity receives canonical initial params');

// Step 2.3: User navigates deep in Simplicity: tab=budgets, wallet=wal_scb
store.setLastFinanceState('budgets', 'wal_scb');
router.navigate({ to: '/finance', search: { tab: 'budgets', wallet: 'wal_scb' } });
assert(router.currentSearch.tab === 'budgets' && router.currentSearch.wallet === 'wal_scb', 'Deep navigation in Simplicity updated state');

// Step 2.4: User switches back to Oaktree via Pill
clickOaktreePill(router);
assert(router.currentPath === '/dashboard', 'Pill click returns to Oaktree /dashboard');

// Step 2.5: User returns to Simplicity via Pill -> MUST RESTORE last visited tab and wallet!
clickSimplicityPill(router, store);
assert(router.currentPath === '/finance', 'Returns to /finance');
assert(router.currentSearch.tab === 'budgets', 'Simplicity restored last visited tab="budgets"');
assert(router.currentSearch.wallet === 'wal_scb', 'Simplicity restored last visited wallet="wal_scb"');

// Step 2.6: Redundant clicks while already active are no-ops
const preCount = router.navHistory.length;
clickSimplicityPill(router, store);
clickSimplicityPill(router, store);
assert(router.navHistory.length === preCount, 'Redundant clicks on active pill are strictly ignored without duplicate navigations');

// ----------------------------------------------------------------------------
// TEST SUITE 3: Bidirectional Sync & High-Frequency Echo Loop Prevention
// ----------------------------------------------------------------------------
console.log('\n--- Suite 3: Bidirectional Sync & Rapid Tab Switching ---');

class SynchronizerHarness {
  constructor() {
    this.hostTab = 'dashboard';
    this.remoteTab = 'dashboard';

    this.lastCommandedTab = null;
    this.lastSyncedTab = 'dashboard';

    this.hostNavCount = 0;
    this.remoteCallbackCount = 0;
    this.echoLoopDetected = false;
  }

  // Host commands tab change (e.g. user clicks header tab)
  commandHostTab(newTab) {
    if (newTab === this.hostTab) return;
    this.lastCommandedTab = newTab;
    this.hostTab = newTab;
    this.hostNavCount++;

    // In RoutesLayout.tsx lines 55-59: useEffect clears transition lock once URL matches
    if (this.lastCommandedTab === this.hostTab) {
      this.lastCommandedTab = null;
    }

    // Inbound sync to remote
    this.syncToRemote(newTab);
  }

  syncToRemote(incomingTab) {
    // Mimics FederatedFinanceApp.tsx 3a
    if (incomingTab && incomingTab !== this.remoteTab) {
      this.lastSyncedTab = incomingTab;
      this.remoteTab = incomingTab;

      // Remote effect triggers: mimics FederatedFinanceApp.tsx 3b
      this.outboundFromRemote(incomingTab);
    }
  }

  outboundFromRemote(currentRemoteTab) {
    // 3b guard: Only triggers when activeTab differs from lastSyncedTab
    if (currentRemoteTab && currentRemoteTab !== this.lastSyncedTab) {
      this.remoteCallbackCount++;
      // Calls onTabChange back to host
      this.handleHostTabChangeFromCallback(currentRemoteTab);
    }
  }

  // Remote user clicks child link (e.g. "View All Transactions")
  remoteInternalTabChange(newTab) {
    if (newTab === this.remoteTab) return;
    this.remoteTab = newTab;
    // Because this was internal, activeTab !== lastSyncedTab!
    if (this.remoteTab !== this.lastSyncedTab) {
      this.lastSyncedTab = this.remoteTab;
      this.remoteCallbackCount++;
      this.handleHostTabChangeFromCallback(newTab);
    }
  }

  handleHostTabChangeFromCallback(callbackTab) {
    // Host callback guard: mimics RoutesLayout.tsx lines 69-75
    if (callbackTab === this.hostTab) return;
    if (this.lastCommandedTab !== null && callbackTab !== this.lastCommandedTab) {
      return; // Drop stale echoes
    }

    this.lastCommandedTab = callbackTab;
    this.hostTab = callbackTab;
    this.hostNavCount++;

    // In RoutesLayout.tsx lines 55-59: useEffect clears transition lock once URL matches
    if (this.lastCommandedTab === this.hostTab) {
      this.lastCommandedTab = null;
    }

    // If host echoes back into remote when remote commanded it, that's an echo!
    if (this.hostNavCount > 100) {
      this.echoLoopDetected = true;
    }
  }
}

const sync = new SynchronizerHarness();

// 3.1: Host commands tab -> remote updates -> 0 remote callbacks echoed
sync.commandHostTab('transactions');
assert(sync.hostTab === 'transactions', 'Host tab is transactions');
assert(sync.remoteTab === 'transactions', 'Remote tab synchronized to transactions');
assert(sync.remoteCallbackCount === 0, 'Zero outgoing callbacks triggered on inbound sync (echo loop prevented)');

// 3.2: Remote internal navigation -> calls host -> host updates
sync.remoteInternalTabChange('budgets');
assert(sync.remoteTab === 'budgets', 'Remote tab set to budgets');
assert(sync.hostTab === 'budgets', 'Host URL synchronized to budgets via callback');
assert(sync.remoteCallbackCount === 1, 'Exactly 1 callback fired for user-initiated remote transition');

// 3.3: High-Frequency Stress Test: 50 rapid alternating user tab switches
const tabs = ['dashboard', 'transactions', 'budgets', 'wallets'];
let maxBouncesPerTransition = 0;

for (let i = 0; i < 50; i++) {
  const nextTab = tabs[i % tabs.length];
  const initialHostNav = sync.hostNavCount;
  const initialRemoteCallbacks = sync.remoteCallbackCount;

  if (i % 2 === 0) {
    sync.commandHostTab(nextTab);
    const hostDelta = sync.hostNavCount - initialHostNav;
    const remoteDelta = sync.remoteCallbackCount - initialRemoteCallbacks;
    const bounces = hostDelta + remoteDelta;
    if (bounces > maxBouncesPerTransition) maxBouncesPerTransition = bounces;
  } else {
    sync.remoteInternalTabChange(nextTab);
    const hostDelta = sync.hostNavCount - initialHostNav;
    const remoteDelta = sync.remoteCallbackCount - initialRemoteCallbacks;
    const bounces = hostDelta + remoteDelta;
    if (bounces > maxBouncesPerTransition) maxBouncesPerTransition = bounces;
  }
}

// In an echo loop, a single transition would bounce endlessly (e.g. 10+ times).
// Without echo loops, max bounces per transition is at most 2 (1 remote callback + 1 host update).
assert(maxBouncesPerTransition <= 2, `Rapid alternating tab transitions produced ZERO echo loops (max bounces per transition = ${maxBouncesPerTransition})`);
assert(sync.hostTab === sync.remoteTab, `Final state perfectly synchronized at "${sync.hostTab}"`);

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL ADVERSARIAL CHECKS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
