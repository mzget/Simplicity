# E2E Test Infrastructure & Test Philosophy

## 1. Test Philosophy & Architecture

### 1.1 Opaque-Box & Requirement-Driven Testing
The end-to-end (E2E) testing framework for the Oaktree Agent & Simplicity Finance Micro-Frontend (MFE) integration adheres to strict opaque-box, requirement-driven testing principles. The test suites treat the integrated systems as black boxes whose internal implementations are verified exclusively through public observable interfaces, boundary contracts, HTTP protocols, DOM elements, and standard web platform events.

No test relies on internal private state, unexported helper mocks, or implementation trivia. Every expected value is authoritatively derived from:
1. `ORIGINAL_REQUEST.md`: Core integration requirements (R1 Module Federation, R2 Unified Navigation, R3 Shared Authentication & Security, R4 Theme & Settings Sync).
2. `PROJECT.md`: Master architecture specification, feature inventory (Features 1–19), and interface contracts (`FederatedFinanceProps`, `oaktree:finance-action` CustomEvent, and JWT Web Crypto API security contracts).
3. Implementation Plan (`implementation_plan.md`): Authoritative architectural contracts for host-remote runtime coordination.

### 1.2 The 4-Tier Test Methodology
The test suite is structured into four distinct, progressive tiers:

```
+-------------------------------------------------------------------------+
| Tier 4: Real-World Workload Scenarios (End-to-End User Journeys)         |
|         Cross-application multi-step flows, error recovery, persistence |
+-------------------------------------------------------------------------+
| Tier 3: Cross-Feature Combinations (Pairwise Feature Interactions)      |
|         Auth + Navigation, Theme + Modals, Rate Sync + Currency Calcs   |
+-------------------------------------------------------------------------+
| Tier 2: Boundary & Corner Cases (>=5 test cases per feature)            |
|         Invalid JWTs, 401s, negative rates, malformed query parameters  |
+-------------------------------------------------------------------------+
| Tier 1: Feature Coverage (>=5 test cases per feature covering happy paths)
|         Direct verification of Features 1 through 19                    |
+-------------------------------------------------------------------------+
```

1. **Tier 1 — Feature Coverage**: Comprehensive verification of primary behavior (happy paths) for every individual feature in the Feature Inventory (>=5 test cases per feature, totaling 95+ test cases).
2. **Tier 2 — Boundary & Corner Cases**: Rigorous testing of boundary conditions, edge cases, error handling, invalid inputs, token expirations, signature tampering, malformed URLs, and fallback states (>=5 test cases per feature, totaling 95+ test cases).
3. **Tier 3 — Cross-Feature Combinations**: Verification of pairwise and multi-feature interactions, ensuring state changes in one domain (e.g., auth, header navigation, theme) do not corrupt or desynchronize dependent features (e.g., API queries, modal state, wallet dropdowns).
4. **Tier 4 — Real-World Workload Scenarios**: Comprehensive user workflows executing multi-step business transactions across host and remote boundaries in realistic production-like sequences.

---

## 2. Feature Inventory Coverage Matrix

