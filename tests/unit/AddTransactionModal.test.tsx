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

const renderModal = (props?: { onDelete?: (id: string) => Promise<void> }) => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onTransfer = vi.fn().mockResolvedValue(undefined);
  const onDelete = props?.onDelete || vi.fn().mockResolvedValue(undefined);
  render(
    <AddTransactionModal
      wallets={wallets}
      categories={categories}
      onSave={onSave}
      onTransfer={onTransfer}
      onDelete={onDelete}
    />
  );
  return { onSave, onTransfer, onDelete };
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
    const expenseTab = screen.getByRole('tab', { name: /Expense/i });
    expect(expenseTab).toHaveAttribute('aria-selected', 'true');
    expect(expenseTab.className).toContain('!bg-rose-500');
    expect(screen.getByRole('tab', { name: /Income/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Transfer/i })).toBeInTheDocument();

    const amount = screen.getByLabelText(/Amount \(THB\)/i);
    expect(amount).toHaveAttribute('type', 'text');
    expect(amount).toHaveAttribute('inputmode', 'decimal');

    expect(screen.getByLabelText(/Keep window open/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Transaction' })).toBeInTheDocument();
  });

  it('clearly highlights active tab with distinct styles for Expense, Income, and Transfer', () => {
    renderModal();
    const expenseTab = screen.getByRole('tab', { name: /Expense/i });
    const incomeTab = screen.getByRole('tab', { name: /Income/i });
    const transferTab = screen.getByRole('tab', { name: /Transfer/i });

    // Expense is active initially
    expect(expenseTab.className).toContain('!bg-rose-500');
    expect(incomeTab.className).not.toContain('!bg-');

    // Switch to Income
    fireEvent.click(incomeTab);
    expect(incomeTab).toHaveAttribute('aria-selected', 'true');
    expect(incomeTab.className).toContain('!bg-emerald-500');
    expect(expenseTab.className).not.toContain('!bg-');

    // Switch to Transfer
    fireEvent.click(transferTab);
    expect(transferTab).toHaveAttribute('aria-selected', 'true');
    expect(transferTab.className).toContain('!bg-sky-500');
    expect(incomeTab.className).not.toContain('!bg-');
  });

  it('is a centered dialog on desktop', () => {
    renderModal();
    const cls = screen.getByTestId('add-transaction-modal').className;
    expect(cls).toContain('max-w-lg');
    expect(cls).toContain('rounded-3xl');
    expect(cls).toContain('-translate-y-1/2');
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

  it('submits an expense as a negative amount with parsed hashtags and date', async () => {
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
        startDate: expect.any(String),
        start_date: expect.any(String),
      })
    );
    await waitFor(() => expect(useFinanceStore.getState().isAddTxOpen).toBe(false));
  });

  it('submits income as a positive amount using income categories', async () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByRole('tab', { name: /Income/i }));
    typeAmount('900');
    expect(screen.getByTitle('Salary')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show all/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amount: 900, categoryId: 'i1' }));
  });

  it('transfer mode shows from/to wallets, hides category and calls onTransfer', async () => {
    const { onSave, onTransfer } = renderModal();
    fireEvent.click(screen.getByRole('tab', { name: /Transfer/i }));
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

  it('validates and shows error alert when amount is empty or zero', async () => {
    const { onSave } = renderModal();
    typeAmount('0');
    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Amount must be greater than 0/i);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('validates and shows error alert when amount exceeds limit', async () => {
    const { onSave } = renderModal();
    typeAmount('1000000000');
    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Amount cannot exceed 999,999,999/i);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('validates transfer mode when source and destination wallet are identical', async () => {
    const { onTransfer } = renderModal();
    fireEvent.click(screen.getByRole('tab', { name: /Transfer/i }));
    typeAmount('200');

    // Set to-wallet to match from-wallet
    fireEvent.change(screen.getByLabelText('To Wallet'), { target: { value: 'w1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Source and destination wallets must be different/i);
    });
    expect(onTransfer).not.toHaveBeenCalled();
  });

  it('validates note length not exceeding 255 characters', async () => {
    const { onSave } = renderModal();
    typeAmount('100');
    const longNote = 'A'.repeat(256);
    fireEvent.change(screen.getByLabelText('Note / Description'), { target: { value: longNote } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Note cannot exceed 255 characters/i);
    });
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

  it('prefills fields and updates transaction with modified date', async () => {
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
    const { onSave } = renderModal();

    await waitFor(() => {
      expect(screen.getByLabelText(/Amount \(THB\)/i)).toHaveValue('75');
    });
    expect(screen.getByLabelText('Note / Description')).toHaveValue('Taxi');
    expect(screen.getByLabelText('Hashtags')).toHaveValue('#ride');
    expect(screen.getByRole('button', { name: 'Update Transaction' })).toBeInTheDocument();

    // User changes date
    fireEvent.change(screen.getByLabelText('Date & Time'), { target: { value: '2026-11-05T14:30' } });
    expect(screen.getByLabelText('Date & Time')).toHaveValue('2026-11-05T14:30');

    // User submits update
    fireEvent.click(screen.getByRole('button', { name: 'Update Transaction' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 't1',
        startDate: '2026-11-05T14:30',
        start_date: '2026-11-05T14:30',
        amount: -75,
      })
    );
  });

  it('applies light surface classes without the dark scope in light theme', () => {
    useFinanceStore.setState({ theme: 'light' });
    renderModal();
    const cls = screen.getByTestId('add-transaction-modal').className;
    expect(cls).toContain('bg-white');
    expect(cls.split(/\s+/)).not.toContain('dark');
  });

  it('stacks in ADR-0021 remote modal tier (overlay 1399, content 1400)', () => {
    renderModal();
    expect(screen.getByTestId('add-transaction-modal').className).toContain('z-[var(--oaktree-z-remote-modal,1400)]');
    const overlay = document.querySelector('[data-state="open"].fixed.inset-0');
    expect(overlay?.className).toContain('z-[calc(var(--oaktree-z-remote-modal,1400)-1)]');
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

  it('supports inline two-step deletion on desktop in edit mode', async () => {
    const tx = {
      id: 'tx-desktop-del',
      wallet_id: 'w1',
      category_id: 'e1',
      type: 'REGULAR',
      amount: -120,
      currency: 'THB',
      start_date: '2026-11-06T10:00:00',
      note: 'Coffee',
      hashtags: [],
    } as any;

    useFinanceStore.setState({
      isAddTxOpen: true,
      editingTx: tx,
    });

    const onDelete = vi.fn().mockResolvedValue(undefined);
    renderModal({ onDelete });

    expect(screen.getByRole('button', { name: 'Update Transaction' })).toBeInTheDocument();

    // Step 1: Click Delete button
    const deleteBtn = screen.getByTestId('delete-tx-btn');
    fireEvent.click(deleteBtn);

    // Shows confirmation state
    expect(await screen.findByTestId('confirm-delete-tx-btn')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    // Step 2: Confirm Delete
    const confirmBtn = screen.getByTestId('confirm-delete-tx-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('tx-desktop-del');
      expect(useFinanceStore.getState().isAddTxOpen).toBe(false);
      expect(useFinanceStore.getState().editingTx).toBeNull();
    });
  });

  it('resets form fields on successful save so reopened form starts fresh', async () => {
    const { onSave } = renderModal();
    typeAmount('500');
    fireEvent.change(screen.getByLabelText('Note / Description'), { target: { value: 'Donation' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Transaction' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
      expect(useFinanceStore.getState().isAddTxOpen).toBe(false);
    });

    // Reopen modal for new transaction
    useFinanceStore.setState({ isAddTxOpen: true });
    renderModal();

    await waitFor(() => {
      expect(screen.getByLabelText(/Amount \(THB\)/i)).toHaveValue('');
      expect(screen.getByLabelText('Note / Description')).toHaveValue('');
    });
  });
});
