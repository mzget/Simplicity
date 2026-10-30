export const DEFAULT_ALLOWED_EMAIL = 'rattajak.n@gmail.com';

/**
 * Checks whether the given email matches the allowed whitelist.
 * Supports single email or comma-separated list of emails.
 */
export function isEmailAuthorized(
  email: string,
  allowedEmailConfig?: string
): boolean {
  if (!email || typeof email !== 'string') return false;

  const target = email.trim().toLowerCase();
  if (!target) return false;

  const rawConfig = allowedEmailConfig || DEFAULT_ALLOWED_EMAIL;
  const allowedList = rawConfig
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowedList.includes(target);
}

export interface GoogleJwtPayload {
  readonly email: string;
  readonly name: string;
  readonly picture?: string;
  readonly sub: string;
}

/**
 * Safely decodes base64url payload of a Google JWT ID token.
 */
export function parseGoogleJwt(token: string): GoogleJwtPayload | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const jsonString =
      typeof atob === 'function'
        ? decodeURIComponent(
            Array.from(atob(base64))
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        : Buffer.from(base64, 'base64').toString('utf8');

    const payload = JSON.parse(jsonString);
    if (!payload || typeof payload !== 'object' || !payload.email) {
      return null;
    }

    return {
      email: String(payload.email),
      name: String(payload.name || payload.email.split('@')[0]),
      picture: payload.picture ? String(payload.picture) : undefined,
      sub: String(payload.sub || payload.email),
    };
  } catch {
    return null;
  }
}
