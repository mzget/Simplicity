import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import React, { useState } from 'react';
import { MobileTransactionView } from '../../src/components/MobileTransactionView';
import { useTransactionForm } from '../../src/hooks/useTransactionForm';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import type { Wallet, Category } from '../../src/types';

const mockWallet: Wallet = {
  id: 'w1',
  userId: 'u1',
  name: 'Main Wallet',
  type: 'bank',
  currency: 'THB',
  startingBalance: 0,
  currentBalance: 1000,
  computed_balance: 1000,
  color: '#10b981',
  icon: 'Wallet',
  orderIndex: 0,
  status: 'active',
  createdAt: '2026-01-01',
};

const mockCategory: Category = {
  id: 'c1',
  name: 'Food',
  type: 'expense',
  color: '#ef4444',
  icon: 'Tag',
  position: 0,
  status: 'active',
};

function MobileViewHost({ isEmbedded }: { isEmbedded?: boolean }) {
  const form = useTransactionForm({
    wallets: [mockWallet],
    categories: [mockCategory],
    onSave: async () => {},
    onTransfer: async () => {},
  });

  return (
    <MobileTransactionView
      form={form}
      wallets={[mockWallet]}
      categories={[mockCategory]}
      isEmbedded={isEmbedded}
    />
  );
}

describe('MobileTransactionView History Guard & Memoized closeForm', () => {
  let pushStateSpy: any;
  let backSpy: any;

  beforeEach(() => {
    pushStateSpy = vi.spyOn(window.history, 'pushState');
    backSpy = vi.spyOn(window.history, 'back');
    useFinanceStore.setState({
      isAddTxOpen: true,
      editingTx: null,
      selectedWalletId: 'all',
      theme: 'dark',
      isEmbedded: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pushes state and calls back() in standalone mode (isEmbedded=false)', () => {
    const { unmount } = render(<MobileViewHost isEmbedded={false} />);

    expect(pushStateSpy).toHaveBeenCalledWith({ simplicityView: 'mobile-tx' }, '');

    // Simulate history.state matching
    Object.defineProperty(window.history, 'state', {
      value: { simplicityView: 'mobile-tx' },
      configurable: true,
    });

    unmount();
    expect(backSpy).toHaveBeenCalled();
  });

  it('SKIPS pushing state and back() when isEmbedded=true (Federated Host mode)', () => {
    const { unmount } = render(<MobileViewHost isEmbedded={true} />);

    expect(pushStateSpy).not.toHaveBeenCalled();

    unmount();
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('SKIPS pushing state when isEmbedded is set in useFinanceStore', () => {
    useFinanceStore.setState({ isEmbedded: true });
    const { unmount } = render(<MobileViewHost />);

    expect(pushStateSpy).not.toHaveBeenCalled();

    unmount();
    expect(backSpy).not.toHaveBeenCalled();
  });

  it('memoizes closeForm callback across parent re-renders in useTransactionForm', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onTransfer = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    const { result, rerender } = renderHook(
      ({ count }) => {
        return useTransactionForm({
          wallets: [mockWallet],
          categories: [mockCategory],
          onSave,
          onTransfer,
          onClose,
        });
      },
      { initialProps: { count: 0 } }
    );

    const firstCloseForm = result.current.closeForm;

    // Trigger re-render with new props
    rerender({ count: 1 });

    expect(result.current.closeForm).toBe(firstCloseForm);
  });
});
