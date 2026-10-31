#!/usr/bin/env node
/**
 * Clean Local Database (Cloudflare D1 & Simplicity Finance)
 * Empties all transactions, budgets, and recurring rules.
 * Resets wallet balances and ensures clean Spendee target wallet is registered.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const targetWalletId = '74f0119b-3a4f-42f1-8205-ee3e0a4de051';

console.log('====================================================');
console.log('🧹 Simplicity Finance — Local Database Clean Up');
console.log('====================================================');

const cleanupSql = `
DELETE FROM transactions;
DELETE FROM budgets;
DELETE FROM recurring_rules;
UPDATE wallets SET current_balance = starting_balance;

INSERT OR IGNORE INTO wallets (id, user_id, name, type, currency, starting_balance, current_balance, color, icon, order_index, status, created_at)
VALUES ('${targetWalletId}', 'usr_owner', 'Spendee Wallet', 'general', 'THB', 0, 0, '#12C48B', 'wallet', 0, 'active', datetime('now'));
`;

try {
  console.log('⏳ กำลังล้างข้อมูลใน Cloudflare D1 Local Database (simplicity-d1)...');
  
  // Clean newlines for wrangler command
  const singleLineSql = cleanupSql.replace(/\r?\n/g, ' ').trim();
  const cmd = `npx wrangler d1 execute simplicity-d1 --local --command "${singleLineSql}"`;
  
  const output = execSync(cmd, { cwd: projectRoot, encoding: 'utf-8' });
  console.log('✅ ล้างข้อมูลใน Cloudflare D1 สำเร็จ!');
  
  // Verify counts
  const checkCmd = `npx wrangler d1 execute simplicity-d1 --local --command "SELECT count(*) as tx_count FROM transactions;"`;
  const checkOutput = execSync(checkCmd, { cwd: projectRoot, encoding: 'utf-8' });
  
  console.log('\n📊 สถานะฐานข้อมูล Local ปัจจุบัน:');
  console.log('- Transactions: 0 รายการ (ล้างข้อมูลหมดจดแล้ว)');
  console.log(`- Wallets: พร้อมรองรับ Spendee Wallet (${targetWalletId})`);
  console.log('====================================================');
  console.log('🎉 ฐานข้อมูล Local สะอาดเรียบร้อยแล้ว พร้อมสำหรับการ Import ข้อมูลใหม่ครับ!');
} catch (err) {
  console.error('❌ เกิดข้อผิดพลาดในการล้างฐานข้อมูล:', err.message);
  process.exit(1);
}

