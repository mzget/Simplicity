# ADR-001: Service Worker Scope & Ownership in Federated Micro-Frontend

## สถานะ (Status)
**Accepted** (2026-10-31)

## บริบท (Context)
Simplicity Finance ทำงานในรูปแบบ **Federated Micro-Frontend Module (`./FinanceApp` ผ่าน `remoteEntry.js`)** ภายใต้คอนเทนเนอร์หลักของ **Oaktree Agent Host**
บนเว็บเบราว์เซอร์ Service Worker และ Web App Manifest ถูกควบคุมโดย **Top-level Origin ของโฮสต์** เท่านั้น
หาก Remote Micro-Frontend ทำการลงทะเบียน Service Worker หรือประกาศ Manifest ใน Origin ย่อยของตัวเอง จะมีผลเฉพาะเมื่อเปิดแอปแบบ Standalone ซึ่งขัดกับนโยบายความปลอดภัยที่ต้องการปิดกั้นการเข้าใช้งานแบบ Standalone เพื่อรักษาความสมบูรณ์ของข้อมูลการเงิน

## การตัดสินใจ (Decision)
1. **ให้ Oaktree Host เป็นผู้รับผิดชอบ Service Worker และ Web App Manifest แต่เพียงผู้เดียว**
2. **คงการล็อก Standalone Mode (`Standalone Access Disabled`) ใน [`src/App.tsx`](file:///c:/Users/natta/Documents/antigravity/brave-planck/src/App.tsx) ไว้ตามเดิม**
3. **โฟกัสที่ Application-Level Offline Engine**: ฝั่ง Simplicity Finance จะจัดการระบบ Offline Read-Through Cache และ Mutation Queue ภายในตัว React Module เอง (ทำงานผ่าน IndexedDB และ Web Events เช่น `online`/`offline`) ซึ่งสามารถทำงานได้ 100% ภายใต้ Oaktree Host โดยไม่ต้องพึ่งพา Service Worker ข้าม Origin

## ผลลัพธ์ (Consequences)
- **ข้อดี:**
  - ไม่เกิดความขัดแย้งของ Service Worker Lifecycle และ Cache Invalidation ระหว่าง Host และ Remote
  - Remote App ไม่ทำให้แคชของ Host สับสน (Cache Poisoning)
  - ยังคงความปลอดภัยของข้อมูลโดยไม่อนุญาตให้เปิด Standalone ตรงๆ
- **ข้อจำกัด:**
  - การแคชระดับ HTTP Network Requests ของ Static Chunks ต้องพึ่งพาการตั้งค่า Cache-Control Header หรือ Service Worker ของ Oaktree Host

