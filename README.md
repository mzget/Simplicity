# Simplicity — Full-Stack Cloudflare Edge Finance

A personal finance, multi-wallet wealth management, and smart budgeting web application engineered to run 100% on **Cloudflare's serverless edge ecosystem** (Free-tier friendly, zero egress fees, edge latency < 50ms).

---

## Architecture & Tech Stack

- **Edge Runtime:** Cloudflare Pages & Cloudflare Workers Functions (`/functions/api/[[route]].ts`)
- **API Framework:** [Hono v4](https://hono.dev/) with CORS, D1 bindings, and type-safe routing
- **Database:** [Cloudflare D1 (SQLite Edge)](https://developers.cloudflare.com/d1/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Object Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2/) for receipt and slip photos
- **Caching:** [Cloudflare KV](https://developers.cloudflare.com/kv/) for FX currency rates and session data
- **Automation:** Cloudflare Cron Triggers for scheduled recurring bills and subscriptions
- **AI Receipt Scanner:** Cloudflare Workers AI / Gemini for automatic OCR receipt parsing
- **Frontend SPA:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Zustand, Recharts

---

## Features

1. **Information Architecture & Dashboard:**
   - Soft-slate financial theme (`#F4F7FA` canvas, `#12C48B` brand teal, `#F55353` alert red, `#324C5B` slate text).
   - Global Navbar with active wallet dropdown context switcher.
   - Quick Add transaction modal with multi-mode switcher (`Expense`, `Income`, `Transfer`).
2. **Multi-Wallet & Account Containers:**
   - Support for Cash, Checking, Savings, Credit Cards, and Crypto wallets.
   - Real-time atomic double-entry wallet-to-wallet fund transfers.
3. **Smart Budgets:**
   - Multi-category monthly spending caps with live pacing indicators (green -> amber -> red threshold warnings).
4. **Data Visualization:**
   - **Cash Flow Dynamics:** Daily income inflow (green) vs outflow (red) bar chart.
   - **Expense Breakdown:** Donut chart with centered total and ranked category spending breakdown with % bars.
5. **CSV Import & AI Receipt Scanning:**
   - Drag & drop PapaParse CSV importer for bank statements and exported data.
   - Camera/image receipt extraction assistant.

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Dev Server
```bash
# Pure frontend development with local storage fallback
npm run dev
```

### 3. Run Full-Stack with Local Cloudflare D1 Simulation
```bash
# Build frontend assets
npm run build

# Run local Cloudflare Pages dev server with D1, KV, and R2 bindings
npm run cf:dev
```

---

## Deploying to Cloudflare Pages & D1

### Step 1: Create Remote Cloudflare D1 Database
```bash
npx wrangler d1 create simplicity-d1
```
Copy the `database_id` from the output into your `wrangler.jsonc`.

### Step 2: Apply Migrations to Remote D1
```bash
npx wrangler d1 migrations apply simplicity-d1 --remote
```

### Step 3: Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy dist
```

### Step 4: Protect with Cloudflare Access (Zero Trust)
In your Cloudflare Dashboard:
1. Navigate to **Zero Trust** > **Access** > **Applications**.
2. Add an application protecting your Simplicity Pages custom domain (e.g. `money.yourdomain.com`).
3. Set policy to allow only your personal Google / email address with OTP.
4. Done! Zero-code enterprise authentication at the edge.
