import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MobileTransactionView } from '../../src/components/MobileTransactionView';
import { useTransactionForm } from '../../src/hooks/useTransactionForm';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import type { Wallet, Category } from '../../src/types';

const wallet = (id: string, name: string, balance = 1000): Wallet => ({
  id,
  userId: 'u1',
  name,
  type: 'bank',
  currency: 'THB',
  startingBalance: 0,
  currentBalance: balance,
  computed_balance: balance,
  color: '#10b981',
  icon: 'Wallet',
  orderIndex: 0,
  status: 'active',
  createdAt: '2026-01-01',
});

const cat = (id: string, name: string, type: 'expense' | 'income', position = 0): Category => ({
  id,
  name,
  type,
  color: '#ef4444',
  icon: 'Tag',
  position,
  status: 'active',
});

const wallets = [wallet('w1', 'Main Wallet', 5000), wallet('w2', 'Savings', 100)];
const expenseCats = Array.from({ length: 8 }, (_, i) => cat(`e${i}`, `Expense ${i}`, 'expense', i));
const categories = [...expenseCats, cat('i1', 'Salary', 'income')];

function TestWrapper({
  onSave,
  onTransfer,
}: {
  onSave: (data: any) => Promise<void>;
  onTransfer: (data: any) => Promise<void>;
}) {
  const form = useTransactionForm({
    wallets,
    categories,
    onSave,
    onTransfer,
  });

  return <MobileTransactionView form={form} wallets={wallets} categories={categories} />;
}

describe('MobileTransactionView', () => {
  beforeEach(() => {
    useFinanceStore.setState({
      isAddTxOpen: true,
      editingTx: null,
      selectedWalletId: 'all',
      theme: 'dark',
    });
  });

  it('renders mobile full-screen view with header, back button, and sticky submit button', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onTransfer = vi.fn().mockResolvedValue(undefined);

    render(<TestWrapper onSave={onSave} onTransfer={onTransfer} />);

    expect(screen.getByTestId('mobile-transaction-view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'New Transaction' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Transaction' })).toBeInTheDocument();
  });

  it('closes view when back button is clicked', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onTransfer = vi.fn().mockResolvedValue(undefined);

    render(<TestWrapper onSave={onSave} onTransfer={onTransfer} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(useFinanceStore.getState().isAddTxOpen).toBe(false);
  });

  it('switches between Expense, Income, and Transfer modes on mobile', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onTransfer = vi.fn().mockResolvedValue(undefined);

    render(<TestWrapper onSave={onSave} onTransfer={onTransfer} />);

    const incomeTab = screen.getByRole('tab', { name: /Income/i });
    fireEvent.click(incomeTab);
    expect(incomeTab).toHaveAttribute('aria-selected', 'true');
    expect(incomeTab.className).toContain('!bg-emerald-500');

    const transferTab = screen.getByRole('tab', { name: /Transfer/i });
    fireEvent.click(transferTab);
    expect(transferTab).toHaveAttribute('aria-selected', 'true');
    expect(transferTab.className).toContain('!bg-sky-500');
    expect(screen.getByLabelText('From Wallet')).toBeInTheDocument();
    expect(screen.getByLabelText('To Wallet')).toBeInTheDocument();
  });

  it('validates amount and submits an expense transaction', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onTransfer = vi.fn().mockResolvedValue(undefined);

    render(<TestWrapper onSave={onSave} onTransfer={onTransfer} />);

    // Click submit without amount
    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));
    expect(await screen.findByText('Please enter an amount')).toBeInTheDocument();

    // Type amount and submit
    fireEvent.change(screen.getByLabelText(/Amount \(THB\)/i), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -250,
      })
    );
  });

  it('opens AI scanner and closes form when Sparkles button is clicked', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onTransfer = vi.fn().mockResolvedValue(undefined);

    render(<TestWrapper onSave={onSave} onTransfer={onTransfer} />);

    fireEvent.click(screen.getByRole('button', { name: 'Scan Receipt with AI' }));
    expect(useFinanceStore.getState().isAddTxOpen).toBe(false);
    expect(useFinanceStore.getState().isAiScanOpen).toBe(true);
  });
});