| Feature ID | Feature Name | Tier 1 (Happy Path >=5) | Tier 2 (Boundary >=5) | Tier 3 (Cross-Feature) | Tier 4 (Workflows) |
|---|---|---|---|---|---|
| **F-01** | Remote Module Exposure (`./FinanceApp`) | Expose `FederatedFinanceApp`, `remoteEntry.js` format, valid export, chunk loading, props acceptance | Missing props, null container, multiple mounts, unmount cleanup, invalid entry path | Host dynamic import + theme prop pass-through | Scenario 1, Scenario 2 |
| **F-02** | Shared Dependencies & Singleton Management | React 19 singleton identity, ReactDOM singleton, Zustand 5 singleton, version deduplication, context preservation | Version mismatch resolution, null context fallback, concurrent store updates, duplicate registration prevention, memory leaks | Zustand store sync between host bridge and remote store | Scenario 1, Scenario 4 |
| **F-03** | Dynamic Client Runtime Loader | SSR avoidance (`window` guard), `<FederatedErrorBoundary>` render, fallback UI, retry trigger, mount success | Remote network timeout, HTTP 500 on `remoteEntry.js`, corrupt script, multiple retry clicks, fast route changes | Error boundary recovery on tab switch | Scenario 2 |
| **F-04** | Astro 7 Static Path Prerendering | `/finance` registered in `getStaticPaths()`, static HTML generated, client:only mounting, hydration without mismatch, correct route title | Empty route params, extra query strings during SSG, rapid direct URL hitting, canonical path resolution, 404 fallback check | SSG shell load + TanStack Router client hydration | Scenario 1, Scenario 4 |
| **F-05** | Vitest Test Suite Exclude Fix | `vitest.config.ts` excludes `tests/e2e/**`, unit test execution clean, 0 e2e tests picked up by vitest, fast execution, exit code 0 | Glob pattern variations, nested e2e paths, mixed spec file naming, run in CI flag, run with coverage | Vitest runner vs Playwright runner separation | Automated CI check |
| **F-06** | Tailwind Preflight Isolation | `.simplicity-scope` class wrapper, `preflight: false`, Joy UI button styles preserved, Joy typography unmutated, dark styles scoped | Deeply nested elements, unscoped global classes, conflicting utility classes, inline style overrides, reset css leaks | Host Header Joy UI buttons + Remote Tailwind buttons | Scenario 1, Scenario 5 |
| **F-07** | Segmented Pill App Switcher | Pill button renders, Oaktree state active, Simplicity state active, click toggles route, active pill styling | Rapid double-clicks, keyboard navigation (Enter/Space), switching during pending fetch, route history push/replace, URL sync | Switch app + active tab preservation | Scenario 1, Scenario 4 |
| **F-08** | Context-Aware Row 2 Navigation | Simplicity tabs render on `/finance`, Dashboard tab, Transactions tab, Budgets tab, Wallets tab | Unknown tab name in URL, tab switch with unsaved modal, zero wallets available, rapid tab clicks, overflow styling | Row 2 tab switch + URL search param sync | Scenario 1, Scenario 4 |
| **F-09** | TanStack Router Integration (`/finance`) | Schema validation `{ tab, wallet }`, default fallback to `dashboard`/`all`, URL updates on state change, browser back/forward support, query string parsing | Malformed tab string, non-existent wallet ID, extra unknown query params, empty query string `?tab=&wallet=`, SQL injection strings | TanStack query params + Federated Finance props | Scenario 4 |
| **F-10** | Action Controls & Modal Bridge | CustomEvent `'oaktree:finance-action'` dispatch, `add-tx` opens Add modal, `ai-scan` opens Scanner modal, `csv-import` opens CSV modal, event listener attaches | Unknown action name, duplicate rapid dispatches, dispatch when remote unmounted, event detail without action, modal close reset | Header action button click -> Remote modal visibility | Scenario 1, Scenario 5 |
| **F-11** | Wallet Context Sync Bridge | Simplicity emits `onWalletsSync`, Host `financeBridgeStore` receives list, Header dropdown populates, selected wallet syncs, wallet change propagates | Empty wallet array, wallet with 0 balance, special characters in wallet name, 100+ wallets scale, deleted wallet fallback | Wallet selection dropdown + Transactions list filter | Scenario 1, Scenario 4 |
| **F-12** | HMAC-SHA256 JWT Verification (`verifyJwt`) | Valid HS256 signature accepted, correct payload decoded (`email`, `name`, `exp`), valid timestamps, crypto Web API execution, bearer header extraction | Tampered signature rejected, altered payload rejected, expired `exp` rejected, missing signature segment, wrong HMAC key | Host `auth_token` -> API call with Bearer token | Scenario 1, Scenario 3 |
| **F-13** | Elimination of Insecure Fallback | Unauthenticated request rejected with HTTP 401, no default owner fallback in production, `{ error: 'Unauthorized' }` response, protected D1 endpoints, zero records leaked | Empty `Authorization` header, non-Bearer auth scheme, `Bearer null`, `Bearer undefined`, malformed base64 | Production mode switch + 401 enforcement | Scenario 3 |
| **F-14** | Localhost Fallback & "Local Mode" Badge | Localhost origin detected, `IS_LOCAL === 'true'` enables local mock, `X-Simplicity-Mode: local` header, visual "Local Mode" badge rendered, localStorage read/write | Production origin forbidding local mode, switching from local to prod, network error during local mode, corrupted local mock data, toggle badge visibility | Local mode badge + Mock wallet CRUD | Scenario 2 |
| **F-15** | Unified API Client (`simplicityFetch`) | Injects `Authorization: Bearer <token>`, prepends `SIMPLICITY_API_BASE_URL`, handles JSON parsing, returns typed responses, propagates 401 errors | Network timeout handling, non-JSON server responses (502/504), 403 Forbidden handling, retry logic, empty response body | `useAuthStore` token + `simplicityFetch` execution | Scenario 1, Scenario 3 |
| **F-16** | External Auth Store Synchronization | `syncExternalAuth(user, token)` updates store, `isAuthenticated` becomes true, user profile accessible, token stored in memory, session check passes | Null user payload, empty token string, token with whitespace, user with missing email, calling sync multiple times | Host login -> Simplicity auth store hydration | Scenario 1, Scenario 3 |
| **F-17** | Theme Mode Synchronization | `theme="dark"` adds `.dark` class, `theme="light"` removes `.dark` class, dark background applied, text color inverted, instant transition | Undefined theme defaults to light, invalid theme string `'blue'`, rapid toggling dark/light, nested theme containers, system theme preference sync | Host Header Moon/Sun toggle + Remote dark glass view | Scenario 1, Scenario 4 |
| **F-18** | Exchange Rate Synchronization | `usdThbRate` prop updates store, currency calculations multiply by rate, transactions display THB equivalent, default 36.5 applied, real-time recalculation | Rate = 0 rejected (falls back to default), negative rate `-35` rejected, string NaN rate rejected, extreme large rate `999999`, fractional rate `0.0001` | Host Settings Gear rate edit -> Simplicity balance display | Scenario 1 |
| **F-19** | Oaktree Dark Glass UI Adaptation | Dark glass background `#0f172a`, card translucent background `rgba(15, 20, 28, 0.85)`, backdrop blur `20px`, border `rgba(255, 255, 255, 0.1)`, emerald accents | Light mode fallback styles, low-performance browser backdrop filter fallback, contrast ratio compliance, high contrast mode, border radii coherence | Dark glass cards + Host Joy UI dark surfaces | Scenario 1 |

