import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AddTransactionModal } from '../../src/components/AddTransactionModal';
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
const expenseCats = Array.from({ length: 10 }, (_, i) => cat(`e${i}`, `Expense ${i}`, 'expense', i));
const categories = [...expenseCats, cat('i1', 'Salary', 'income')];

const renderModal = () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onTransfer = vi.fn().mockResolvedValue(undefined);
  render(
    <AddTransactionModal wallets={wallets} categories={categories} onSave={onSave} onTransfer={onTransfer} />
  );
  return { onSave, onTransfer };
};

const typeAmount = (value: string) =>
  fireEvent.change(screen.getByLabelText(/Amount \(THB\)/i), { target: { value } });

describe('AddTransactionModal', () => {
  beforeEach(() => {
    useFinanceStore.setState({
      isAddTxOpen: true,
      editingTx: null,
      selectedWalletId: 'all',
      theme: 'dark',
    });
  });

  it('renders nothing when closed', () => {
    useFinanceStore.setState({ isAddTxOpen: false });
    renderModal();
    expect(screen.queryByTestId('add-transaction-modal')).not.toBeInTheDocument();
  });

  it('renders mode tabs, amount field without number spinner, and footer controls', () => {
    renderModal();
    expect(screen.getByRole('tab', { name: 'Expense' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Income' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Transfer' })).toBeInTheDocument();

    const amount = screen.getByLabelText(/Amount \(THB\)/i);
    expect(amount).toHaveAttribute('type', 'text');
    expect(amount).toHaveAttribute('inputmode', 'decimal');

    expect(screen.getByLabelText(/Keep window open/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Transaction' })).toBeInTheDocument();
  });

  it('is a responsive bottom sheet on mobile and centered dialog on desktop', () => {
    renderModal();
    const cls = screen.getByTestId('add-transaction-modal').className;
    expect(cls).toContain('bottom-0');
    expect(cls).toContain('rounded-t-3xl');
    expect(cls).toContain('sm:max-w-lg');
    expect(cls).toContain('sm:-translate-y-1/2');
  });

  it('sanitizes amount input to digits and a single decimal point', () => {
    renderModal();
    typeAmount('12a3.4.5');
    expect(screen.getByLabelText(/Amount \(THB\)/i)).toHaveValue('123.45');
  });

  it('collapses categories to 8 and toggles Show all / Show less', () => {
    renderModal();
    const group = screen.getByRole('radiogroup', { name: 'Category' });
    expect(group.querySelectorAll('[role="radio"]')).toHaveLength(8);

    fireEvent.click(screen.getByRole('button', { name: /Show all/i }));
    expect(group.querySelectorAll('[role="radio"]')).toHaveLength(10);

    fireEvent.click(screen.getByRole('button', { name: /Show less/i }));
    expect(group.querySelectorAll('[role="radio"]')).toHaveLength(8);
  });

  it('selects the first category by default and allows changing it', () => {
    renderModal();
    expect(screen.getByTitle('Expense 0')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByTitle('Expense 2'));
    expect(screen.getByTitle('Expense 2')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTitle('Expense 0')).toHaveAttribute('aria-checked', 'false');
  });

  it('submits an expense as a negative amount with parsed hashtags', async () => {
    const { onSave } = renderModal();
    typeAmount('150');
    fireEvent.change(screen.getByLabelText('Note / Description'), { target: { value: 'Lunch' } });
    fireEvent.change(screen.getByLabelText('Hashtags'), { target: { value: 'food #weekend' } });
    expect(screen.getByTestId('hashtag-chips')).toHaveTextContent('#food');

    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        walletId: 'w1',
        categoryId: 'e0',
        type: 'REGULAR',
        amount: -150,
        note: 'Lunch',
        hashtags: ['#food', '#weekend'],
      })
    );
    await waitFor(() => expect(useFinanceStore.getState().isAddTxOpen).toBe(false));
  });

  it('submits income as a positive amount using income categories', async () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByRole('tab', { name: 'Income' }));
    typeAmount('900');
    expect(screen.getByTitle('Salary')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show all/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amount: 900, categoryId: 'i1' }));
  });

  it('transfer mode shows from/to wallets, hides category and calls onTransfer', async () => {
    const { onSave, onTransfer } = renderModal();
    fireEvent.click(screen.getByRole('tab', { name: 'Transfer' }));
    expect(screen.queryByRole('radiogroup', { name: 'Category' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('From Wallet')).toBeInTheDocument();
    expect(screen.getByLabelText('To Wallet')).toBeInTheDocument();

    typeAmount('300');
    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));
    await waitFor(() => expect(onTransfer).toHaveBeenCalledTimes(1));
    expect(onTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ fromWalletId: 'w1', toWalletId: 'w2', amount: 300 })
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not submit when amount is empty or zero', async () => {
    const { onSave } = renderModal();
    typeAmount('0');
    fireEvent.submit(screen.getByRole('button', { name: 'Save Transaction' }).closest('form')!);
    await Promise.resolve();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('keeps the window open and clears fields when "keep open" is checked', async () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByLabelText(/Keep window open/i));
    typeAmount('50');
    fireEvent.change(screen.getByLabelText('Note / Description'), { target: { value: 'Coffee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByLabelText(/Amount \(THB\)/i)).toHaveValue(''));
    expect(screen.getByLabelText('Note / Description')).toHaveValue('');
    expect(useFinanceStore.getState().isAddTxOpen).toBe(true);
  });

  it('prefills fields and shows Update button when editing', () => {
    useFinanceStore.setState({
      editingTx: {
        id: 't1',
        wallet_id: 'w2',
        user_id: 'u1',
        category_id: 'e3',
        type: 'REGULAR',
        amount: -75,
        currency: 'THB',
        start_date: '2026-10-30T09:15:00',
        note: 'Taxi',
        hashtags: ['#ride'],
      } as any,
    });
    renderModal();
    expect(screen.getByLabelText(/Amount \(THB\)/i)).toHaveValue('75');
    expect(screen.getByLabelText('Note / Description')).toHaveValue('Taxi');
    expect(screen.getByLabelText('Hashtags')).toHaveValue('#ride');
    expect(screen.getByRole('button', { name: 'Update Transaction' })).toBeInTheDocument();
  });

  it('applies light surface classes without the dark scope in light theme', () => {
    useFinanceStore.setState({ theme: 'light' });
    renderModal();
    const cls = screen.getByTestId('add-transaction-modal').className;
    expect(cls).toContain('bg-white');
    expect(cls.split(/\s+/)).not.toContain('dark');
  });

  it('stacks above the host header (overlay z-[9999], content z-[10000])', () => {
    renderModal();
    expect(screen.getByTestId('add-transaction-modal').className).toContain('z-[10000]');
    const overlay = document.querySelector('[data-state="open"].fixed.inset-0');
    expect(overlay?.className).toContain('z-[9999]');
  });

  it('keeps the dark scope in dark theme', () => {
    renderModal();
    expect(screen.getByTestId('add-transaction-modal').className.split(/\s+/)).toContain('dark');
  });

  it('opens AI scanner and closes the modal from the sparkle button', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Scan Receipt with AI' }));
    expect(useFinanceStore.getState().isAddTxOpen).toBe(false);
    expect(useFinanceStore.getState().isAiScanOpen).toBe(true);
  });
});

