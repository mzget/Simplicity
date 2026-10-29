import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  defaultCurrency: text('default_currency').notNull().default('THB'),
  createdAt: text('created_at').notNull(),
});

export const wallets = sqliteTable('wallets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull().default('cash'), // 'cash' | 'bank' | 'credit' | 'savings' | 'crypto'
  currency: text('currency').notNull().default('THB'),
  startingBalance: real('starting_balance').notNull().default(0),
  currentBalance: real('current_balance').notNull().default(0),
  color: text('color').notNull().default('#12C48B'),
  icon: text('icon').notNull().default('wallet'),
  orderIndex: integer('order_index').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active' | 'archived' | 'deleted'
  createdAt: text('created_at').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id'), // null for global default presets, string for user customized
  name: text('name').notNull(),
  type: text('type').notNull(), // 'expense' | 'income'
  color: text('color').notNull().default('#6B7F8E'),
  icon: text('icon').notNull().default('tag'),
  position: integer('position').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active' | 'hidden'
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  walletId: text('wallet_id').notNull(),
  userId: text('user_id').notNull(),
  categoryId: text('category_id').notNull(),
  type: text('type').notNull().default('REGULAR'), // 'REGULAR' | 'TRANSFER'
  transferType: text('transfer_type'), // 'incoming' | 'outgoing' | null
  linkedTransactionId: text('linked_transaction_id'),
  targetWalletId: text('target_wallet_id'),
  amount: real('amount').notNull(), // Negative for expense, positive for income
  currency: text('currency').notNull().default('THB'),
  foreignAmount: real('foreign_amount'),
  foreignCurrency: text('foreign_currency'),
  exchangeRate: real('exchange_rate'),
  startDate: text('start_date').notNull(), // ISO Date string 'YYYY-MM-DDTHH:mm:ss'
  note: text('note'),
  place: text('place'),
  hashtags: text('hashtags').default('[]'), // JSON array of strings
  imageUrl: text('image_url'),
  isPending: integer('is_pending').notNull().default(0),
  recurringRuleId: text('recurring_rule_id'),
  status: text('status').notNull().default('active'), // 'active' | 'deleted'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  walletId: text('wallet_id'), // null for all wallets
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('THB'),
  categoryIds: text('category_ids').notNull().default('[]'), // JSON array of category IDs
  period: text('period').notNull().default('month'), // 'day' | 'week' | 'biweekly' | 'month' | 'year'
  startDate: text('start_date').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'closed'
  createdAt: text('created_at').notNull(),
});

export const recurringRules = sqliteTable('recurring_rules', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  walletId: text('wallet_id').notNull(),
  categoryId: text('category_id').notNull(),
  amount: real('amount').notNull(),
  note: text('note'),
  frequency: text('frequency').notNull(), // 'daily' | 'working_days' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
  startDate: text('start_date').notNull(),
  nextRunDate: text('next_run_date').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'paused'
  createdAt: text('created_at').notNull(),
});