---

## 3. Test Runner Invocation & Architecture

The E2E test suite can be executed via two complementary interfaces:

### 3.1 Single Automated Command
```bash
# Execute complete 4-tier E2E suite via runner script
node scripts/test-e2e-all.mjs

# Execute complete suite with npm alias
npm run test:e2e
```

### 3.2 Tier-Specific & Parametric Invocation
```bash
# Execute only Tier 1 (Feature Coverage)
node scripts/test-e2e-all.mjs --tier=1

# Execute only Tier 2 (Boundary & Corner Cases)
node scripts/test-e2e-all.mjs --tier=2

# Execute only Tier 3 (Cross-Feature Combinations)
node scripts/test-e2e-all.mjs --tier=3

# Execute only Tier 4 (Real-World Workload Scenarios)
node scripts/test-e2e-all.mjs --tier=4

# Execute with JSON report output
node scripts/test-e2e-all.mjs --json

# Execute directly with Playwright CLI
npx playwright test
npx playwright test tests/e2e/tier1-features.spec.ts
npx playwright test tests/e2e/tier2-boundary.spec.ts
npx playwright test tests/e2e/tier3-combinations.spec.ts
npx playwright test tests/e2e/tier4-workflows.spec.ts
```

---

## 4. Test Case Format & Authoritative Derivation

Every test case follows a structured convention:
1. **Target Feature Identifier**: Formatted as `[F-XX] [Tier-X] <Descriptive Title>`.
2. **Explicit Expected Source**: Citations from `PROJECT.md` or `ORIGINAL_REQUEST.md`.
3. **Setup**: Fresh, isolated state setup (clearing localStorage, resetting cookies/headers).
4. **Execution**: Interaction via public UI locators or HTTP requests.
5. **Assertion**: Verification against authoritative contract expectations.

