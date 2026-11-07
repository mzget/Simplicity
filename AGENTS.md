# Project Rules & Guidelines — Simplicity

## ☁️ Cloudflare Skill & CLI Usage Authorization

The agent is explicitly authorized and encouraged to:
- **Activate Cloudflare Skills**: Load and reference `cloudflare` and `wrangler` skills whenever investigating Cloudflare services, architecture, or CLI syntax.
- **Execute Cloudflare CLI (`wrangler` / `cf`)**: Run CLI commands (e.g., `npx wrangler d1 execute`, `wrangler tail`, `wrangler kv`, inspecting deployments or bindings) via `run_command` whenever needed to inspect live state, query data, or gather relevant information without seeking redundant permission.
- **CLI Preference**: When interacting with Cloudflare, use the `cf` CLI unless the project has a Wrangler configuration file (`wrangler.jsonc` or `wrangler.toml`).

---

## ⚡ Conditional Skills Activation (Load only when relevant)

### 1. Frontend UI Guidelines
- **Condition:** Developing, editing, or reviewing UI screens, design systems, and frontend routing.
- **Skills to Activate:** `stitch`, `react-router`

### 2. Backend & Cloudflare Database Guidelines
- **Condition:** Developing, modifying, or reviewing backend API endpoints, Cloudflare Workers/Pages functions, and D1 SQL queries.
- **Skills to Activate:** `hono`, `sql-sentinel`

### 3. Core Coding Principles & Karpathy Guidelines (Mandatory Pair)
- **Condition:** Writing, modifying, reviewing, refactoring, or debugging any code. Must **ALWAYS** load both skills together.
- **Skills to Activate:** `karpathy-guidelines`, `coding-principles-skill`

### 4. Release Management Guidelines (`tostaging` / `tomain`)
- **Condition:** Merging branches, preparing staging/production releases, or executing release commands.
- **Skills to Activate:** `release`
- **Execution Strategy:** Delegates release execution to a `flash_lite` sub-agent (`Workspace: 'inherit'`).

---

## 🏪 State Management & Store Architecture Rules (Zustand-First Convention)

### 1. Excessive `useState` Anti-Pattern (Store-First Refactoring)
- **ห้ามใช้ `useState` กระจัดกระจายจำนวนมากใน Component หรือ Screen ระดับบน**:
  - เมื่อตรวจพบว่า Component มีการใช้ `useState` มากเกินไป (เช่น เกิน 3-4 ตัว) โดยเฉพาะ state ที่เกี่ยวกับ Domain Data, Async Mutations, Loading States, หรือ State ที่ต้องส่งต่อข้าม Component/Modal
  - **ต้อง Refactor ไปใช้ Zustand Store เสมอ**: รวมศูนย์ State และ Async Actions ไว้ใน Zustand Store (`src/store/*` เช่น `useFinanceStore`) โดยจัดเป็น Domain Slices เพื่อรักษา Single Source of Truth, Clean Component Code, และลดภาระ Re-render
  - Component หลักควรทำหน้าที่เป็น Presentation/Orchestration Layer ที่ดึง State และ Actions จาก Store โดยตรง

---

## 🧪 Testing & Coverage Rules

### 1. Unit Test Coverage Rule (Mandatory for All Code Changes)
- **ทุกครั้งที่แก้โค้ด, Refactor หรือสร้างโค้ดใหม่ ต้องเขียน Unit Test ให้ครอบคลุมการทำงานเสมอ (Zero-Tolerance Policy)**:
  - ครอบคลุมทุก Business Logic, State Store Actions, API Client Adapters, Utility Functions, และ Boundary Conditions
  - ต้องรักษา 100% Pass Rate และ 0 Regressions ทุกครั้งก่อนส่งมอบงานหรือปล่อย Release

### 2. E2E Test Coverage Rule (Screen-Mandatory Policy)
- **ทุกหน้าจอ (Every Screen / Module) ต้องมี E2E Test (Playwright) กำกับเสมอ**:
  - เมื่อมีหน้าจอใหม่, แก้ไขหน้าจอเดิม, หรือเพิ่ม Interactive Flow ใด ๆ ต้องเขียนหรืออัปเดต E2E Test ให้ครอบคลุม:
    1. การเรนเดอร์และการแสดงผลของข้อมูล (Data Rendering & Initial States)
    2. User Flows & Critical Journeys (การกดปุ่ม, กรอกฟอร์ม, สลับแท็บ, บันทึกข้อมูล)
    3. Responsive Viewports (ทั้ง Mobile Viewport เช่น 390x844 และ Desktop Dialogs)
    4. Cross-Boundary & Federation Contracts (Props bridge, pendingAction, history guard, z-index)

---

## 🧩 UI Component & Design System Rules (Library-First Convention)

### 1. Library & Primitive Reuse Rule (Strict No-Bespoke-Primitives)
- **ห้ามสร้าง Component พื้นฐานหรือ Wrapper ซ้ำซ้อนขึ้นมาเองโดยพลการ**:
  - ก่อนสร้างหรือแก้ Component, Dialog, Modal, Input, Button, Dropdown, Tooltip หรือ Portals ให้ตรวจสอบและนำ Component Primitives ที่มีอยู่แล้วในโปรเจกต์มาใช้เป็นอันดับแรกเสมอ (เช่น `src/components/ui/*`, `@radix-ui/*`, `lucide-react`)
  - **Single Convention Pattern**: ต้องใช้ Pattern และ Primitives เดียวกันทั้งโปรเจกต์ เช่น ทุก Modal/Dialog ต้องใช้ Radix UI `Dialog` (`DialogContent`, `DialogTitle`) ร่วมกัน ห้ามเขียน custom `fixed inset-0` div หรือ bespoke portal ขึ้นมาเฉพาะจุด
  - หากจำเป็นต้องขยายความสามารถ ให้เพิ่ม props หรือ variant บน existing component ใน `src/components/ui/` แทนการแตกไฟล์ wrapper ใหม่

---

## 📅 Date & Time Handling Rules (`date-fns` Enforcement)

### 1. Mandatory `date-fns` Primitives (No Bespoke Date Logic)
- **ห้ามจัดการหรือเปรียบเทียบวันและเวลาด้วย bespoke logic หรือ raw string comparison โดยเด็ดขาด**:
  - ต้องใช้ **`date-fns`** สำหรับการคำนวณ, formatting, parsing, และ comparison ทั้งหมดในโปรเจกต์
  - **Date Boundaries & Presets**: เมื่อคำนวณช่วงเวลา (เช่น This Month, Last Month, This Week) ต้องใช้ฟังก์ชันของ `date-fns` เสมอ (`startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `subMonths`, `addMonths`, `startOfDay`, `endOfDay`)
  - **Formatting & Parsing**: ใช้ `format` และ `parseISO` สำหรับแปลงรูปแบบวันที่ ห้ามเขียน custom regex หรือ substring สำหรับวันเวลาเองโดยไม่จำเป็น
  - **Interval & Boundary Comparisons**: สำหรับการตรวจสอบ Transaction หรือข้อมูลที่อยู่ภายในช่วงเวลา ให้ใช้ date boundary primitives หรือ normalize วันที่ให้อยู่ในระดับ Day (`yyyy-MM-dd`) ป้องกันข้อผิดพลาดที่เกิดจาก Time Component/Timezone Offset (เช่น วันสุดท้ายของเดือนถูกตัดทิ้งเพราะมีเวลาต่อท้าย)
