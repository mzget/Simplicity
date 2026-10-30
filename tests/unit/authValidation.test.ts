import { describe, it, expect } from 'vitest';
import { isEmailAuthorized, parseGoogleJwt } from '../../src/utils/auth';

describe('auth validation & whitelist', () => {
  const defaultAllowed = 'rattajak.n@gmail.com';

  it('allows exact match of authorized email', () => {
    expect(isEmailAuthorized('rattajak.n@gmail.com', defaultAllowed)).toBe(true);
  });

  it('allows case-insensitive match and handles whitespace', () => {
    expect(isEmailAuthorized('  RattaJak.N@gmail.com ', defaultAllowed)).toBe(true);
  });

  it('rejects unauthorized emails', () => {
    expect(isEmailAuthorized('attacker@gmail.com', defaultAllowed)).toBe(false);
    expect(isEmailAuthorized('rattajak@other.com', defaultAllowed)).toBe(false);
    expect(isEmailAuthorized('', defaultAllowed)).toBe(false);
  });

  it('supports comma-separated multiple allowed emails', () => {
    const list = 'rattajak.n@gmail.com, admin@simplicity.finance';
    expect(isEmailAuthorized('admin@simplicity.finance', list)).toBe(true);
    expect(isEmailAuthorized('rattajak.n@gmail.com', list)).toBe(true);
    expect(isEmailAuthorized('other@gmail.com', list)).toBe(false);
  });

  it('falls back to default allowed email if none provided', () => {
    expect(isEmailAuthorized('rattajak.n@gmail.com')).toBe(true);
    expect(isEmailAuthorized('unauthorized@gmail.com')).toBe(false);
  });

  it('safely parses Google JWT token payload', () => {
    // Header: {"alg":"RS256","typ":"JWT"} -> eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
    // Payload: {"email":"rattajak.n@gmail.com","name":"Rattajak N","picture":"https://photo.url","sub":"123456"}
    // Base64url payload: eyJlbWFpbCI6InJhdHRhamFrLm5AZ21haWwuY29tIiwibmFtZSI6IlJhdHRhamFrIE4iLCJwaWN0dXJlIjoiaHR0cHM6Ly9waG90by51cmwiLCJzdWIiOiIxMjM0NTYifQ
    const mockJwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJhdHRhamFrLm5AZ21haWwuY29tIiwibmFtZSI6IlJhdHRhamFrIE4iLCJwaWN0dXJlIjoiaHR0cHM6Ly9waG90by51cmwiLCJzdWIiOiIxMjM0NTYifQ.mockSignature';
    const parsed = parseGoogleJwt(mockJwt);
    expect(parsed).toEqual({
      email: 'rattajak.n@gmail.com',
      name: 'Rattajak N',
      picture: 'https://photo.url',
      sub: '123456',
    });
  });

  it('returns null for malformed JWT token', () => {
    expect(parseGoogleJwt('invalid.token')).toBeNull();
    expect(parseGoogleJwt('')).toBeNull();
  });
});
