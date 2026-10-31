import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PwaStatusBanner } from '../../src/components/PwaStatusBanner';
import { usePwaStore } from '../../src/store/usePwaStore';

describe('PwaStatusBanner Component', () => {
  beforeEach(() => {
    usePwaStore.setState({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      dlqItems: [],
      lastSyncTime: null,
      syncMessage: null,
    });
  });

  it('renders nothing when online, not syncing, and no pending or dlq items', () => {
    const { container } = render(<PwaStatusBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders offline warning banner when offline', () => {
    usePwaStore.setState({
      isOnline: false,
      pendingCount: 2,
    });

    render(<PwaStatusBanner />);
    expect(screen.getByText(/Offline Mode:/i)).toBeInTheDocument();
    expect(screen.getByText(/2 pending/i)).toBeInTheDocument();
  });

  it('renders syncing indicator and handles sync trigger button click', async () => {
    const mockSyncComplete = vi.fn().mockResolvedValue(undefined);

    usePwaStore.setState({
      isOnline: true,
      pendingCount: 3,
      isSyncing: false,
    });

    render(<PwaStatusBanner onSyncComplete={mockSyncComplete} />);
    expect(screen.getByText(/3 offline change\(s\) waiting to sync/i)).toBeInTheDocument();

    const syncBtn = screen.getByRole('button', { name: /Sync Now/i });
    expect(syncBtn).toBeInTheDocument();
  });

  it('renders Dead Letter Queue (DLQ) issue cards and allows dismiss', () => {
    usePwaStore.setState({
      isOnline: true,
      dlqItems: [
        {
          id: 'mut_issue_1',
          endpoint: '/api/transactions',
          method: 'POST',
          timestamp: 1000,
          failedAt: 1050,
          retryCount: 1,
          label: 'Failed Transaction',
          errorMessage: 'HTTP 422: Invalid wallet ID',
        },
      ],
    });

    render(<PwaStatusBanner />);
    expect(screen.getByText(/1 Sync Issue\(s\) detected:/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed Transaction/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTP 422: Invalid wallet ID/i)).toBeInTheDocument();

    const dismissBtn = screen.getByTitle(/Dismiss issue/i);
    expect(dismissBtn).toBeInTheDocument();
  });
});

