import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FederatedFinanceApp } from '../../src/FederatedFinanceApp';
import { WalletsShelf } from '../../src/components/WalletsShelf';
import { DatePeriodBar } from '../../src/components/DatePeriodBar';
import { FilterBar } from '../../src/components/FilterBar';
import { KPICards } from '../../src/components/KPICards';
import { TransactionsList } from '../../src/components/TransactionsList';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import type { Wallet, DashboardStats, Transaction } from '../../src/types';

vi.mock('../../src/api/client', () => ({
  api: {
    getWallets: vi.fn().mockResolvedValue([]),
    getCategories: vi.fn().mockResolvedValue([]),
    getTransactions: vi.fn().mockResolvedValue([]),
    getBudgets: vi.fn().mockResolvedValue([]),
    getDashboardStats: vi.fn().mockResolvedValue({
      totalBalance: 100000,
      periodIncome: 20000,
      periodExpense: 10000,
      periodChange: 10000,
      categoryBreakdown: [],
      cashFlowSeries: [],
    }),
  },
  simplicityFetch: vi.fn(),
  getIsLocalMode: vi.fn().mockReturnValue(true),
}));

const mockWallets: Wallet[] = [
  {
    id: 'w1',
    userId: 'u1',
    name: 'Cash Wallet',
    type: 'cash',
    currency: 'THB',
    currentBalance: 5000,
    computed_balance: 5000,
    color: '#10B981',
    icon: 'Wallet',
    orderIndex: 0,
    status: 'active',
    createdAt: '2026-01-01',
  },
];

const mockStats: DashboardStats = {
  totalBalance: 50000,
  periodIncome: 15000,
  periodExpense: 5000,
  periodChange: 10000,
  categoryBreakdown: [],
  cashFlowSeries: [],
};

const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    user_id: 'u1',
    wallet_id: 'w1',
    category_id: 'c1',
    amount: -350,
    type: 'EXPENSE',
    start_date: '2026-11-06T10:00:00Z',
    note: 'Lunch at cafe',
    category_name: 'Food & Dining',
    category_icon: 'Coffee',
    wallet_name: 'Cash Wallet',
  },
];

describe('Mobile App Layout Padding Optimization', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'u1', email: 'test@example.com', name: 'Test User' },
    });
    useFinanceStore.setState({
      activeTab: 'dashboard',
      selectedWalletId: 'all',
      datePreset: 'this_month',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      usdThbRate: 35.0,
    });
  });

  it('renders FederatedFinanceApp main container with px-0 on mobile for maximized screen width', () => {
    const { container } = render(
      <FederatedFinanceApp
        user={{ email: 'test@example.com', name: 'Test User' }}
        token="mock-token"
      />
    );

    const mainEl = container.querySelector('main');
    expect(mainEl).toBeInTheDocument();
    expect(mainEl?.className).toContain('px-0');
    expect(mainEl?.className).toContain('sm:px-6');
    expect(mainEl?.className).toContain('py-3');
    expect(mainEl?.className).toContain('space-y-3.5');
  });

  it('renders WalletsShelf with responsive tight padding on mobile', () => {
    const { container } = render(<WalletsShelf wallets={mockWallets} />);

    // Check All Wallets card responsive padding
    const allWalletsCard = screen.getByText('All Wallets').closest('div[class*="cursor-pointer"]');
    expect(allWalletsCard?.className).toContain('p-3');
    expect(allWalletsCard?.className).toContain('sm:p-4');

    // Check individual wallet card responsive padding
    const singleWalletCard = screen.getByText('Cash Wallet').closest('div[class*="cursor-pointer"]');
    expect(singleWalletCard?.className).toContain('p-3');
    expect(singleWalletCard?.className).toContain('sm:p-4');
  });

  it('renders DatePeriodBar and FilterBar with compact mobile padding', () => {
    const { container: dateContainer } = render(<DatePeriodBar />);
    const dateCard = dateContainer.firstChild as HTMLElement;
    expect(dateCard.className).toContain('p-1.5');
    expect(dateCard.className).toContain('sm:p-2.5');

    const { container: filterContainer } = render(<FilterBar categories={[]} />);
    const filterCard = filterContainer.firstChild as HTMLElement;
    expect(filterCard.className).toContain('p-1.5');
    expect(filterCard.className).toContain('sm:p-2.5');
  });

  it('renders KPICards with responsive mobile content padding', () => {
    const { container } = render(<KPICards stats={mockStats} currency="THB" />);
    const cardContent = container.querySelector('div[class*="sm:p-5"]');
    expect(cardContent).toBeInTheDocument();
    expect(cardContent?.className).toContain('p-3');
    expect(cardContent?.className).toContain('sm:p-5');
  });

  it('renders TransactionsList items with maximized mobile width padding', () => {
    const { container } = render(
      <TransactionsList transactions={mockTransactions} onDelete={vi.fn()} />
    );

    const txRow = container.querySelector('div[class*="px-3"]');
    expect(txRow).toBeInTheDocument();
    expect(txRow?.className).toContain('px-3');
    expect(txRow?.className).toContain('sm:px-5');
  });
});
