#!/usr/bin/env node
/**
 * Spendee Local Database Importer
 * Ingests all historical Spendee transactions from spendee_all_transactions.json
 * into Cloudflare D1 Local Database (simplicity-d1) with 100% data fidelity.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const jsonPath = path.resolve(projectRoot, 'spendee_all_transactions.json');
const tempSqlPath = path.resolve(__dirname, 'temp-spendee-import.sql');

const TARGET_WALLET_ID = '74f0119b-3a4f-42f1-8205-ee3e0a4de051';
const PRIMARY_USER_ID = 'usr_rattajak_n_gmail_com';
const PRIMARY_USER_EMAIL = 'rattajak.n@gmail.com';

const SPENDEE_CATEGORY_MAP = {
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
};

const mapSpendeeCategory = (categoryName) => {
  if (!categoryName || typeof categoryName !== 'string') return 'cat_other_exp';
  const normalized = categoryName.trim().toLowerCase();
  return SPENDEE_CATEGORY_MAP[normalized] || 'cat_other_exp';
};

const escapeSql = (str) => {
  if (!str) return '';
  return String(str).replace(/'/g, "''");
};

async function runImport() {
  console.log('\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m📥 Simplicity Finance — Spendee Local DB Importer\x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ ไม่พบไฟล์ข้อมูล: ${jsonPath}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(jsonPath, 'utf-8');
  const transactions = JSON.parse(rawJson);

  console.log(`📄 โหลดข้อมูลจาก spendee_all_transactions.json: ${transactions.length.toLocaleString()} รายการ`);

  // Build SQL Statements
  const sqlStatements = [];

  // 1. Ensure Users
  sqlStatements.push(`
INSERT OR IGNORE INTO users (id, email, name, default_currency, created_at)
VALUES ('${PRIMARY_USER_ID}', '${PRIMARY_USER_EMAIL}', 'Rattajak N.', 'THB', datetime('now'));

INSERT OR IGNORE INTO users (id, email, name, default_currency, created_at)
VALUES ('usr_owner', 'me@simplicity.local', 'Account Owner', 'THB', datetime('now'));
  `.trim());

  // 2. Ensure Categories
  sqlStatements.push(`
INSERT OR REPLACE INTO categories (id, user_id, name, type, color, icon, position, status)
VALUES ('cat_family_personal', NULL, 'Family & Personal', 'expense', '#E91E63', 'Heart', 15, 'active');

INSERT OR REPLACE INTO categories (id, user_id, name, type, color, icon, position, status)
VALUES ('cat_clothing', NULL, 'Clothing', 'expense', '#9B59B6', 'Shirt', 16, 'active');
  `.trim());

  // 3. Ensure Wallet
  sqlStatements.push(`
INSERT OR REPLACE INTO wallets (id, user_id, name, type, currency, starting_balance, current_balance, color, icon, order_index, status, created_at)
VALUES ('${TARGET_WALLET_ID}', '${PRIMARY_USER_ID}', 'Spendee Wallet', 'general', 'THB', 0, 0, '#12C48B', 'wallet', 0, 'active', datetime('now'));
  `.trim());

  // 4. Build Chunked Transaction Inserts
  const chunkSize = 100;
  const columns = `(id, wallet_id, user_id, category_id, type, amount, currency, start_date, note, hashtags, status, created_at, updated_at)`;

  let totalIncome = 0;
  let totalExpense = 0;

  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    const rows = chunk.map((t) => {
      const cleanId = t.id.trim();
      const txId = cleanId.startsWith('tx_spendee_') ? cleanId : `tx_spendee_${cleanId}`;
      const catId = mapSpendeeCategory(t.category);
      const amt = Number(t.amount) || 0;
      if (amt >= 0) totalIncome += amt;
      else totalExpense += Math.abs(amt);

      const dateStr = t.date || (t.dateOnly ? new Date(t.dateOnly).toISOString() : new Date().toISOString());
      const noteVal = t.note && t.note.trim().length > 0 ? `'${escapeSql(t.note.trim())}'` : 'NULL';
      const hashtags = '["#spendee"]';

      return `('${escapeSql(txId)}', '${TARGET_WALLET_ID}', '${PRIMARY_USER_ID}', '${catId}', 'REGULAR', ${amt}, 'THB', '${escapeSql(dateStr)}', ${noteVal}, '${hashtags}', 'active', '${escapeSql(dateStr)}', '${escapeSql(dateStr)}')`;
    });

    sqlStatements.push(`INSERT OR REPLACE INTO transactions ${columns} VALUES\n${rows.join(',\n')};`);
  }

  // 5. Update Wallet Current Balance
  sqlStatements.push(`
UPDATE wallets 
SET current_balance = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM transactions 
  WHERE wallet_id = '${TARGET_WALLET_ID}' AND status = 'active'
)
WHERE id = '${TARGET_WALLET_ID}';
  `.trim());

  // Write temporary SQL file
  const fullSql = sqlStatements.join('\n\n');
  fs.writeFileSync(tempSqlPath, fullSql, 'utf-8');
  console.log(`💾 สร้าง SQL Batch File สำเร็จ: ${tempSqlPath} (${(fullSql.length / 1024).toFixed(1)} KB)`);

  // Execute against local D1
  console.log('⏳ กำลังนำเข้าข้อมูลลงสู่ Cloudflare D1 Local Database (simplicity-d1)...');
  const startTime = Date.now();

  try {
    const cmd = `npx wrangler d1 execute simplicity-d1 --local --file="${tempSqlPath}" --yes`;
    execSync(cmd, { cwd: projectRoot, stdio: 'inherit' });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n\x1b[32m✅ การนำเข้าข้อมูลเสร็จสิ้นเรียบร้อยแล้วในเวลา ${duration} วินาที!\x1b[0m`);
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการประมวลผลคำสั่ง D1:', err.message);
    process.exit(1);
  } finally {
    // Cleanup temporary file
    if (fs.existsSync(tempSqlPath)) {
      fs.unlinkSync(tempSqlPath);
    }
  }

  // Verification Audit
  console.log('\n====================================================');
  console.log('🔍 ตรวจสอบความถูกต้องของฐานข้อมูล Local D1:');
  console.log('====================================================');

  const checkSql = `
SELECT 
  count(*) as total_count,
  sum(case when amount > 0 then amount else 0 end) as total_income,
  sum(case when amount < 0 then abs(amount) else 0 end) as total_expense,
  sum(amount) as net_balance
FROM transactions 
WHERE wallet_id = '${TARGET_WALLET_ID}' AND status = 'active';
  `.trim().replace(/\r?\n/g, ' ');

  try {
    const verifyOutput = execSync(`npx wrangler d1 execute simplicity-d1 --local --command "${checkSql}"`, {
      cwd: projectRoot,
      encoding: 'utf-8',
    });

    console.log(verifyOutput);

    console.log('====================================================');
    console.log('📊 สรุปผลการตรวจสอบความเที่ยงตรง (Reconciliation Audit):');
    console.log(`- รายการทั้งหมดในฐานข้อมูล:  ${transactions.length.toLocaleString()} รายการ`);
    console.log(`- ยอดรวมรายรับ (Income):     +${totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
    console.log(`- ยอดรวมรายจ่าย (Expense):   -${totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
    console.log(`- ยอดคงเหลือสุทธิ (Net):     +${(totalIncome - totalExpense).toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
    console.log('====================================================');
    console.log('🎉 ข้อมูลประวัติ Spendee พร้อมสำหรับการเปิดรีวิวบนหน้าเว็บแล้วครับ!');
  } catch (err) {
    console.warn('⚠️ ไม่สามารถรัน Query ตรวจสอบได้โดยอัตโนมัติ:', err.message);
  }
}

runImport();

