import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MobileTransactionView } from '../../src/components/MobileTransactionView';
import { useTransactionForm } from '../../src/hooks/useTransactionForm';
import { Dialog, DialogContent } from '../../src/components/ui/dialog';
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

function MobileWrapper() {
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
      isEmbedded={true}
    />
  );
}

describe('Z-Index Alignment with Oaktree Host Standards', () => {
  beforeEach(() => {
    useFinanceStore.setState({
      isAddTxOpen: true,
      editingTx: null,
      selectedWalletId: 'all',
      theme: 'dark',
    });
  });

  it('MobileTransactionView uses z-[var(--oaktree-z-remote-modal,1400)]', () => {
    render(<MobileWrapper />);
    const el = screen.getByTestId('mobile-transaction-view');
    expect(el.className).toContain('z-[var(--oaktree-z-remote-modal,1400)]');
    expect(el.className).not.toContain('z-[10000]');
  });

  it('DialogContent uses z-[var(--oaktree-z-remote-modal,1400)]', () => {
    render(
      <Dialog open={true}>
        <DialogContent data-testid="test-dialog-content">
          <div>Dialog body</div>
        </DialogContent>
      </Dialog>
    );

    const dialogEl = screen.getByTestId('test-dialog-content');
    expect(dialogEl.className).toContain('z-[var(--oaktree-z-remote-modal,1400)]');
    expect(dialogEl.className).not.toContain('z-[10000]');
  });
});
