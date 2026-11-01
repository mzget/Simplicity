import { describe, it, expect } from 'vitest';
import {
  mapSpendeeCategory,
  mapSpendeeTransaction,
  generateChunkedInsertSql,
  SPENDEE_CATEGORY_MAP,
  SpendeeRawTransaction,
} from '../../src/utils/spendeeImport';

describe('Spendee Import Pure Utility', () => {
  describe('mapSpendeeCategory', () => {
    it('correctly maps all 16 known Spendee categories', () => {
      expect(mapSpendeeCategory('Bills')).toBe('cat_bills');
      expect(mapSpendeeCategory('Utilities')).toBe('cat_bills');
      expect(mapSpendeeCategory('Salary')).toBe('cat_salary');
      expect(mapSpendeeCategory('Travel')).toBe('cat_travel');
      expect(mapSpendeeCategory('Family & Personal')).toBe('cat_family_personal');
      expect(mapSpendeeCategory('Car')).toBe('cat_vehicle');
      expect(mapSpendeeCategory('Entertainment')).toBe('cat_entertainment');
      expect(mapSpendeeCategory('Extra income')).toBe('cat_extra_inc');
      expect(mapSpendeeCategory('Shopping')).toBe('cat_shopping');
      expect(mapSpendeeCategory('Clothing')).toBe('cat_clothing');
      expect(mapSpendeeCategory('Food & Drink')).toBe('cat_food');
      expect(mapSpendeeCategory('Education')).toBe('cat_education');
      expect(mapSpendeeCategory('Healthcare')).toBe('cat_health');
      expect(mapSpendeeCategory('Home')).toBe('cat_housing');
      expect(mapSpendeeCategory('Savings')).toBe('cat_investments');
      expect(mapSpendeeCategory('Business')).toBe('cat_business');
    });

    it('falls back to cat_other_exp for unknown categories', () => {
      expect(mapSpendeeCategory('Unknown Random Category')).toBe('cat_other_exp');
      expect(mapSpendeeCategory('')).toBe('cat_other_exp');
    });

    it('handles case-insensitivity and whitespace trimming', () => {
      expect(mapSpendeeCategory('  family & personal  ')).toBe('cat_family_personal');
      expect(mapSpendeeCategory('food & drink')).toBe('cat_food');
    });
  });

  describe('mapSpendeeTransaction', () => {
    const sampleSpendeeRaw: SpendeeRawTransaction = {
      id: 'a87a4c8d-7cc6-44a6-9785-14f1ce4afb58',
      date: '2026-10-31T17:05:06.000Z',
      dateOnly: '2026-10-31',
      amount: -750,
      type: 'expense',
      category: 'Bills',
      categoryId: '1f047294-8002-41b6-8e30-591c931b96c6',
      note: "Google AI 'Pro'",
      walletId: '74f0119b-3a4f-42f1-8205-ee3e0a4de051',
    };

    it('transforms a raw transaction with tx_spendee_ prefix and active status', () => {
      const result = mapSpendeeTransaction(sampleSpendeeRaw, {
        userId: 'usr_rattajak_n_gmail_com',
        targetWalletId: '74f0119b-3a4f-42f1-8205-ee3e0a4de051',
      });

      expect(result.id).toBe('tx_spendee_a87a4c8d-7cc6-44a6-9785-14f1ce4afb58');
      expect(result.wallet_id).toBe('74f0119b-3a4f-42f1-8205-ee3e0a4de051');
      expect(result.user_id).toBe('usr_rattajak_n_gmail_com');
      expect(result.category_id).toBe('cat_bills');
      expect(result.type).toBe('REGULAR');
      expect(result.amount).toBe(-750);
      expect(result.currency).toBe('THB');
      expect(result.start_date).toBe('2026-10-31T17:05:06.000Z');
      expect(result.note).toBe("Google AI 'Pro'");
      expect(result.hashtags).toBe('["#spendee"]');
      expect(result.status).toBe('active');
    });

    it('safely handles null/missing note or empty date', () => {
      const rawWithoutNote: SpendeeRawTransaction = {
        id: '123',
        amount: 5000,
        type: 'income',
        category: 'Salary',
      };

      const result = mapSpendeeTransaction(rawWithoutNote, {
        userId: 'usr_test',
        targetWalletId: 'wal_test',
      });

      expect(result.id).toBe('tx_spendee_123');
      expect(result.note).toBeNull();
      expect(result.category_id).toBe('cat_salary');
      expect(result.amount).toBe(5000);
      expect(result.start_date).toBeDefined();
    });
  });

  describe('generateChunkedInsertSql', () => {
    it('generates valid chunked SQL with INSERT OR REPLACE INTO', () => {
      const mockTxs = [
        {
          id: 'tx_spendee_1',
          wallet_id: 'wal_1',
          user_id: 'usr_1',
          category_id: 'cat_food',
          type: 'REGULAR',
          amount: -150,
          currency: 'THB',
          start_date: '2026-10-31T12:00:00.000Z',
          note: "Lunch with 'Tom' & Jerry",
          hashtags: '["#spendee"]',
          status: 'active',
          created_at: '2026-10-31T12:00:00.000Z',
          updated_at: '2026-10-31T12:00:00.000Z',
        },
        {
          id: 'tx_spendee_2',
          wallet_id: 'wal_1',
          user_id: 'usr_1',
          category_id: 'cat_salary',
          type: 'REGULAR',
          amount: 50000,
          currency: 'THB',
          start_date: '2026-10-31T09:00:00.000Z',
          note: null,
          hashtags: '["#spendee"]',
          status: 'active',
          created_at: '2026-10-31T09:00:00.000Z',
          updated_at: '2026-10-31T09:00:00.000Z',
        },
      ];

      const chunks = generateChunkedInsertSql(mockTxs, 1);
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toContain('INSERT OR REPLACE INTO transactions');
      expect(chunks[0]).toContain("Lunch with ''Tom'' & Jerry");
      expect(chunks[1]).toContain('NULL');
    });
  });
});

