# ADR-002: Historical Spendee Data Migration & Domain Alignment

## สถานะ (Status)
**Accepted** (2026-11-01) — Approved via `/goal` and `/grill-with-docs`

## บริบท (Context)
ระบบ Simplicity Finance จำเป็นต้องนำเข้าข้อมูลประวัติทางการเงินจาก Spendee (`spendee_all_transactions.json`) จำนวน 2,219 รายการ ครอบคลุมระยะเวลา 12 ปี (2014 – 2026) ยอดเงินรวม รายรับ +9,086,447.50 THB และรายจ่าย -5,621,852.76 THB เข้าสู่ Local Cloudflare D1 Database (`simplicity-d1`) เพื่อให้ผู้ใช้สามารถตรวจสอบวิเคราะห์การเงินย้อนหลังได้อย่างสมบูรณ์

ในการนำเข้าชุดข้อมูลประวัติขนาดใหญ่นี้ มีประเด็นทางสถาปัตยกรรม (Architectural Considerations) ที่ต้องตัดสินใจ:
1. **Primary Key & Idempotency**: จะป้องกันข้อมูลซ้ำซ้อนอย่างไรเมื่อมีการ Re-run หรือ Import ซ้ำ
2. **Category Fidelity & Domain Expansion**: การจัดการหมวดหมู่เดิมของ Spendee 16 หมวดหมู่ โดยเฉพาะ `Family & Personal` (543 รายการ, 1.45 ล้านบาท) และ `Clothing` (5 รายการ, 5,260 บาท) ซึ่งไม่มีอยู่ใน Default Categories เดิมของ Simplicity
3. **Timezone & Temporal Alignment**: Spendee เก็บเวลา Timestamp เป็น UTC โดยมีฟิลด์ `madeAtTimezoneOffset: 25200` (+7 ชม. ประเทศไทย) จะจัดเก็บ `start_date` ในรูปแบบใดเพื่อความเที่ยงตรงของการแสดงผลรายวันและรายเดือน
4. **Starting Balance vs Net Cash Flow**: ยอดคงเหลือเริ่มต้นของกระเป๋าเงิน (Starting Balance) สัมพันธ์กับผลรวมธุรกรรม 3,464,594.74 THB อย่างไร

---

## การตัดสินใจที่เสนอ (Proposed Decisions)

### 1. Primary Key Format & Idempotency
- ใช้ Prefix ที่คง UUID เดิมของ Spendee ไว้: `tx_spendee_<spendee_id>`
- ใช้ SQL `INSERT OR REPLACE INTO transactions`
- **ผลลัพธ์**: สามารถรันคำสั่ง Import ซ้ำกี่ครั้งก็ได้โดยไม่เกิดข้อมูลซ้ำซ้อน (Idempotent) และสามารถระบุที่มาของข้อมูลในฐานข้อมูลได้ชัดเจนผ่าน Prefix

### 2. Domain Category Expansion
- ขยาย Domain Category ถาวรโดยเพิ่ม 2 หมวดหมู่ใหม่เข้าสู่ระบบ:
  - `cat_family_personal` ('Family & Personal', Icon: `Heart`, Color: `#E91E63`, Type: `expense`)
  - `cat_clothing` ('Clothing', Icon: `Shirt`, Color: `#9B59B6`, Type: `expense`)
- อัปเดตทั้งใน Database D1 (`categories` table) และ TypeScript Domain Model (`DEFAULT_CATEGORIES` ใน `src/db/defaultCategories.ts`)
- **ผลลัพธ์**: ข้อมูล 543 รายการ (26% ของรายจ่ายทั้งหมด) ยังคงความหมายเดิม ไม่ถูกกลืนเป็น "Other Expenses"

### 3. Timestamp Normalization
- บันทึก `start_date` เป็นมาตรฐาน ISO-8601 UTC String (`YYYY-MM-DDTHH:mm:ss.sssZ`) ตามเวลาจริงที่บันทึก
- ให้การคำนวณและแสดงผลช่วงเวลา (Daily / Monthly / Yearly) ใน Frontend เป็นไปตาม Browser Local Timezone ของผู้ใช้
- **ผลลัพธ์**: รักษาความถูกต้องของ Time Domain ตามมาตรฐาน WinterCG / Cloudflare D1

### 4. Wallet & User Association
- กำหนดให้ธุรกรรมทั้งหมดผูกกับ:
  - `wallet_id`: `74f0119b-3a4f-42f1-8205-ee3e0a4de051` ("Spendee Wallet")
  - `user_id`: `usr_rattajak_n_gmail_com` (และรองรับ alias `usr_owner`)
  - `starting_balance`: 0 THB (ให้ยอด Net 3,464,594.74 THB คำนวณแบบ Dynamic จากธุรกรรมจริง)

---

## ผลลัพธ์และข้อพิจารณา (Consequences & Trade-offs)
- **ข้อดี:**
  - 100% Data Fidelity: ข้อมูลตัวเลข 2,219 รายการ ยอดเงินตรงกันบาทต่อสตางค์
  - Re-run Safety: ไม่เสี่ยงต่อ Duplicate Transactions
  - Full-stack Alignment: Schema ของ D1, Frontend Types และ Local Cache สอดคล้องกัน
- **ข้อพิจารณา:**
  - เมื่อเปิดดูใน UI เนื่องจากเป็นข้อมูล 12 ปี ตัวกรองช่วงเวลา (Date Period) ในหน้าต่างเริ่มต้นจะแสดงผลตามช่วงเวลาที่เลือก (เช่น Current Month หรือ All Time)

