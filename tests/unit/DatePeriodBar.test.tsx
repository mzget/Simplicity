import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DatePeriodBar } from '../../src/components/DatePeriodBar';
import { useFinanceStore } from '../../src/store/useFinanceStore';

describe('DatePeriodBar Component', () => {
  beforeEach(() => {
    useFinanceStore.setState({
      datePreset: 'this_month',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    });
  });

  it('renders date display range and navigation buttons', () => {
    render(<DatePeriodBar />);

    expect(screen.getByText(/Nov 01, 2026 — Nov 30, 2026/i)).toBeInTheDocument();
    expect(screen.getByTitle('Previous Month')).toBeInTheDocument();
    expect(screen.getByTitle('Next Month')).toBeInTheDocument();
  });

  it('renders all 5 preset buttons in the segmented track', () => {
    render(<DatePeriodBar />);

    expect(screen.getByRole('button', { name: /This Week/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /This Month/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Last Month/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /This Year/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All History/i })).toBeInTheDocument();
  });

  it('highlights the active preset and switches when another preset is clicked', () => {
    render(<DatePeriodBar />);

    const thisMonthBtn = screen.getByRole('button', { name: /This Month/i });
    expect(thisMonthBtn.className).toContain('bg-emerald-500');

    const thisWeekBtn = screen.getByRole('button', { name: /This Week/i });
    fireEvent.click(thisWeekBtn);

    expect(useFinanceStore.getState().datePreset).toBe('this_week');
  });

  it('handles month stepper navigation to previous and next month', () => {
    render(<DatePeriodBar />);

    const prevBtn = screen.getByTitle('Previous Month');
    fireEvent.click(prevBtn);

    expect(useFinanceStore.getState().startDate).toBe('2026-10-01');
    expect(useFinanceStore.getState().endDate).toBe('2026-10-31');

    const nextBtn = screen.getByTitle('Next Month');
    fireEvent.click(nextBtn);

    expect(useFinanceStore.getState().startDate).toBe('2026-11-01');
    expect(useFinanceStore.getState().endDate).toBe('2026-11-30');
  });
});

