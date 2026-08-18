# PayMe - การย้าย Tech Stack เสร็จสมบูรณ์

**ระบบบันทึกรายรับรายจ่าย Full-Stack: Astro.js + Svelte + Bun.js**

## 🎯 ภาพรวมการย้ายระบบ

เราได้ทำการเขียนโค้ดใหม่ทั้งหมด (Complete Rewrite) จาก **Rust (Actix-web) + React + TypeScript** เปลี่ยนมาเป็น **Bun.js + Astro.js + Svelte** (Vanilla JavaScript)

### ตารางเปรียบเทียบการเปลี่ยนแปลง

| ส่วนประกอบ   | ระบบเดิม (Before)       | ระบบใหม่ (After)              |
| ------------ | ----------------------- | ----------------------------- |
| **Backend**  | Rust + Actix-web + SQLx | **Bun.js + Astro API Routes** |
| **Frontend** | React 18 + Vite         | **Astro.js 4 + Svelte 4**     |
| **Language** | TypeScript              | **Vanilla JavaScript**        |
| **Database** | SQLite (sqlx)           | **SQLite (better-sqlite3)**   |
| **Auth**     | Cookie-based (Rust)     | **Cookie-based (Bun.js)**     |
| **Styling**  | Tailwind v4             | **Tailwind v4** ✓             |

---

## 🚀 เริ่มต้นใช้งาน (Quick Start)

```bash
# ติดตั้ง dependencies ด้วย Bun
bun install
# หรือ
bun install

# รัน server สำหรับ development (http://localhost:3000)
bun run dev

# ฐานข้อมูลจะถูกสร้างอัตโนมัติชื่อ: payme.db
```

## 📁 โครงสร้างโปรเจกต์

```
frontend-astro/
├── src/
│   ├── pages/              # Astro pages และ API routes
│   │   ├── api/            # Backend API endpoints (รันบน Bun.js)
│   │   │   ├── auth/       # ระบบยืนยันตัวตน (register, login, logout, me)
│   │   │   ├── months/     # จัดการข้อมูลรายเดือน
│   │   │   ├── categories/ # หมวดหมู่งบประมาณ
│   │   │   ├── fixed-expenses/
│   │   │   └── savings/
│   │   └── *.astro         # หน้าเว็บ Frontend (Astro files)
│   ├── components/         # Svelte components (UI และ Logic ฝั่ง Client)
│   ├── lib/               # ไลบรารีหลัก
│   │   ├── db.js          # การเชื่อมต่อ SQLite + migrations
│   │   ├── auth.js        # ฟังก์ชันเกี่ยวกับ Auth
│   │   ├── api.js         # ตัวเชื่อมต่อ API ฝั่ง Frontend
│   │   └── middleware.js  # Auth middleware
│   ├── stores/            # Svelte stores (จัดการ state เช่น auth, theme)
│   └── styles/            # Tailwind และการตั้งค่า Theme
├── payme.db              # ไฟล์ฐานข้อมูล SQLite
└── AGENTS.md             # บันทึกการย้ายระบบ
```

## 🔐 API Endpoints

ทุก Endpoint ใช้การยืนยันตัวตนผ่าน Cookie

### Authentication

- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/me` - ข้อมูลผู้ใช้ปัจจุบัน

### Data Management

- `GET /api/months` - รายการเดือนทั้งหมด
- `GET /api/months/current` - สรุปข้อมูลเดือนปัจจุบัน
- `GET /api/categories` - หมวดหมู่งบประมาณ
- `GET /api/fixed-expenses` - รายจ่ายคงที่
- ... (ดูเพิ่มเติมในโค้ด)

## 🎨 ระบบดีไซน์ (Design System)

- **Colors**: Sand, Sage, Terracotta, Charcoal (โทนสีธรรมชาติ)
- **Font**: JetBrains Mono (Monospace font)
- **Dark Mode**: ปรับตาม Class และบันทึกค่าลง localStorage

## 🔧 คำสั่งสำหรับ Developer

```bash
bun run dev      # รัน Dev server
bun run build    # สร้าง Production build
bun run preview  # ทดสอบตัว Production build
bun run format   # จัดรูปแบบโค้ดด้วย Prettier
```

## 📊 สถานะการย้ายระบบ

**✅ เสร็จสมบูรณ์**: ติดตั้งโปรเจกต์, ฐานข้อมูล, Auth API, UI components, และ Stores ครบถ้วน
**ความคืบหน้า**: 100% เสร็จสมบูรณ์พร้อมใช้งาน

ดูรายละเอียดได้ที่ [AGENTS.md](./AGENTS.md)

---

**พัฒนาด้วย ❤️ โดยใช้ Bun.js, Astro, และ Svelte**
