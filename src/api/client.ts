import { Wallet, Category, Transaction, Budget, DashboardStats } from '../types';
import { DEFAULT_CATEGORIES } from '../db/defaultCategories';
import { useAuthStore } from '../store/useAuthStore';

const STORAGE_KEYS = {
  WALLETS: 'simplicity_wallets',
  TRANSACTIONS: 'simplicity_transactions',
  CATEGORIES: 'simplicity_categories',
  BUDGETS: 'simplicity_budgets',
  AUTH: 'simplicity_auth_user',
  TOKEN: 'auth_token',
};

let configuredApiBaseUrl: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SIMPLICITY_API_BASE_URL) || '';

let clientIsLocalMode: boolean =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const isLocalHostEnvironment = (): boolean => {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  }
  return true;
};

export const getIsLocalMode = (): boolean => clientIsLocalMode;
export const setIsLocalMode = (val: boolean): void => {
  clientIsLocalMode = val;
};

export const setSimplicityApiBaseUrl = (baseUrl: string): void => {
  configuredApiBaseUrl = (baseUrl || '').replace(/\/+$/, '');
};

export const getSimplicityApiBaseUrl = (): string => configuredApiBaseUrl;

export const getAuthToken = (): string | null => {
  const storeToken = useAuthStore.getState?.()?.token;
  if (storeToken && typeof storeToken === 'string' && storeToken.trim().length > 0) {
    return storeToken.trim();
  }
  if (typeof window !== 'undefined') {
    try {
      const localToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (localToken && localToken.trim().length > 0 && localToken !== 'null' && localToken !== 'undefined') {
        return localToken.trim();
      }
    } catch (_) {}
  }
  return null;
};

/**
 * Unified API client fetch utility attaching Authorization: Bearer <token>
 * and prepending SIMPLICITY_API_BASE_URL.
 */
