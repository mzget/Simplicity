import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  api,
  setSimplicityConfig,
  getAllowLocalFallback,
  getIsEmbedded,
  setSimplicityApiBaseUrl,
} from '../../src/api/client';

describe('API Client allowLocalFallback & isEmbedded Contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setSimplicityApiBaseUrl('');
    setSimplicityConfig({
      allowLocalFallback: true,
      isEmbedded: false,
      isLocalMode: false,
    });
    localStorage.clear();
  });

  it('updates config via api.setConfig and getters reflect the state', () => {
    expect(getAllowLocalFallback()).toBe(true);
    expect(getIsEmbedded()).toBe(false);

    api.setConfig({
      apiBaseUrl: 'https://api.oaktree.internal',
      allowLocalFallback: false,
      isEmbedded: true,
    });

    expect(getAllowLocalFallback()).toBe(false);
    expect(getIsEmbedded()).toBe(true);
  });

  it('throws error when isEmbedded=true and allowLocalFallback=false on network failure', async () => {
    api.setConfig({
      allowLocalFallback: false,
      isEmbedded: true,
    });

    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.getWallets()).rejects.toThrow();
  });

  it('throws error when isEmbedded=true and allowLocalFallback=false on HTTP 500 error', async () => {
    api.setConfig({
      allowLocalFallback: false,
      isEmbedded: true,
    });

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    await expect(api.getWallets()).rejects.toThrow(/API Error: 500/);
  });

  it('falls back to local storage when isEmbedded=false (standalone mode) on network error', async () => {
    api.setConfig({
      allowLocalFallback: true,
      isEmbedded: false,
    });

    // Seed mock wallet in localStorage
    localStorage.setItem(
      'simplicity_wallets',
      JSON.stringify([
        {
          id: 'w-local',
          name: 'Local Cash',
          type: 'cash',
          currency: 'THB',
          startingBalance: 500,
          currentBalance: 500,
          userId: 'usr_rattajak_n_gmail_com',
          status: 'active',
        },
      ])
    );

    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await api.getWallets();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('w-local');
  });
});
