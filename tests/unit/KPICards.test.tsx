import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { KPICards } from '../../src/components/KPICards';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { DashboardStats } from '../../src/types';

describe('KPICards Component', () => {
  const mockStats: DashboardStats = {
    totalBalance: 125000,
    periodIncome: 45000,
    periodExpense: 18000,
    periodChange: 27000,
    categoryBreakdown: [],
    cashFlowSeries: [],
  };

  beforeEach(() => {
    useFinanceStore.setState({ usdThbRate: 35.0 });
  });

  it('renders all four metric cards with correct values and currency', () => {
    render(<KPICards stats={mockStats} currency="THB" />);

    expect(screen.getByText(/Total Balance/i)).toBeInTheDocument();
    expect(screen.getByText(/125,000/i)).toBeInTheDocument();

    expect(screen.getByText(/Period Change/i)).toBeInTheDocument();
    expect(screen.getByText(/\+27,000/i)).toBeInTheDocument();

    expect(screen.getByText(/Period Expenses/i)).toBeInTheDocument();
    expect(screen.getByText(/-18,000/i)).toBeInTheDocument();

    expect(screen.getByText(/Period Income/i)).toBeInTheDocument();
    expect(screen.getByText(/\+45,000/i)).toBeInTheDocument();
  });

  it('renders negative period change properly when net deficit', () => {
    const deficitStats: DashboardStats = {
      ...mockStats,
      periodChange: -5000,
      periodIncome: 10000,
      periodExpense: 15000,
    };

    render(<KPICards stats={deficitStats} currency="THB" />);
    expect(screen.getByText(/-5,000/i)).toBeInTheDocument();
    expect(screen.getByText(/Net deficit/i)).toBeInTheDocument();
  });

  it('renders zero values cleanly without awkward negative signs', () => {
    const zeroStats: DashboardStats = {
      ...mockStats,
      totalBalance: 0,
      periodChange: 0,
      periodIncome: 0,
      periodExpense: 0,
    };

    render(<KPICards stats={zeroStats} currency="THB" />);
    expect(screen.queryByText(/-0/)).not.toBeInTheDocument();
  });
});

