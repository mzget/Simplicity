---
trigger: always_on
description: Simplicity Project Rules - Cloudflare CLI authorization, conditional skill activation, and mandatory unit/e2e test coverage.
---

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

## 🧪 Testing & Coverage Rules

### 1. Unit Test Coverage Rule
- เมื่อมีการปรับปรุง แก้ไข หรือสร้างโค้ดใหม่ ต้องเขียน Unit Test ให้ครอบคลุมการทำงานเสมอ (Must ALWAYS include unit test coverage for new or modified code/logic).

### 2. E2E Test Coverage Rule
- เมื่อมีหน้าจอใหม่ หรือ Module ใด ๆ ถูกแก้ไข หรือสร้างใหม่ ต้องเขียน E2E Test ครอบคลุมการแสดงผลและ User Flows ของหน้าจอนั้น ๆ เสมอ (Must ALWAYS include E2E test coverage whenever screens or modules are added or modified).
