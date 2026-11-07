import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AddWalletModal } from '../../src/components/AddWalletModal';
import { CSVImportModal } from '../../src/components/CSVImportModal';
import { ReceiptScannerModal } from '../../src/components/ReceiptScannerModal';
import { useFinanceStore } from '../../src/store/useFinanceStore';

const noop = async () => {};

const cases = [
  {
    name: 'AddWalletModal',
    title: 'Add New Wallet',
    flag: 'isAddWalletOpen',
    ui: () => <AddWalletModal onAddWallet={noop} />,
  },
  {
    name: 'CSVImportModal',
    title: 'Import CSV Transactions',
    flag: 'isImportOpen',
    ui: () => <CSVImportModal wallets={[]} categories={[]} onImportComplete={noop} />,
  },
  {
    name: 'ReceiptScannerModal',
    title: 'AI Receipt & Slip Scanner',
    flag: 'isAiScanOpen',
    ui: () => <ReceiptScannerModal onApplyReceipt={() => {}} />,
  },
] as const;

describe.each(cases)('$name uses the shared Radix Dialog', ({ title, flag, ui }) => {
  beforeEach(() => {
    useFinanceStore.setState({ isAddWalletOpen: false, isImportOpen: false, isAiScanOpen: false });
  });

  it('renders nothing while closed', () => {
    render(ui());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as an accessible dialog portaled to body above the host header', () => {
    useFinanceStore.setState({ [flag]: true });
    const { container } = render(ui());

    expect(container).toBeEmptyDOMElement(); // not inside the host-embedded tree
    const dialog = screen.getByRole('dialog', { name: title });
    expect(document.body.contains(dialog)).toBe(true);
    expect(dialog.className).toContain('z-[var(--oaktree-z-remote-modal,1400)]');
    expect(document.querySelector('[data-state="open"].fixed.inset-0')?.className).toContain('z-[calc(var(--oaktree-z-remote-modal,1400)-1)]');
  });

  it('keeps the light card look (no dark scope) and the simplicity scope', () => {
    useFinanceStore.setState({ [flag]: true });
    render(ui());
    const classes = screen.getByRole('dialog', { name: title }).className.split(/\s+/);
    expect(classes).toContain('simplicity-scope');
    expect(classes).not.toContain('dark');
    expect(classes).toContain('bg-white');
  });

  it('closes via the header X button and Escape', () => {
    useFinanceStore.setState({ [flag]: true });
    render(ui());
    fireEvent.keyDown(screen.getByRole('dialog', { name: title }), { key: 'Escape' });
    expect(useFinanceStore.getState()[flag]).toBe(false);
  });
});

