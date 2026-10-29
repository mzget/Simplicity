import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../../src/store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.restoreAllMocks();
  });

  it('initializes with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
  });

  it('successfully logs in with authorized Google email', async () => {
    const result = await useAuthStore.getState().loginWithEmail('rattajak.n@gmail.com', 'Rattajak N');
    expect(result.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('rattajak.n@gmail.com');
    expect(state.user?.name).toBe('Rattajak N');
    expect(state.error).toBeNull();
  });

  it('rejects unauthorized email with descriptive error', async () => {
    const result = await useAuthStore.getState().loginWithEmail('unauthorized@gmail.com');
    expect(result.success).toBe(false);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toContain('rattajak.n@gmail.com');
  });

  it('logs out and clears session', async () => {
    await useAuthStore.getState().loginWithEmail('rattajak.n@gmail.com');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    await useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
