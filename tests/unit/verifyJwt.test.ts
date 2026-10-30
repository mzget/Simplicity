import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signJwt, verifyJwt, app } from '../../functions/api/[[route]]';
import { simplicityFetch, setSimplicityApiBaseUrl, setIsLocalMode, getIsLocalMode } from '../../src/api/client';
import { useAuthStore } from '../../src/store/useAuthStore';

const TEST_SECRET = 'shared-test-secret-key-12345';

describe('HMAC-SHA256 JWT Verification (verifyJwt) & API Security', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    setSimplicityApiBaseUrl('');
    setIsLocalMode(true);
    vi.restoreAllMocks();
  });

  describe('verifyJwt', () => {
    it('accepts valid HMAC-SHA256 JWT and decodes user payload', async () => {
      const payload = {
        email: 'rattajak.n@gmail.com',
        name: 'Rattajak N.',
        picture: 'https://example.com/avatar.jpg',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = await signJwt(payload, TEST_SECRET);
      const result = await verifyJwt(token, TEST_SECRET);

      expect(result).not.toBeNull();
      expect(result?.email).toBe(payload.email);
      expect(result?.name).toBe(payload.name);
      expect(result?.picture).toBe(payload.picture);
    });

    it('rejects expired JWT token (exp in the past)', async () => {
      const payload = {
        email: 'rattajak.n@gmail.com',
        name: 'Rattajak N.',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      };
      const token = await signJwt(payload, TEST_SECRET);
      const result = await verifyJwt(token, TEST_SECRET);

      expect(result).toBeNull();
    });

    it('rejects token with tampered signature', async () => {
      const payload = {
        email: 'rattajak.n@gmail.com',
        name: 'Rattajak N.',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = await signJwt(payload, TEST_SECRET);
      const parts = token.split('.');
      const lastChar = parts[2].slice(-1);
      const tamperedSig = parts[2].slice(0, -1) + (lastChar === 'A' ? 'B' : 'A');
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSig}`;

      const result = await verifyJwt(tamperedToken, TEST_SECRET);
      expect(result).toBeNull();
    });

    it('rejects token with tampered payload', async () => {
      const payload = {
        email: 'rattajak.n@gmail.com',
        name: 'Rattajak N.',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = await signJwt(payload, TEST_SECRET);
      const parts = token.split('.');
      const fakePayload = btoa(JSON.stringify({ email: 'attacker@evil.com', exp: payload.exp }))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const tamperedToken = `${parts[0]}.${fakePayload}.${parts[2]}`;

      const result = await verifyJwt(tamperedToken, TEST_SECRET);
      expect(result).toBeNull();
    });

    it('rejects token signed with wrong secret', async () => {
      const payload = {
        email: 'rattajak.n@gmail.com',
        name: 'Rattajak N.',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = await signJwt(payload, 'wrong-secret-key-999');
      const result = await verifyJwt(token, TEST_SECRET);

      expect(result).toBeNull();
    });

    it('rejects malformed tokens', async () => {
      expect(await verifyJwt('', TEST_SECRET)).toBeNull();
      expect(await verifyJwt('not.a.valid.jwt.token', TEST_SECRET)).toBeNull();
      expect(await verifyJwt('only-one-part', TEST_SECRET)).toBeNull();
    });
  });

  describe('API Route Security Enforcement', () => {
    it('enforces HTTP 401 Unauthorized in production when token is missing', async () => {
      const req = new Request('https://simplicity.pages.dev/api/wallets', {
        method: 'GET',
      });
      const res = await app.fetch(req, {
        JWT_SECRET: TEST_SECRET,
        IS_LOCAL: 'false',
      } as any);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('enforces HTTP 401 Unauthorized in production when token is invalid or expired', async () => {
      const expiredToken = await signJwt(
        { email: 'rattajak.n@gmail.com', exp: Math.floor(Date.now() / 1000) - 60 },
        TEST_SECRET
      );
      const req = new Request('https://simplicity.pages.dev/api/wallets', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });
      const res = await app.fetch(req, {
        JWT_SECRET: TEST_SECRET,
        IS_LOCAL: 'false',
      } as any);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('allows authenticated request in production with valid JWT', async () => {
      const validToken = await signJwt(
        { email: 'rattajak.n@gmail.com', name: 'Rattajak N.', exp: Math.floor(Date.now() / 1000) + 3600 },
        TEST_SECRET
      );
      const req = new Request('https://simplicity.pages.dev/api/health', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });
      const res = await app.fetch(req, {
        JWT_SECRET: TEST_SECRET,
        IS_LOCAL: 'false',
      } as any);

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.status).toBe('ok');
      expect(body.user.email).toBe('rattajak.n@gmail.com');
    });

    it('allows local mode fallback and sets X-Simplicity-Mode: local header when IS_LOCAL is true or localhost', async () => {
      const req = new Request('http://localhost:8788/api/health', {
        method: 'GET',
      });
      const res = await app.fetch(req, {
        JWT_SECRET: TEST_SECRET,
        IS_LOCAL: 'true',
      } as any);

      expect(res.status).toBe(200);
      expect(res.headers.get('X-Simplicity-Mode')).toBe('local');
    });

    it('rejects standalone /api/auth/google and /api/auth/logout endpoints with HTTP 403', async () => {
      const loginReq = new Request('https://simplicity.pages.dev/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'rattajak.n@gmail.com' }),
      });
      const loginRes = await app.fetch(loginReq, {
        JWT_SECRET: TEST_SECRET,
        IS_LOCAL: 'false',
      } as any);

      expect(loginRes.status).toBe(403);
      const body = (await loginRes.json()) as any;
      expect(body.error).toContain('Standalone authentication is disabled');
    });
  });

  describe('simplicityFetch Unified Client', () => {
    it('attaches Authorization: Bearer <token> and prepends configured base URL', async () => {
      setSimplicityApiBaseUrl('https://api.simplicity.example.com');
      useAuthStore.getState().syncExternalAuth(
        { email: 'rattajak.n@gmail.com', name: 'Rattajak' },
        'my-jwt-token-xyz'
      );

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await simplicityFetch('/api/wallets');
      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.simplicity.example.com/api/wallets',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token-xyz',
          }),
        })
      );
    });

    it('detects X-Simplicity-Mode: local response header and updates isLocalMode', async () => {
      setIsLocalMode(false);
      expect(getIsLocalMode()).toBe(false);

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'X-Simplicity-Mode': 'local' },
        })
      );

      await simplicityFetch('/api/wallets');
      expect(getIsLocalMode()).toBe(true);
    });
  });
});
