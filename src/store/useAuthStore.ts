import { create } from 'zustand';
import { AuthUser, AuthState } from '../types';
import { isEmailAuthorized, parseGoogleJwt, DEFAULT_ALLOWED_EMAIL } from '../utils/auth';

const STORAGE_KEY_AUTH = 'simplicity_auth_user';
const STORAGE_KEY_TOKEN = 'auth_token';

interface AuthStore extends AuthState {
  token: string | null;
  syncExternalAuth: (
    user: { id?: string; email?: string; name?: string; picture?: string; defaultCurrency?: string } | null | undefined,
    token: string | null | undefined
  ) => void;
  loginWithEmail: (
    email: string,
    name?: string,
    picture?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleCredential: (
    credential: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();
const initialToken = getStoredToken();

export const useAuthStore = create<AuthStore>((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialUser),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  syncExternalAuth: (user, token) => {
    const cleanToken = typeof token === 'string' ? token.trim() : '';
    const isValidUser =
      user &&
      typeof user.email === 'string' &&
      user.email.trim().includes('@');

    if (isValidUser && cleanToken.length > 0) {
      const normalizedEmail = user.email!.trim();
      const authUser: AuthUser = {
        id: user.id || `usr_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: normalizedEmail,
        name: user.name || normalizedEmail.split('@')[0],
        picture: user.picture,
        defaultCurrency: user.defaultCurrency || 'THB',
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authUser));
          localStorage.setItem(STORAGE_KEY_TOKEN, cleanToken);
        } catch (_) {}
      }

      set({
        user: authUser,
        token: cleanToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(STORAGE_KEY_AUTH);
          localStorage.removeItem(STORAGE_KEY_TOKEN);
        } catch (_) {}
      }
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loginWithEmail: async (email: string, name?: string, picture?: string) => {
    set({ isLoading: true, error: null });

    const normalizedEmail = email.trim();
    if (!isEmailAuthorized(normalizedEmail)) {
      const errorMsg = `Access Denied: Google email "${normalizedEmail}" is not authorized. Access is restricted to ${DEFAULT_ALLOWED_EMAIL}.`;
      set({
        isLoading: false,
        error: errorMsg,
        isAuthenticated: false,
        user: null,
      });
      return { success: false, error: errorMsg };
    }

    try {
      // Attempt backend login verification
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            name: name || normalizedEmail.split('@')[0],
            picture,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          }
        }
      } catch (_) {
        // Fallback for standalone Vite client / offline
      }

      const user: AuthUser = {
        id: `usr_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        picture,
        defaultCurrency: 'THB',
      };

      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please try again.';
      set({
        error: msg,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      return { success: false, error: msg };
    }
  },

  loginWithGoogleCredential: async (credential: string) => {
    set({ isLoading: true, error: null });

    const parsed = parseGoogleJwt(credential);
    if (!parsed || !parsed.email) {
      const err = 'Invalid Google credential token.';
      set({ error: err, isLoading: false });
      return { success: false, error: err };
    }

    if (!isEmailAuthorized(parsed.email)) {
      const err = `Access Denied: Google email "${parsed.email}" is not authorized. Access is restricted to ${DEFAULT_ALLOWED_EMAIL}.`;
      set({ error: err, isLoading: false, isAuthenticated: false, user: null });
      return { success: false, error: err };
    }

    try {
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          }
        }
      } catch (_) {}

      const user: AuthUser = {
        id: `usr_${parsed.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: parsed.email,
        name: parsed.name,
        picture: parsed.picture,
        defaultCurrency: 'THB',
      };

      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Google authentication failed.';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      } catch (_) {}
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkSession: async () => {
    const currentToken = useAuthStore.getState().token || getStoredToken();
    try {
      const headers: Record<string, string> = {};
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data.user));
          set({ user: data.user, token: currentToken, isAuthenticated: true });
          return;
        }
      }
    } catch (_) {}

    const localUser = getStoredUser();
    if (localUser && isEmailAuthorized(localUser.email)) {
      set({ user: localUser, token: currentToken, isAuthenticated: true });
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
