# Society Maintenance Tracker

A platform for apartment societies to track maintenance complaints end-to-end: residents raise complaints with photos, admins manage them through a status/priority workflow, and everyone stays informed via a notice board and email updates.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Frontend + Backend | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL + Prisma 7 ORM |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Photo storage | Cloudinary |
| Email | Resend |
| Hosting (App) | Vercel |
| Hosting (DB) | Neon / Supabase |

---

## 2. Local Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd society-maintenance-tracker

# 2. Install dependencies
npm install

# 3. Copy env file and fill in real values
cp .env.example .env

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Seed demo admin + resident accounts
npx prisma db seed

# 6. Start the dev server
npm run dev
```

App runs at `http://localhost:3000`.

---

## 3. Demo Login Credentials

> ⚠️ These are seeded by `npx prisma db seed`. Run the seed before testing.

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@society.com | admin123 |
| **Resident** | resident@society.com | resident123 |

The seed also creates:
- 3 sample complaints (one overdue, one in-progress, one resolved)  
- 1 important notice

---

## 4. Environment Variables

See `.env.example` for the full list.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing auth tokens (generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend transactional email API key |
| `OVERDUE_THRESHOLD_DAYS` | Days after which an open complaint is flagged overdue (default: 7) |
| `NEXT_PUBLIC_APP_URL` | Base URL used in email links (e.g. `https://your-app.vercel.app`) |

---

## 5. Database Schema

```
users
├── id            (PK, CUID)
├── name
├── email         (unique)
├── password_hash
├── role           # RESIDENT | ADMIN
├── flat_number   (nullable)
└── created_at

complaints
├── id             (PK, CUID)
├── resident_id    (FK → users.id)
├── category       # PLUMBING | ELECTRICAL | CLEANING | SECURITY | LIFT | PARKING | INTERNET | OTHER
├── description
├── photo_url      (nullable — Cloudinary URL)
├── priority       # LOW | MEDIUM | HIGH
├── current_status # OPEN | IN_PROGRESS | RESOLVED
├── created_at
└── resolved_at    (nullable)

complaint_status_history  (append-only)
├── id             (PK, CUID)
├── complaint_id   (FK → complaints.id, CASCADE DELETE)
├── status
├── note           (nullable)
├── changed_by     (FK → users.id)
└── timestamp

notices
├── id             (PK, CUID)
├── title
├── body
├── is_important
├── posted_by      (FK → users.id)
└── created_at

email_logs
├── id
├── user_id        (nullable FK → users.id)
├── recipient
├── type           # STATUS_CHANGE | IMPORTANT_NOTICE
├── status         # SENT | FAILED
├── error          (nullable)
└── sent_at
```

---

## 6. API Documentation

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a resident, returns JWT |
| POST | `/api/auth/login` | Public | Login, returns JWT |

### Complaints
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/complaints` | Resident | Create complaint (category, description, optional photoBase64) |
| GET | `/api/complaints` | Resident / Admin | Resident: own complaints. Admin: all, filterable by `?status=&category=&date=` |
| GET | `/api/complaints/:id` | Resident / Admin | Complaint detail + full status history |
| PATCH | `/api/complaints/:id/status` | Admin | Update status → history row + optional note + email |
| PATCH | `/api/complaints/:id/priority` | Admin | Set priority |

### Notices
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/notices` | Authenticated | List (important pinned first) |
| POST | `/api/notices` | Admin | Create notice; if `isImportant`, emails all residents |

### Dashboard
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard` | Admin | Counts by status, by category, overdue count, 5 recent |

**Authentication:** All protected routes require `Authorization: Bearer <token>` header.

---

## 7. Deployment

### Vercel + Neon

1. Push repo to GitHub  
2. Import into [vercel.com](https://vercel.com) → set all env vars from `.env.example`  
3. Create a Postgres DB at [neon.tech](https://neon.tech) → copy connection string to `DATABASE_URL`  
4. Run `npx prisma migrate deploy` against the hosted DB  
5. Run `npx prisma db seed` against the hosted DB  
6. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL  
7. Test email sending from the hosted environment (Resend sandbox works on `onboarding@resend.dev` without domain verification)

Hosted URL: *(fill in after deploy)*

---

## 8. Project Structure

```
/app
  /api
    /auth/register     POST — register resident
    /auth/login        POST — login
    /complaints        GET (list) / POST (create)
    /complaints/[id]   GET (detail + history)
    /complaints/[id]/status    PATCH — admin status update
    /complaints/[id]/priority  PATCH — admin priority update
    /notices           GET / POST
    /dashboard         GET — admin stats
  /complaints          Resident: my complaints list
  /complaints/new      Resident: raise complaint
  /complaints/[id]     Shared: complaint detail + timeline
  /admin/dashboard     Admin: KPI dashboard
  /admin/complaints    Admin: all complaints + filters
  /admin/notices/new   Admin: post notice
  /notices             Shared: notice board
  /login               Auth
  /register            Auth
  page.tsx             Landing page
  layout.tsx           Root layout (AuthProvider + Navbar)
  globals.css          Design system (dark theme, glassmorphism)

/components
  Navbar.tsx           Role-aware navigation

/context
  AuthContext.tsx      JWT auth state + localStorage persistence

/lib
  prisma.ts            Singleton Prisma client
  auth.ts              JWT sign / verify helpers
  cloudinary.ts        Image upload helper
  email.ts             Resend email (fire-and-forget)
  middleware-helper.ts requireAuth() route guard

/prisma
  schema.prisma        Data models
  seed.ts              Demo data seeder
  prisma.config.ts     Prisma 7 datasource config
```

---

## 9. Further Documentation

- See `design.md` for the system design write-up (complaint history model, overdue detection, photo handling, notification flow)
- See `plan.md` for the build plan and phase checklist
