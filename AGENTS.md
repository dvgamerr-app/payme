## PayMe — Quick Notes (สั้น/เทคนิค)

### Stack / Arch

- **Bun + Astro (SSR/API routes) + Svelte (interactive UI)**
- Router = **Astro**, UI = **Svelte components**
- DB = **Postgresql `payme.db`** via **better-Postgresql3 (sync)**

### Code Rules (non-negotiable)

- **Vanilla JS only** (no TS, no JSDoc)
- Format = **Prettier only** (`semi:false`, `singleQuote:true`)
- Prefer `const` + arrow fn (avoid `function`)
- Commit flow: **Husky + lint-staged** (format-on-commit)

### UI Rules

- Reuse-first: เช็ค **`src/components/ui/`** ก่อนสร้างใหม่
- ห้ามทำ `<input>`, `<button>`, modal เอง → ใช้ `Input.svelte`, `Button.svelte`, `Modal.svelte`
- Styling = **Tailwind + theme tokens** (`text-foreground`, `bg-background`) รองรับ **dark/light**

### API Standard Pattern

- Signature: `export const METHOD = async () => { ... }`
- Must-use utilities:
  - wrapper: `handleApiRequest()`
  - auth: `requireAuth()` (protected)
  - validate: `validateRequired()`
  - parse int: `parseIntParam()`
  - response: `jsonSuccess()` หรือ **throw Error**

- Anti-patterns:
  - ห้าม `new Response(JSON.stringify(...))` เอง
  - ห้าม try/catch ซ้ำๆ, validation ซ้ำๆ, ownership check ซ้ำๆ (ให้ใช้ helpers)

### Auth / Session

- Login/Register
- **Cookie-based session** + middleware สำหรับ protected routes
- User state = **Svelte store**

### Core Domain (ต้องรองรับ)

- CRUD: **Income, Fixed Expenses, Budgets, Spending Items**
- Month lifecycle: **create month / close month**
- Dashboard/Stats + charts: **LayerCake** (Svelte-native)
- **Import/Export JSON**, Analytics (incl. variance), Savings

### DB Migration

- Flow: **update schema → drizzle-kit generate → review SQL → controlled execute → commit schema + migration**

### Security (CRITICAL)

- Error hygiene:
  - ห้ามส่ง **SQL/params/stack trace/internal path** ไป client
  - ห้าม expose `error.message` จาก DB/ORM ตรงๆ
  - ใช้ `handleApiRequest()` + `sanitizeError()` ใน `api-utils.js`
  - Full log = backend only, client = generic msg

- Data exposure: ห้ามส่ง **password hash/token/credential** ใน response/error
- Input: ใช้ `validateRequired()` + `parseIntParam()` เสมอ, sanitize ก่อน query

### Must-know Paths

- `src/components/ui/` (UI reuse)
- `src/lib/api-utils.js` (handleApiRequest/jsonSuccess/jsonError/validate/sanitize)
- `src/lib/db-helpers.js` (ownership + DB helpers)
- `src/lib/middleware.js` (requireAuth/withAuth)

### Working Protocol

- Follow checklist ทุกครั้ง
- New code ต้อง **fit existing conventions**: reuse-first, DRY, utilities-first, consistent patterns