export async function simplicityFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const baseUrl = configuredApiBaseUrl ? configuredApiBaseUrl.replace(/\/+$/, '') : '';
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${baseUrl}${normalizedEndpoint}`;

  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([k, v]) => {
        headers[k] = v;
      });
    } else {
      Object.assign(headers, init.headers as Record<string, string>);
    }
  }

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.headers?.get?.('X-Simplicity-Mode') === 'local') {
    clientIsLocalMode = true;
  }

  return res;
}

export const getCurrentUserId = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) return u.id;
      }
    } catch (_) {}
  }
  return 'usr_rattajak_n_gmail_com';
};

export const migrateUserDataToUser = (targetUserId: string) => {
  if (typeof window === 'undefined' || !targetUserId) return;
  try {
    const wRaw = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (wRaw) {
      const wallets: Wallet[] = JSON.parse(wRaw);
      const updated = wallets.map((w) => (w.userId === 'usr_owner' ? { ...w, userId: targetUserId } : w));
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(updated));
    }
    const txRaw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (txRaw) {
      const txs: Transaction[] = JSON.parse(txRaw);
      const updated = txs.map((t) => (t.user_id === 'usr_owner' ? { ...t, user_id: targetUserId } : t));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    }
    const bRaw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (bRaw) {
      const budgets: Budget[] = JSON.parse(bRaw);
      const updated = budgets.map((b) => (b.user_id === 'usr_owner' ? { ...b, user_id: targetUserId } : b));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));
    }
  } catch (_) {}
};

// Migrate legacy keys if present
if (typeof window !== 'undefined') {
  if (localStorage.getItem('spendee_clone_wallets') && !localStorage.getItem(STORAGE_KEYS.WALLETS)) {
    localStorage.setItem(STORAGE_KEYS.WALLETS, localStorage.getItem('spendee_clone_wallets')!);
  }
  if (localStorage.getItem('spendee_clone_transactions') && !localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, localStorage.getItem('spendee_clone_transactions')!);
  }
  if (localStorage.getItem('spendee_clone_categories') && !localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, localStorage.getItem('spendee_clone_categories')!);
  }
  if (localStorage.getItem('spendee_clone_budgets') && !localStorage.getItem(STORAGE_KEYS.BUDGETS)) {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, localStorage.getItem('spendee_clone_budgets')!);
  }
}

// Seed initial realistic mock data for instant preview
const seedInitialData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.WALLETS)) {
    const initialWallets: Wallet[] = [
      {
        id: 'wal_cash',
        userId: 'usr_owner',
        name: 'Cash Wallet',
        type: 'cash',
        currency: 'THB',
        startingBalance: 12500,
        currentBalance: 12500,
        color: '#12C48B',
        icon: 'Wallet',
        orderIndex: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'wal_kbank',
        userId: 'usr_owner',
        name: 'KBank Primary',
        type: 'bank',
        currency: 'THB',
        startingBalance: 185400,
        currentBalance: 185400,
        color: '#2ECC71',
        icon: 'Landmark',
        orderIndex: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'wal_credit',
        userId: 'usr_owner',
        name: 'Citi Rewards Card',
        type: 'credit',
        currency: 'THB',
        startingBalance: -8500,
        currentBalance: -8500,
        color: '#38A3F1',
        icon: 'CreditCard',
        orderIndex: 2,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(initialWallets));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }

  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    const now = new Date();
    const isoDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString();
    };

    const initialTransactions: Transaction[] = [
      {
        id: 'tx_1',
        wallet_id: 'wal_kbank',
        user_id: 'usr_owner',
        category_id: 'cat_salary',
        type: 'REGULAR',
        amount: 85000,
        currency: 'THB',
        start_date: isoDate(1),
        note: 'Monthly Salary Deposit',
        hashtags: ['#work', '#salary'],
        status: 'active',
        created_at: isoDate(1),
        updated_at: isoDate(1),
      },
      {
        id: 'tx_2',
        wallet_id: 'wal_kbank',
        user_id: 'usr_owner',
        category_id: 'cat_housing',
        type: 'REGULAR',
        amount: -22000,
        currency: 'THB',
        start_date: isoDate(2),
        note: 'Condo Rent & Maintenance',
        hashtags: ['#home', '#rent'],
        status: 'active',
        created_at: isoDate(2),
        updated_at: isoDate(2),
      },
      {
        id: 'tx_3',
        wallet_id: 'wal_credit',
        user_id: 'usr_owner',
        category_id: 'cat_food',
        type: 'REGULAR',
        amount: -1450,
        currency: 'THB',
        start_date: isoDate(0),
        note: 'Sushi dinner with team',
        hashtags: ['#dinner', '#sushi'],
        status: 'active',
        created_at: isoDate(0),
        updated_at: isoDate(0),
      },
      {
        id: 'tx_4',
        wallet_id: 'wal_cash',
        user_id: 'usr_owner',
        category_id: 'cat_food',
        type: 'REGULAR',
        amount: -120,
        currency: 'THB',
        start_date: isoDate(0),
        note: 'Iced Americano Cafe Amazon',
        hashtags: ['#coffee'],
        status: 'active',
        created_at: isoDate(0),
        updated_at: isoDate(0),
      },
      {
        id: 'tx_5',
        wallet_id: 'wal_credit',
        user_id: 'usr_owner',
        category_id: 'cat_shopping',
        type: 'REGULAR',
        amount: -3200,
        currency: 'THB',
        start_date: isoDate(3),
        note: 'Uniqlo autumn collection',
        hashtags: ['#clothes'],
        status: 'active',
        created_at: isoDate(3),
        updated_at: isoDate(3),
      },
      {
        id: 'tx_6',
        wallet_id: 'wal_kbank',
        user_id: 'usr_owner',
        category_id: 'cat_vehicle',
        type: 'REGULAR',
        amount: -1600,
        currency: 'THB',
        start_date: isoDate(4),
        note: 'Gasoline refill PTT Station',
        hashtags: ['#gas', '#car'],
        status: 'active',
        created_at: isoDate(4),
        updated_at: isoDate(4),
      },
      {
        id: 'tx_7',
        wallet_id: 'wal_kbank',
        user_id: 'usr_owner',
        category_id: 'cat_dividends',
        type: 'REGULAR',
        amount: 4350,
        currency: 'THB',
        start_date: isoDate(5),
        note: 'Quarterly Stock Dividend',
        hashtags: ['#investment', '#passive'],
        status: 'active',
        created_at: isoDate(5),
        updated_at: isoDate(5),
      },
      {
        id: 'tx_8',
        wallet_id: 'wal_credit',
        user_id: 'usr_owner',
        category_id: 'cat_entertainment',
        type: 'REGULAR',
        amount: -419,
        currency: 'THB',
        start_date: isoDate(6),
        note: 'Netflix Premium 4K subscription',
        hashtags: ['#subscription', '#streaming'],
        status: 'active',
        created_at: isoDate(6),
        updated_at: isoDate(6),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
  }

  if (!localStorage.getItem(STORAGE_KEYS.BUDGETS)) {
    const initialBudgets: Budget[] = [
      {
        id: 'bud_food',
        user_id: 'usr_owner',
        name: 'Food & Dining Limit',
        amount: 15000,
        currency: 'THB',
        category_ids: JSON.stringify(['cat_food']),
        period: 'month',
        start_date: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'bud_shopping',
        user_id: 'usr_owner',
        name: 'Shopping & Leisure',
        amount: 10000,
        currency: 'THB',
        category_ids: JSON.stringify(['cat_shopping', 'cat_entertainment']),
        period: 'month',
        start_date: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(initialBudgets));
  }
};

// Initialize seed data
seedInitialData();

const handleApiOrLocalFallback = async <T>(
  requestFn: () => Promise<Response>,
  localFallbackFn: () => T | Promise<T>
): Promise<T> => {
  const isLocal = isLocalHostEnvironment();
  try {
    const res = await requestFn();
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 401 && !isLocal) {
      throw new Error('401 Unauthorized');
    }
    if (!isLocal) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    if (!isLocal) {
      throw err;
    }
  }

  clientIsLocalMode = true;
  return await localFallbackFn();
};

export const api = {
  setBaseUrl(baseUrl: string) {
    setSimplicityApiBaseUrl(baseUrl);
  },

  setConfig(config: { apiBaseUrl?: string; isLocalMode?: boolean }) {
    if (config.apiBaseUrl !== undefined) {
      setSimplicityApiBaseUrl(config.apiBaseUrl);
    }
    if (config.isLocalMode !== undefined) {
      setIsLocalMode(config.isLocalMode);
    }
  },

  isLocalMode(): boolean {
    return getIsLocalMode();
  },

  // Wallets
  async getWallets(): Promise<Wallet[]> {
    return handleApiOrLocalFallback(
      () => simplicityFetch('/api/wallets'),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.WALLETS);
        const wallets: Wallet[] = raw ? JSON.parse(raw) : [];
        const txRaw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const txs: Transaction[] = txRaw ? JSON.parse(txRaw) : [];

        return wallets.map((w) => {
          const totalTx = txs
            .filter((t) => t.wallet_id === w.id && t.status === 'active')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          return {
            ...w,
            computed_balance: (w.startingBalance || 0) + totalTx,
          };
        });
      }
    );
  },

  async createWallet(data: Partial<Wallet>): Promise<{ id: string }> {
    return handleApiOrLocalFallback(
      () =>
        simplicityFetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.WALLETS);
        const wallets: Wallet[] = raw ? JSON.parse(raw) : [];
        const id = `wal_${Date.now()}`;
        const newWallet: Wallet = {
          id,
          userId: getCurrentUserId(),
          name: data.name || 'New Wallet',
          type: data.type || 'cash',
          currency: data.currency || 'THB',
          startingBalance: Number(data.startingBalance) || 0,
          currentBalance: Number(data.startingBalance) || 0,
          computed_balance: Number(data.startingBalance) || 0,
          color: data.color || '#12C48B',
          icon: data.icon || 'Wallet',
          orderIndex: wallets.length,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        wallets.push(newWallet);
        localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
        return { id };
      }
    );
  },

  async deleteWallet(id: string): Promise<void> {
    await handleApiOrLocalFallback(
      () => simplicityFetch(`/api/wallets/${id}`, { method: 'DELETE' }),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.WALLETS);
        if (!raw) return;
        const wallets: Wallet[] = JSON.parse(raw).filter((w: Wallet) => w.id !== id);
        localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
      }
    );
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return handleApiOrLocalFallback(
      () => simplicityFetch('/api/categories'),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
      }
    );
  },

  async createCategory(data: Partial<Category>): Promise<{ id: string }> {
    return handleApiOrLocalFallback(
      () =>
        simplicityFetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        const categories: Category[] = raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
        const id = `cat_${Date.now()}`;
        categories.push({
          id,
          name: data.name || 'Custom Category',
          type: data.type || 'expense',
          color: data.color || '#6B7F8E',
          icon: data.icon || 'Tag',
          position: categories.length + 1,
          status: 'active',
        });
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        return { id };
      }
    );
  },

  // Transactions
  async getTransactions(filters?: {
    walletId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<Transaction[]> {
    return handleApiOrLocalFallback(
      () => {
        const params = new URLSearchParams();
        if (filters?.walletId) params.append('walletId', filters.walletId);
        if (filters?.categoryId) params.append('categoryId', filters.categoryId);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.search) params.append('search', filters.search);

        return simplicityFetch(`/api/transactions?${params.toString()}`);
      },
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        let txs: Transaction[] = raw ? JSON.parse(raw) : [];
        const catRaw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        const categories: Category[] = catRaw ? JSON.parse(catRaw) : DEFAULT_CATEGORIES;
        const walRaw = localStorage.getItem(STORAGE_KEYS.WALLETS);
        const wallets: Wallet[] = walRaw ? JSON.parse(walRaw) : [];

        // Filter active
        txs = txs.filter((t) => t.status === 'active');

        if (filters?.walletId && filters.walletId !== 'all') {
          txs = txs.filter((t) => t.wallet_id === filters.walletId || t.target_wallet_id === filters.walletId);
        }
        if (filters?.categoryId && filters.categoryId !== 'all') {
          txs = txs.filter((t) => t.category_id === filters.categoryId);
        }
        if (filters?.startDate) {
          txs = txs.filter((t) => t.start_date >= filters.startDate!);
        }
        if (filters?.endDate) {
          txs = txs.filter((t) => t.start_date <= filters.endDate!);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          txs = txs.filter((t) => (t.note || '').toLowerCase().includes(q));
        }

        // Attach category and wallet metadata
        return txs
          .map((t) => {
            const cat = categories.find((c) => c.id === t.category_id);
            const wal = wallets.find((w) => w.id === t.wallet_id);
            return {
              ...t,
              category_name: cat?.name || 'Uncategorized',
              category_color: cat?.color || '#6B7F8E',
              category_icon: cat?.icon || 'Tag',
              category_type: cat?.type || 'expense',
              wallet_name: wal?.name || 'Wallet',
              wallet_currency: wal?.currency || t.currency || 'THB',
            };
          })
          .sort((a, b) => b.start_date.localeCompare(a.start_date));
      }
    );
  },

  async createTransaction(data: any): Promise<{ id: string }> {
    return handleApiOrLocalFallback(
      () =>
        simplicityFetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const txs: Transaction[] = raw ? JSON.parse(raw) : [];
        const id = `tx_${Date.now()}`;
        const newTx: Transaction = {
          id,
          wallet_id: data.walletId,
          user_id: getCurrentUserId(),
          category_id: data.categoryId,
          type: data.type || 'REGULAR',
          transfer_type: data.transferType || null,
          amount: Number(data.amount),
          currency: data.currency || 'THB',
          start_date: data.startDate || new Date().toISOString(),
          note: data.note || null,
          hashtags: data.hashtags || [],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        txs.unshift(newTx);
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
        return { id };
      }
    );
  },

  async createTransfer(data: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date?: string;
    note?: string;
  }): Promise<void> {
    await handleApiOrLocalFallback(
      () =>
        simplicityFetch('/api/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const txs: Transaction[] = raw ? JSON.parse(raw) : [];
        const outId = `tx_out_${Date.now()}`;
        const inId = `tx_in_${Date.now() + 1}`;
        const date = data.date || new Date().toISOString();
        const amt = Math.abs(Number(data.amount));

        txs.unshift({
          id: outId,
          wallet_id: data.fromWalletId,
          user_id: getCurrentUserId(),
          category_id: 'cat_financial',
          type: 'TRANSFER',
          transfer_type: 'outgoing',
          linked_transaction_id: inId,
          target_wallet_id: data.toWalletId,
          amount: -amt,
          currency: 'THB',
          start_date: date,
          note: data.note || 'Transfer Out',
          hashtags: ['#transfer'],
          status: 'active',
          created_at: date,
          updated_at: date,
        });

        txs.unshift({
          id: inId,
          wallet_id: data.toWalletId,
          user_id: getCurrentUserId(),
          category_id: 'cat_financial',
          type: 'TRANSFER',
          transfer_type: 'incoming',
          linked_transaction_id: outId,
          target_wallet_id: data.fromWalletId,
          amount: amt,
          currency: 'THB',
          start_date: date,
          note: data.note || 'Transfer In',
          hashtags: ['#transfer'],
          status: 'active',
          created_at: date,
          updated_at: date,
        });

        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
      }
    );
  },

  async deleteTransaction(id: string): Promise<void> {
    await handleApiOrLocalFallback(
      () => simplicityFetch(`/api/transactions/${id}`, { method: 'DELETE' }),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (!raw) return;
        const txs: Transaction[] = JSON.parse(raw).filter((t: Transaction) => t.id !== id);
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
      }
    );
  },

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    return handleApiOrLocalFallback(
      () => simplicityFetch('/api/budgets'),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
        const budgets: Budget[] = raw ? JSON.parse(raw) : [];
        const txRaw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const txs: Transaction[] = txRaw ? JSON.parse(txRaw) : [];

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startIso = startOfMonth.toISOString();

        return budgets.map((b) => {
          const categoryIds: string[] = typeof b.category_ids === 'string' ? JSON.parse(b.category_ids) : b.category_ids;
          const spent = txs
            .filter((t) => {
              if (t.status !== 'active' || t.amount >= 0 || t.start_date < startIso) return false;
              if (b.wallet_id && t.wallet_id !== b.wallet_id) return false;
              if (categoryIds.length > 0 && !categoryIds.includes(t.category_id)) return false;
              return true;
            })
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

          return {
            ...b,
            currentSpent: spent,
            percentSpent: Math.min(100, Math.round((spent / b.amount) * 100)),
            remaining: Math.max(0, b.amount - spent),
          };
        });
      }
    );
  },

  async createBudget(data: Partial<Budget>): Promise<{ id: string }> {
    return handleApiOrLocalFallback(
      () =>
        simplicityFetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
        const budgets: Budget[] = raw ? JSON.parse(raw) : [];
        const id = `bud_${Date.now()}`;
        budgets.push({
          id,
          user_id: getCurrentUserId(),
          wallet_id: data.wallet_id || null,
          name: data.name || 'New Budget',
          amount: Number(data.amount) || 1000,
          currency: data.currency || 'THB',
          category_ids: JSON.stringify(data.category_ids || []),
          period: data.period || 'month',
          start_date: new Date().toISOString(),
          status: 'active',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
        return { id };
      }
    );
  },

  async deleteBudget(id: string): Promise<void> {
    await handleApiOrLocalFallback(
      () => simplicityFetch(`/api/budgets/${id}`, { method: 'DELETE' }),
      () => {
        const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
        if (!raw) return;
        const budgets: Budget[] = JSON.parse(raw).filter((b: Budget) => b.id !== id);
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      }
    );
  },

  // Dashboard Stats
  async getDashboardStats(filters?: {
    walletId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardStats> {
    return handleApiOrLocalFallback(
      () => {
        const params = new URLSearchParams();
        if (filters?.walletId) params.append('walletId', filters.walletId);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        return simplicityFetch(`/api/stats/dashboard?${params.toString()}`);
      },
      async () => {
        const wallets = await this.getWallets();
        const txs = await this.getTransactions(filters);

        const totalBalance = wallets.reduce((sum, w) => sum + (w.computed_balance || 0), 0);

        let periodIncome = 0;
        let periodExpense = 0;
        const catMap: Record<string, any> = {};
        const flowMap: Record<string, any> = {};

        txs.forEach((t) => {
          const amt = Number(t.amount);
          const day = t.start_date.slice(0, 10);

          if (!flowMap[day]) {
            flowMap[day] = { date: day, income: 0, expense: 0, net: 0 };
          }

          if (amt > 0) {
            periodIncome += amt;
            flowMap[day].income += amt;
            flowMap[day].net += amt;
          } else if (amt < 0) {
            const exp = Math.abs(amt);
            periodExpense += exp;
            flowMap[day].expense += exp;
            flowMap[day].net -= exp;

            const catId = t.category_id || 'cat_other_exp';
            if (!catMap[catId]) {
              catMap[catId] = {
                id: catId,
                name: t.category_name || 'Other',
                color: t.category_color || '#7F8C8D',
                icon: t.category_icon || 'MoreHorizontal',
                count: 0,
                total: 0,
              };
            }
            catMap[catId].count += 1;
            catMap[catId].total += exp;
          }
        });

        return {
          totalBalance,
          periodIncome,
          periodExpense,
          periodChange: periodIncome - periodExpense,
          categoryBreakdown: Object.values(catMap).sort((a, b) => b.total - a.total),
          cashFlowSeries: Object.values(flowMap).sort((a, b) => a.date.localeCompare(b.date)),
          transactionCount: txs.length,
        };
      }
    );
  },

  // AI Receipt Scanner
  async scanReceipt(data: { ocrText?: string; filename?: string }): Promise<any> {
    return handleApiOrLocalFallback(
      () =>
        simplicityFetch('/api/ai/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
      () => ({
        merchant: data.filename?.includes('coffee') ? 'Starbucks Coffee' : 'Convenience Store',
        amount: -160,
        suggestedCategoryId: 'cat_food',
        date: new Date().toISOString().slice(0, 10),
        confidence: 0.94,
      })
    );
  },

  // Authentication
  async getMe(): Promise<{ user: any | null }> {
    try {
      const res = await simplicityFetch('/api/auth/me');
      if (res.ok) return await res.json();
    } catch (_) {}
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    return raw ? { user: JSON.parse(raw) } : { user: null };
  },

  async loginWithGoogle(payload: { email?: string; credential?: string; name?: string; picture?: string }): Promise<any> {
    const res = await simplicityFetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(data.user));
        migrateUserDataToUser(data.user.id);
      }
      return data;
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Login failed');
  },

  async logout(): Promise<void> {
    try {
      await simplicityFetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },
};