### Example Tier 1 Test Case Structure
```typescript
test('[F-12] [Tier-1] [Happy] accepts valid HMAC-SHA256 JWT and decodes user payload', async () => {
  // Authoritative Source: PROJECT.md § API Security Contract & Feature 12
  const secret = 'shared-test-secret-key-12345';
  const payload = {
    email: 'rattajak.n@gmail.com',
    name: 'Rattajak N.',
    picture: 'https://example.com/avatar.jpg',
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const token = await generateTestJwt(payload, secret);
  const result = await verifyJwt(token, secret);

  expect(result).not.toBeNull();
  expect(result?.email).toBe(payload.email);
  expect(result?.name).toBe(payload.name);
});
```

---

## 5. Tier 4 Real-World Workload Scenarios

### Scenario 1: Complete User Journey Across Host & Remote
1. **Step 1**: User authenticates into Oaktree Agent (`localStorage.setItem('auth_token', token)`).
2. **Step 2**: User clicks the Segmented Pill `[ 💳 Simplicity ]` on Header Row 1.
3. **Step 3**: Navigation transitions to `/finance?tab=dashboard&wallet=all`.
4. **Step 4**: Remote module loads dynamically and receives `user`, `token`, `theme`, and `usdThbRate` via props.
5. **Step 5**: User navigates to Settings Gear in Header and modifies USD/THB rate to `38.20`.
6. **Step 6**: Simplicity finance store updates `usdThbRate` and recalculates total portfolio valuation in THB.
7. **Step 7**: User clicks `+ Add` button on Header Row 2, which dispatches `oaktree:finance-action` (`add-tx`).
8. **Step 8**: `AddTransactionModal` opens in the remote view. User enters an expense transaction.
9. **Step 9**: Transaction saves, wallet balances update, and updated wallet list synchronizes back to Header Row 2.

### Scenario 2: Remote Module Failure & Resilient Recovery
1. **Step 1**: User navigates to `/finance` while the remote module network endpoint encounters a transient failure.
2. **Step 2**: `<FederatedErrorBoundary>` intercepts the script failure without crashing Oaktree's shell or Header.
3. **Step 3**: Fallback UI renders with message `"Failed to load Simplicity Finance"` and an active `"Retry Connection"` button.
4. **Step 4**: Network recovers. User clicks `"Retry Connection"`.
5. **Step 5**: Remote bundle successfully downloads, clears the error boundary, and renders the dashboard.

### Scenario 3: Cross-Application Session Expiration & Refresh Flow
1. **Step 1**: User has an expired token in storage (`exp < Date.now() / 1000`).
2. **Step 2**: Simplicity API client attempts fetch to `/api/wallets`.
3. **Step 3**: Backend `verifyJwt` detects expired token and returns HTTP `401 Unauthorized`.
4. **Step 4**: Simplicity UI intercepts 401, displays notification, and notifies host auth store.
5. **Step 5**: User signs in again, acquiring a fresh valid JWT token.
6. **Step 6**: New token is passed via `syncExternalAuth(newUser, newToken)`.
7. **Step 7**: Subsequent fetch succeeds with HTTP `200 OK`.

### Scenario 4: Deep Link & Browser History State Round-Trip
1. **Step 1**: User visits direct deep link: `/finance?tab=transactions&wallet=wal_kbank`.
2. **Step 2**: TanStack Router validates search params and mounts remote app directly on Transactions tab filtered to KBANK.
3. **Step 3**: User switches tab to `Budgets`. URL updates to `/finance?tab=budgets&wallet=wal_kbank`.
4. **Step 4**: User clicks Segmented Pill to return to Oaktree `[ 🌳 Oaktree ]` (`/dashboard`).
5. **Step 5**: User clicks browser Back button (`window.history.back()`).
6. **Step 6**: Application returns to `/finance?tab=budgets&wallet=wal_kbank` preserving previous tab and wallet filters.

### Scenario 5: Multi-Modal Action Bridge Flow
1. **Step 1**: User clicks `CSV Import` on Header Row 2.
2. **Step 2**: Remote catches `oaktree:finance-action` (`csv-import`) and opens `CSVImportModal`.
3. **Step 3**: User closes modal and clicks `AI Scanner` on Header Row 2.
4. **Step 4**: Remote catches `oaktree:finance-action` (`ai-scan`) and opens `ReceiptScannerModal`.
5. **Step 5**: Modals operate independently without leaking event listeners or corrupting parent document DOM.
