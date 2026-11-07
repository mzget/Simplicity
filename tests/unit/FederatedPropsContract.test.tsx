import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import React from 'react';
import { FederatedFinanceApp } from '../../src/FederatedFinanceApp';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/api/client';
import type { DashboardStats } from '../../src/types';

const mockStats: DashboardStats = {
  totalBalance: 10000,
  periodIncome: 5000,
  periodExpense: 2000,
  periodChange: 3000,
  categoryBreakdown: [],
  cashFlowSeries: [],
};

describe('FederatedFinanceApp Props Contract & pendingAction Cutover', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'usr_owner',
        email: 'rattajak.n@gmail.com',
        name: 'Owner',
        defaultCurrency: 'THB',
      },
    });
    useFinanceStore.setState({
      isAddTxOpen: false,
      isAiScanOpen: false,
      isImportOpen: false,
      isAddWalletOpen: false,
      isEmbedded: false,
    });
    vi.spyOn(api, 'getWallets').mockResolvedValue([]);
    vi.spyOn(api, 'getCategories').mockResolvedValue([]);
    vi.spyOn(api, 'getTransactions').mockResolvedValue([]);
    vi.spyOn(api, 'getBudgets').mockResolvedValue([]);
    vi.spyOn(api, 'getDashboardStats').mockResolvedValue(mockStats);
  });

  it('triggers setIsAddTxOpen and calls onActionConsumed when pendingAction is "add-tx"', async () => {
    const onActionConsumed = vi.fn();

    render(
      <FederatedFinanceApp
        isEmbedded={true}
        allowLocalFallback={false}
        pendingAction="add-tx"
        onActionConsumed={onActionConsumed}
      />
    );

    await waitFor(() => {
      expect(useFinanceStore.getState().isAddTxOpen).toBe(true);
      expect(onActionConsumed).toHaveBeenCalledTimes(1);
    });
  });

  it('triggers setIsAiScanOpen and calls onActionConsumed when pendingAction is "ai-scan"', async () => {
    const onActionConsumed = vi.fn();

    render(
      <FederatedFinanceApp
        isEmbedded={true}
        pendingAction="ai-scan"
        onActionConsumed={onActionConsumed}
      />
    );

    await waitFor(() => {
      expect(useFinanceStore.getState().isAiScanOpen).toBe(true);
      expect(onActionConsumed).toHaveBeenCalledTimes(1);
    });
  });

  it('triggers setIsImportOpen and calls onActionConsumed when pendingAction is "csv-import"', async () => {
    const onActionConsumed = vi.fn();

    render(
      <FederatedFinanceApp
        isEmbedded={true}
        pendingAction="csv-import"
        onActionConsumed={onActionConsumed}
      />
    );

    await waitFor(() => {
      expect(useFinanceStore.getState().isImportOpen).toBe(true);
      expect(onActionConsumed).toHaveBeenCalledTimes(1);
    });
  });

  it('triggers setIsAddWalletOpen and calls onActionConsumed when pendingAction is "add-wallet"', async () => {
    const onActionConsumed = vi.fn();

    render(
      <FederatedFinanceApp
        isEmbedded={true}
        pendingAction="add-wallet"
        onActionConsumed={onActionConsumed}
      />
    );

    await waitFor(() => {
      expect(useFinanceStore.getState().isAddWalletOpen).toBe(true);
      expect(onActionConsumed).toHaveBeenCalledTimes(1);
    });
  });

  it('ignores legacy window oaktree:finance-action CustomEvent (hard cutover)', async () => {
    render(<FederatedFinanceApp isEmbedded={true} />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent('oaktree:finance-action', {
          detail: { action: 'add-tx' },
        })
      );
    });

    // Should NOT open because event listener has been removed
    expect(useFinanceStore.getState().isAddTxOpen).toBe(false);
  });
});
