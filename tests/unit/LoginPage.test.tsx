import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LoginPage } from '../../src/components/LoginPage';
import { useAuthStore } from '../../src/store/useAuthStore';

describe('LoginPage Component', () => {
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

  it('renders Simplicity branding and authorized email notice', () => {
    render(<LoginPage />);
    expect(screen.getByText(/SIMPLICITY/i)).toBeInTheDocument();
    expect(screen.getAllByText(/rattajak\.n@gmail\.com/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
  });

  it('allows logging in with the authorized Google email', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText(/rattajak\.n@gmail\.com/i);
    fireEvent.change(emailInput, { target: { value: 'rattajak.n@gmail.com' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In to Vault/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe('rattajak.n@gmail.com');
    });
  });

  it('shows error banner when attempting login with unauthorized email', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText(/rattajak\.n@gmail\.com/i);
    fireEvent.change(emailInput, { target: { value: 'unauthorized.user@gmail.com' } });

    const submitBtn = screen.getByRole('button', { name: /Sign In to Vault/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
