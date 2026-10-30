import { describe, it, expect, beforeEach } from 'vitest';
import { useFinanceStore } from '../../src/store/useFinanceStore';

describe('useFinanceStore (Theme & Exchange Rate Sync)', () => {
  beforeEach(() => {
    useFinanceStore.setState({
      theme: 'dark',
      usdThbRate: 36.5,
      activeTab: 'dashboard',
      selectedWalletId: 'all',
    });
  });

  it('initializes with default theme and usdThbRate = 36.5', () => {
    const state = useFinanceStore.getState();
    expect(state.theme).toBe('dark');
    expect(state.usdThbRate).toBe(36.5);
  });

  it('synchronizes valid light and dark theme modes', () => {
    useFinanceStore.getState().setTheme('light');
    expect(useFinanceStore.getState().theme).toBe('light');

    useFinanceStore.getState().setTheme('dark');
    expect(useFinanceStore.getState().theme).toBe('dark');
  });

  it('updates usdThbRate when given a positive finite number', () => {
    useFinanceStore.getState().setUsdThbRate(38.25);
    expect(useFinanceStore.getState().usdThbRate).toBe(38.25);
  });

  it('rejects zero, negative, NaN, or Infinite usdThbRate values', () => {
    useFinanceStore.getState().setUsdThbRate(37.0);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);

    useFinanceStore.getState().setUsdThbRate(0);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);

    useFinanceStore.getState().setUsdThbRate(-35.5);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);

    useFinanceStore.getState().setUsdThbRate(NaN);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);

    useFinanceStore.getState().setUsdThbRate(Infinity);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);
  });
});
