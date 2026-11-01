import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { WalletsManagerView } from '../../src/components/WalletsManagerView';
import type { Wallet } from '../../src/types';

const baseWallet = {
  id: 'w1',
  userId: 'u1',
  name: 'Main',
  type: 'bank',
  currency: 'THB',
  currentBalance: 0,
  computed_balance: 1500,
  color: '#000',
  icon: 'Wallet',
  orderIndex: 0,
  status: 'active',
  createdAt: '2026-01-01',
};

describe('WalletsManagerView starting balance', () => {
  it('renders camelCase startingBalance', () => {
    const w = { ...baseWallet, startingBalance: 1000 } as Wallet;
    render(<WalletsManagerView wallets={[w]} onDeleteWallet={async () => {}} />);
    expect(screen.getByText(/Starting: 1,000 THB/)).toBeInTheDocument();
  });

  it('falls back to snake_case starting_balance from the API without crashing', () => {
    const w = { ...baseWallet, starting_balance: 2500 } as unknown as Wallet;
    render(<WalletsManagerView wallets={[w]} onDeleteWallet={async () => {}} />);
    expect(screen.getByText(/Starting: 2,500 THB/)).toBeInTheDocument();
  });

  it('defaults to 0 when neither field is present', () => {
    const w = { ...baseWallet } as unknown as Wallet;
    render(<WalletsManagerView wallets={[w]} onDeleteWallet={async () => {}} />);
    expect(screen.getByText(/Starting: 0 THB/)).toBeInTheDocument();
  });
});

