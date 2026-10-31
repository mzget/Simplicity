#!/usr/bin/env node
/**
 * Spendee Transaction Extractor
 * Connects to Spendee Firestore API, reads authentication from saved Chrome session,
 * and extracts all historical transactions into CSV and JSON.
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const userDir = path.resolve(projectRoot, '.spendee_session');

// Command line arguments
const args = process.argv.slice(2);
let targetWalletId = '74f0119b-3a4f-42f1-8205-ee3e0a4de051';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--wallet' && i + 1 < args.length) {
    targetWalletId = args[++i];
  }
}

async function getStoredToken() {
  const context = await chromium.launchPersistentContext(userDir, {
    channel: 'chrome',
    headless: true,
  });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://app.spendee.com/overview');

  const tokenData = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const req = indexedDB.open('firebaseLocalStorageDb');
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('firebaseLocalStorage', 'readonly');
        const store = tx.objectStore('firebaseLocalStorage');
        const getReq = store.getAll();
        getReq.onsuccess = () => {
          const raw = getReq.result[0];
          const item = raw?.value || raw;
          resolve({
            token: item?.stsTokenManager?.accessToken,
            uid: item?.uid,
            email: item?.email,
          });
        };
      };
      req.onerror = () => resolve(null);
    });
  });

  await context.close();
  return tokenData;
}

async function extractAll() {
  console.log('====================================================');
  console.log('🏦 Spendee Transaction Extractor (Firestore API)');
  console.log('====================================================');
  console.log(`📌 Target Wallet ID: ${targetWalletId}`);

  let auth = await getStoredToken();
  if (!auth?.token) {
    console.log('⚠️ ไม่พบ Session ในเครื่อง กำลังเปิด Google Chrome เพื่อล็อกอิน...');
    const context = await chromium.launchPersistentContext(userDir, {
      channel: 'chrome',
      headless: false,
      viewport: { width: 1280, height: 850 },
    });
    const page = context.pages()[0] || (await context.newPage());
    await page.goto('https://app.spendee.com/auth/login');

    for (let round = 0; round < 60; round++) {
      await page.waitForTimeout(5000);
      const isLogged = await page.evaluate(() => !window.location.href.includes('/auth/login'));
      if (isLogged) break;
    }
    await context.close();
    auth = await getStoredToken();
  }

  if (!auth?.token) {
    console.error('❌ ไม่สามารถดึง Authentication Token ได้ กรุณาลองใหม่อีกครั้ง');
    return;
  }

  const token = auth.token;
  const userUuid = auth.uid || 'e9e1332d-12f0-43f1-b782-420c3c42f9c9';
  console.log(`🔑 ยืนยันตัวตนสำเร็จ: ${auth.email || userUuid}`);

  // Fetch Categories
  const categoryMap = new Map();
  try {
    const catUrl = `https://firestore.googleapis.com/v1/projects/spendee-app/databases/(default)/documents/users/${userUuid}/categories?pageSize=300`;
    const catRes = await fetch(catUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (catRes.ok) {
      const catJson = await catRes.json();
      for (const doc of (catJson.documents || [])) {
        const id = doc.name.split('/').pop();
        const name = doc.fields?.name?.stringValue || doc.fields?.title?.stringValue || 'Other';
        categoryMap.set(id, name);
      }
    }
  } catch {}

  try {
    const wCatUrl = `https://firestore.googleapis.com/v1/projects/spendee-app/databases/(default)/documents/users/${userUuid}/wallets/${targetWalletId}/categories?pageSize=300`;
    const wCatRes = await fetch(wCatUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (wCatRes.ok) {
      const wCatJson = await wCatRes.json();
      for (const doc of (wCatJson.documents || [])) {
        const id = doc.name.split('/').pop();
        const name = doc.fields?.name?.stringValue || doc.fields?.title?.stringValue || 'Other';
        categoryMap.set(id, name);
      }
    }
  } catch {}

  console.log(`📂 โหลดหมวดหมู่ (Categories) ได้: ${categoryMap.size} หมวดหมู่`);

  // Paginate transactions
  const allRawTransactions = [];
  let nextPageToken = null;
  let pageNum = 1;

  console.log(`\n⏳ กำลังดึงประวัติธุรกรรมทั้งหมดจาก Firestore...`);

  do {
    let url = `https://firestore.googleapis.com/v1/projects/spendee-app/databases/(default)/documents/users/${userUuid}/wallets/${targetWalletId}/transactions?pageSize=300`;
    if (nextPageToken) {
      url += `&pageToken=${encodeURIComponent(nextPageToken)}`;
    }

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.error(`❌ หน้า ${pageNum} ล้มเหลว HTTP ${res.status}`);
      break;
    }

    const data = await res.json();
    const docs = data.documents || [];
    allRawTransactions.push(...docs);
    console.log(`  📄 หน้าที่ ${pageNum}: ดึงได้ ${docs.length} รายการ (รวมสะสม: ${allRawTransactions.length} รายการ)`);

    nextPageToken = data.nextPageToken || null;
    pageNum++;
  } while (nextPageToken);

  console.log(`\n✅ ดึงข้อมูลเสร็จสมบูรณ์! ได้ทั้งหมด ${allRawTransactions.length} รายการ`);

  // Parse and build CSV
  const parsedTransactions = [];
  let totalIncome = 0;
  let totalExpense = 0;

  for (const doc of allRawTransactions) {
    const f = doc.fields || {};
    const txId = f.path?.mapValue?.fields?.transaction?.stringValue || doc.name.split('/').pop();
    const rawDate = f.madeAt?.timestampValue || f.updatedAt?.timestampValue || doc.createTime;
    const dateStr = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();
    const dateOnly = dateStr.slice(0, 10);

    const rawAmtStr = f.amount?.stringValue || f.amount?.doubleValue?.toString() || '0';
    const numAmt = parseFloat(rawAmtStr);

    const catId = f.category?.stringValue || '';
    const catName = categoryMap.get(catId) || 'General';
    const note = f.note?.stringValue || '';
    const type = numAmt >= 0 ? 'income' : 'expense';

    if (numAmt >= 0) totalIncome += numAmt;
    else totalExpense += Math.abs(numAmt);

    parsedTransactions.push({
      id: txId,
      date: dateStr,
      dateOnly: dateOnly,
      amount: numAmt,
      type: type,
      category: catName,
      categoryId: catId,
      note: note,
      walletId: targetWalletId,
    });
  }

  parsedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Save JSON
  const jsonPath = path.resolve(projectRoot, 'spendee_all_transactions.json');
  fs.writeFileSync(jsonPath, JSON.stringify(parsedTransactions, null, 2), 'utf-8');
  console.log(`💾 บันทึกไฟล์ JSON สำเร็จ: ${jsonPath}`);

  // Save CSV
  const csvHeaders = ['Date', 'Category', 'Amount', 'Type', 'Note', 'Wallet'];
  const csvRows = [csvHeaders.join(',')];

  for (const t of parsedTransactions) {
    const cleanNote = t.note.replace(/"/g, '""').replace(/\n/g, ' ');
    const cleanCat = t.category.replace(/"/g, '""');
    csvRows.push([
      `"${t.dateOnly}"`,
      `"${cleanCat}"`,
      t.amount.toFixed(2),
      `"${t.type}"`,
      `"${cleanNote}"`,
      `"${t.walletId}"`,
    ].join(','));
  }

  const csvPath = path.resolve(projectRoot, 'spendee_transactions_simplicity.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf-8');
  console.log(`💾 บันทึกไฟล์ CSV สำเร็จ: ${csvPath}`);

  const oldest = parsedTransactions[parsedTransactions.length - 1];
  const newest = parsedTransactions[0];

  console.log('\n====================================================');
  console.log('📊 สรุปรายงานข้อมูลธุรกรรมทั้งหมด:');
  console.log(`- จำนวนรายการทั้งหมด: ${parsedTransactions.length.toLocaleString()} รายการ`);
  console.log(`- ช่วงเวลาประวัติ:     ${oldest?.dateOnly || '-'} ถึง ${newest?.dateOnly || '-'}`);
  console.log(`- ยอดรวมรายรับ:       +${totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
  console.log(`- ยอดรวมรายจ่าย:      -${totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
  console.log(`- ยอดคงเหลือสุทธิ:    ${(totalIncome - totalExpense).toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
  console.log('====================================================');
  console.log('🎉 ข้อมูลพร้อมใช้งานแล้ว! คุณสามารถนำเข้าสู่ Simplicity Finance ได้ทันที');
}

extractAll();
