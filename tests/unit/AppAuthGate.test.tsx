import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from '../../src/App';
import { useAuthStore } from '../../src/store/useAuthStore';

// Mock recharts to prevent SVG bounding box issues in test runner
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: () => <div>BarChart</div>,
  PieChart: () => <div>PieChart</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  Tooltip: () => <div>Tooltip</div>,
}));

describe('App Authentication Gate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders LoginPage when user is unauthenticated', () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    render(<App />);
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    expect(screen.queryByText(/Cash Flow Dynamics/i)).not.toBeInTheDocument();
  });

  it('renders main application dashboard and Navbar when authenticated', () => {
    useAuthStore.setState({
      user: {
        id: 'usr_rattajak_n_gmail_com',
        email: 'rattajak.n@gmail.com',
        name: 'Rattajak N',
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    render(<App />);
    // Main navigation tabs in Navbar
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Transactions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Budgets/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Wallets/i }).length).toBeGreaterThan(0);
  });
});
