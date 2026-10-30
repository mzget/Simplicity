/**
 * E2E Test Utilities & Contract Helpers
 * Authoritative contracts derived from PROJECT.md & ORIGINAL_REQUEST.md
 */

export interface TestJwtPayload {
  email: string;
  name: string;
  picture?: string;
  exp: number;
  [key: string]: unknown;
}

export function base64urlEncode(buffer: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof buffer === 'string') {
    bytes = new TextEncoder().encode(buffer);
  } else if (buffer instanceof Uint8Array) {
    bytes = buffer;
  } else {
    bytes = new Uint8Array(buffer);
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Creates an HMAC-SHA256 JWT using standard Web Crypto API
 */
export async function createTestJwt(
  payload: TestJwtPayload,
  secret: string,
  tamperSignature = false
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  let encodedSignature = base64urlEncode(signature);

  if (tamperSignature) {
    // Modify the last character to invalidate signature
    const lastChar = encodedSignature.slice(-1);
    const replacement = lastChar === 'A' ? 'B' : 'A';
    encodedSignature = encodedSignature.slice(0, -1) + replacement;
  }

  return `${data}.${encodedSignature}`;
}

/**
 * Verifies an HMAC-SHA256 JWT matching the API contract in PROJECT.md
 */
export async function verifyJwtContract(token: string, secret: string): Promise<TestJwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    // Verify signature
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode signature bytes
    let b64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const binarySig = atob(b64);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data));
    if (!isValid) return null;

    const payloadText = base64urlDecode(payloadB64);
    const payload = JSON.parse(payloadText) as TestJwtPayload;

    // Check expiration timestamp
    if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * TanStack Router `/finance` Search Params Schema Validator
 * Authoritative: PROJECT.md § Architecture line 8 & lines 65-67
 */
export interface FinanceSearchParams {
  tab: 'dashboard' | 'transactions' | 'budgets' | 'wallets';
  wallet: string;
}

export function parseFinanceSearchParams(search: Record<string, string | undefined>): FinanceSearchParams {
  const validTabs = ['dashboard', 'transactions', 'budgets', 'wallets'] as const;
  const rawTab = search.tab;
  const tab = validTabs.includes(rawTab as any)
    ? (rawTab as FinanceSearchParams['tab'])
    : 'dashboard';

  const rawWallet = search.wallet;
  const wallet = (typeof rawWallet === 'string' && rawWallet.trim().length > 0)
    ? rawWallet.trim()
    : 'all';

  return { tab, wallet };
}

/**
 * Standard test fixtures and mock datasets
 */
export const TEST_FIXTURES = {
  SHARED_JWT_SECRET: 'oaktree-simplicity-shared-secret-jwt-key-2026',
  MOCK_USER: {
    email: 'rattajak.n@gmail.com',
    name: 'Rattajak N.',
    picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
  },
  MOCK_WALLETS: [
    { id: 'wal_kbank', name: 'KBANK Main Account', balance: 54200.5, currency: 'THB' },
    { id: 'wal_scb', name: 'SCB Savings', balance: 125000.0, currency: 'THB' },
    { id: 'wal_crypto', name: 'Binance USDT', balance: 1200.0, currency: 'USD' },
  ],
  DEFAULT_USD_THB_RATE: 36.5,
};
