import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WalletsShelf } from '../../src/components/WalletsShelf';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import type { Wallet } from '../../src/types';

const mockWallets: Wallet[] = [
  {
    id: 'w_spendee',
    userId: 'u1',
    name: 'Spendee Wallet',
    type: 'general',
    currency: 'THB',
    currentBalance: 0,
    computed_balance: 3464594.74,
    color: '#10B981',
    icon: 'Wallet',
    orderIndex: 0,
    status: 'active',
    createdAt: '2026-01-01',
  },
  {
    id: 'w_kbank',
    userId: 'u1',
    name: 'KBank Account',
    type: 'bank',
    currency: 'THB',
    currentBalance: 0,
    computed_balance: 50000,
    color: '#059669',
    icon: 'Landmark',
    orderIndex: 1,
    status: 'active',
    createdAt: '2026-01-01',
  },
];

describe('WalletsShelf Component', () => {
  beforeEach(() => {
    useFinanceStore.setState({
      selectedWalletId: 'all',
      isAddWalletOpen: false,
      usdThbRate: 35.0,
    });
  });

  it('renders section header and Add Wallet button', () => {
    render(<WalletsShelf wallets={mockWallets} />);
    expect(screen.getByText(/Your Wallets & Accounts/i)).toBeInTheDocument();

    const addWalletBtn = screen.getByRole('button', { name: /Add Wallet/i });
    expect(addWalletBtn).toBeInTheDocument();
  });

  it('opens Add Wallet modal when the header button is clicked', () => {
    render(<WalletsShelf wallets={mockWallets} />);
    const addWalletBtn = screen.getByRole('button', { name: /Add Wallet/i });
    fireEvent.click(addWalletBtn);

    expect(useFinanceStore.getState().isAddWalletOpen).toBe(true);
  });

  it('renders All Wallets summary card and each wallet card', () => {
    render(<WalletsShelf wallets={mockWallets} />);

    expect(screen.getByText('All Wallets')).toBeInTheDocument();
    expect(screen.getByText('Spendee Wallet')).toBeInTheDocument();
    expect(screen.getByText('KBank Account')).toBeInTheDocument();
  });

  it('does NOT render the redundant "Connect / Add Wallet" card in the grid', () => {
    render(<WalletsShelf wallets={mockWallets} />);

    // Verify the redundant placeholder card is removed
    expect(screen.queryByText(/Connect \/ Add Wallet/i)).not.toBeInTheDocument();
  });

  it('updates selectedWalletId when clicking All Wallets or an individual wallet card', () => {
    render(<WalletsShelf wallets={mockWallets} />);

    const spendeeCard = screen.getByText('Spendee Wallet');
    fireEvent.click(spendeeCard);
    expect(useFinanceStore.getState().selectedWalletId).toBe('w_spendee');

    const allWalletsCard = screen.getByText('All Wallets');
    fireEvent.click(allWalletsCard);
    expect(useFinanceStore.getState().selectedWalletId).toBe('all');
  });
});

