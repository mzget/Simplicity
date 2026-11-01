/**
 * Pure Functional Spendee Import & Transformation Utility
 * Conforms to SOLID and FP standards:
 * - Readonly domain interfaces
 * - Pure transformation functions with zero side-effects
 * - Robust SQL escaping and chunking for Cloudflare D1 batch operations
 */

export interface SpendeeRawTransaction {
  readonly id: string;
  readonly date?: string;
  readonly dateOnly?: string;
  readonly amount: number;
  readonly type: 'expense' | 'income' | string;
  readonly category: string;
  readonly categoryId?: string;
  readonly note?: string | null;
  readonly walletId?: string;
  readonly rawDoc?: Record<string, any>;
}

export interface SimplicityTransaction {
  readonly id: string;
  readonly wallet_id: string;
  readonly user_id: string;
  readonly category_id: string;
  readonly type: string;
  readonly amount: number;
  readonly currency: string;
  readonly start_date: string;
  readonly note: string | null;
  readonly hashtags: string;
  readonly status: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SpendeeMapOptions {
  readonly userId: string;
  readonly targetWalletId: string;
  readonly currency?: string;
  readonly tag?: string;
}

export const SPENDEE_CATEGORY_MAP: Readonly<Record<string, string>> = Object.freeze({
  bills: 'cat_bills',
  utilities: 'cat_bills',
  salary: 'cat_salary',
  travel: 'cat_travel',
  'family & personal': 'cat_family_personal',
  car: 'cat_vehicle',
  entertainment: 'cat_entertainment',
  'extra income': 'cat_extra_inc',
  shopping: 'cat_shopping',
  clothing: 'cat_clothing',
  'food & drink': 'cat_food',
  education: 'cat_education',
  healthcare: 'cat_health',
  home: 'cat_housing',
  savings: 'cat_investments',
  business: 'cat_business',
});

/**
 * Maps a Spendee category name string to Simplicity's preset category ID.
 * Falls back to 'cat_other_exp' if unmatched.
 */
export const mapSpendeeCategory = (categoryName: string): string => {
  if (!categoryName || typeof categoryName !== 'string') {
    return 'cat_other_exp';
  }
  const normalized = categoryName.trim().toLowerCase();
  return SPENDEE_CATEGORY_MAP[normalized] ?? 'cat_other_exp';
};

/**
 * Purely transforms a Spendee transaction record into a Simplicity D1 transaction record.
 */
export const mapSpendeeTransaction = (
  raw: SpendeeRawTransaction,
  options: SpendeeMapOptions
): SimplicityTransaction => {
  const cleanId = raw.id.trim();
  const txId = cleanId.startsWith('tx_spendee_') ? cleanId : `tx_spendee_${cleanId}`;
  const categoryId = mapSpendeeCategory(raw.category);
  const nowIso = new Date().toISOString();
  const startDate = raw.date || (raw.dateOnly ? new Date(raw.dateOnly).toISOString() : nowIso);
  const note = raw.note && typeof raw.note === 'string' && raw.note.trim().length > 0 ? raw.note.trim() : null;
  const tag = options.tag ?? '#spendee';

  return {
    id: txId,
    wallet_id: options.targetWalletId,
    user_id: options.userId,
    category_id: categoryId,
    type: 'REGULAR',
    amount: Number(raw.amount) || 0,
    currency: options.currency ?? 'THB',
    start_date: startDate,
    note: note,
    hashtags: JSON.stringify([tag]),
    status: 'active',
    created_at: startDate,
    updated_at: startDate,
  };
};

/**
 * Safely escapes a string for SQLite single-quoted literal.
 */
export const escapeSqlString = (str: string): string => {
  return str.replace(/'/g, "''");
};

/**
 * Formats a transaction into a single SQL row tuple.
 */
export const formatTransactionRowSql = (tx: SimplicityTransaction): string => {
  const noteVal = tx.note !== null ? `'${escapeSqlString(tx.note)}'` : 'NULL';
  return `('${escapeSqlString(tx.id)}', '${escapeSqlString(tx.wallet_id)}', '${escapeSqlString(tx.user_id)}', '${escapeSqlString(tx.category_id)}', '${escapeSqlString(tx.type)}', ${tx.amount}, '${escapeSqlString(tx.currency)}', '${escapeSqlString(tx.start_date)}', ${noteVal}, '${escapeSqlString(tx.hashtags)}', '${escapeSqlString(tx.status)}', '${escapeSqlString(tx.created_at)}', '${escapeSqlString(tx.updated_at)}')`;
};

/**
 * Generates chunked multi-row INSERT OR REPLACE statements.
 */
export const generateChunkedInsertSql = (
  transactions: ReadonlyArray<SimplicityTransaction>,
  chunkSize = 100
): string[] => {
  if (transactions.length === 0) return [];
  const chunks: string[] = [];
  const columns = `(id, wallet_id, user_id, category_id, type, amount, currency, start_date, note, hashtags, status, created_at, updated_at)`;

  for (let i = 0; i < transactions.length; i += chunkSize) {
    const slice = transactions.slice(i, i + chunkSize);
    const rowTuples = slice.map(formatTransactionRowSql).join(',\n');
    const sql = `INSERT OR REPLACE INTO transactions ${columns} VALUES\n${rowTuples};`;
    chunks.push(sql);
  }

  return chunks;
};

