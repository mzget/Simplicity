import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from '../../src/App';
import { useAuthStore } from '../../src/store/useAuthStore';

describe('App Standalone Mode Disabled Gate', () => {
  it('blocks direct standalone access when unauthenticated and displays Federation-only notice', () => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    render(<App />);
    expect(screen.getByText(/Standalone Access Disabled/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /SIMPLICITY FINANCE/i })).toBeInTheDocument();
    expect(screen.getByText(/\/assets\/remoteEntry\.js/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cash Flow Dynamics/i)).not.toBeInTheDocument();
  });

  it('blocks direct standalone access even if localStorage has auth state, preventing direct URL data mutation', () => {
    useAuthStore.setState({
      user: {
        id: 'usr_rattajak_n_gmail_com',
        email: 'rattajak.n@gmail.com',
        name: 'Rattajak N',
      },
      token: 'some-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    render(<App />);
    expect(screen.getByText(/Standalone Access Disabled/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Wallet/i })).not.toBeInTheDocument();
  });
});
