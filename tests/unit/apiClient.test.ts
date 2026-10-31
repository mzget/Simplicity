import { describe, it, expect, vi, beforeEach } from 'vitest';
import { simplicityFetch, setSimplicityApiBaseUrl, getSimplicityApiBaseUrl } from '../../src/api/client';

describe('simplicityFetch URL normalization & routing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setSimplicityApiBaseUrl('');
  });

  it('normalizes duplicate /api prefix when baseUrl ends with /api and endpoint starts with /api', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    global.fetch = fetchMock;

    setSimplicityApiBaseUrl('http://localhost:5173/api');
    await simplicityFetch('/api/wallets');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5173/api/wallets',
      expect.objectContaining({
        headers: expect.any(Object),
      })
    );
  });

  it('handles standard baseUrl without /api and endpoint with /api', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    global.fetch = fetchMock;

    setSimplicityApiBaseUrl('http://localhost:5173');
    await simplicityFetch('/api/wallets');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5173/api/wallets',
      expect.objectContaining({
        headers: expect.any(Object),
      })
    );
  });

  it('trims trailing slashes from configured base URL', async () => {
    setSimplicityApiBaseUrl('http://localhost:5173/api///');
    expect(getSimplicityApiBaseUrl()).toBe('http://localhost:5173/api');
  });

  it('preserves absolute URLs passed directly', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    global.fetch = fetchMock;

    setSimplicityApiBaseUrl('http://localhost:5173');
    await simplicityFetch('https://custom-service.internal/health');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://custom-service.internal/health',
      expect.objectContaining({
        headers: expect.any(Object),
      })
    );
  });
});

