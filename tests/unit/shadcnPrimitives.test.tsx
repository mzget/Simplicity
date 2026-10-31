import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '../../src/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../src/components/ui/card';
import { Badge } from '../../src/components/ui/badge';
import { Input } from '../../src/components/ui/input';

describe('shadcn UI Primitives', () => {
  it('renders Button with variants and sizes correctly', () => {
    const { rerender } = render(<Button variant="default">Save</Button>);
    const btn = screen.getByRole('button', { name: /Save/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('bg-emerald-500');

    rerender(<Button variant="destructive" size="sm">Delete</Button>);
    const delBtn = screen.getByRole('button', { name: /Delete/i });
    expect(delBtn.className).toContain('bg-red-500');
    expect(delBtn.className).toContain('h-7');
  });

  it('renders Card with header and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Metric Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Card body content</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Metric Card')).toBeInTheDocument();
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });

  it('renders Badge with default and destructive styles', () => {
    const { rerender } = render(<Badge variant="default">Income</Badge>);
    expect(screen.getByText('Income')).toBeInTheDocument();

    rerender(<Badge variant="destructive">Expense</Badge>);
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('renders Input and handles input props', () => {
    render(<Input placeholder="Search test" readOnly />);
    expect(screen.getByPlaceholderText('Search test')).toBeInTheDocument();
  });
});

