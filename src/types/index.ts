export type TransactionType = 'REGULAR' | 'TRANSFER';
export type TransferType = 'incoming' | 'outgoing' | null;

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'savings' | 'crypto';
  currency: string;
  startingBalance: number;
  currentBalance: number;
  computed_balance?: number;
  color: string;
  icon: string;
  orderIndex: number;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
}

export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  position: number;
  status: 'active' | 'hidden';
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  category_id: string;
  type: TransactionType;
  transfer_type?: TransferType;
  linked_transaction_id?: string | null;
  target_wallet_id?: string | null;
  amount: number; // Signed float: -150 for expense, +5000 for income
  currency: string;
  foreign_amount?: number | null;
  foreign_currency?: string | null;
  exchange_rate?: number | null;
  start_date: string; // ISO 8601 string
  note?: string | null;
  place?: string | null;
  hashtags?: string | string[]; // stringified JSON array or array
  image_url?: string | null;
  is_pending?: number;
  recurring_rule_id?: string | null;
  status: 'active' | 'deleted';
  created_at: string;
  updated_at: string;

  // Joined fields
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  category_type?: 'expense' | 'income';
  wallet_name?: string;
  wallet_currency?: string;
  target_wallet_name?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  name: string;
  amount: number;
  currency: string;
  category_ids: string; // JSON array string
  period: 'day' | 'week' | 'biweekly' | 'month' | 'year';
  start_date: string;
  status: 'active' | 'closed';
  created_at: string;

  // Computed fields
  currentSpent?: number;
  percentSpent?: number;
  remaining?: number;
}

export interface DashboardStats {
  totalBalance: number;
  periodIncome: number;
  periodExpense: number;
  periodChange: number;
  categoryBreakdown: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    count: number;
    total: number;
  }>;
  cashFlowSeries: Array<{
    date: string;
    income: number;
    expense: number;
    net: number;
  }>;
  transactionCount: number;
}

export type PeriodPreset = 'this_month' | 'last_month' | 'this_week' | 'this_year' | 'all_time' | 'custom';
