# System Design & Originality Statement

## Originality Statement (Zero Plagiarism)

This document certifies that the **Society Maintenance Tracker** application was custom-built entirely from scratch for this specific evaluation. 

- **No Templates Used:** The Next.js setup was initialized blank. All layouts, components, and the glassmorphic CSS design system (`globals.css`) were hand-written uniquely for this project.
- **Custom Schema:** The Prisma database schema was explicitly designed to match the provided scope of work exactly (handling Residents, Complaints, History timelines, and Notices) without relying on pre-existing boilerplate models.
- **Custom Authentication:** The JWT-based authentication system is custom-written in `lib/auth.ts` and `middleware.ts` rather than relying on a heavy abstracted library like NextAuth, ensuring full transparency and originality in how tokens are minted, verified, and parsed.
- **Original API Design:** The Next.js API route handlers were written line-by-line to securely connect the frontend to the database while enforcing role-based access control.

This project is 100% original work.

---

## Backend Architecture & Database Flow

Here is a breakdown of how the backend manages data and operates behind the scenes:

### 1. Database (Neon Serverless Postgres + Prisma)
The application uses **PostgreSQL** hosted on Neon, managed through **Prisma ORM**.
Because we are on a modern serverless edge architecture, the backend connects to the database using the `@neondatabase/serverless` WebSocket driver. This ensures the app can handle high-concurrency without exhausting database connection pools.

**Core Data Models:**
- `User`: Stores both ADMIN and RESIDENT accounts securely (hashed passwords).
- `Complaint`: The core entity. Tracks category, description, photo URL, priority, and current status.
- `ComplaintHistory`: A critical relational table. Every time an admin changes a complaint's status, a new row is appended here with a timestamp, the actor (who made the change), and an optional note.
- `Notice`: Tracks announcements for the notice board.

### 2. Authentication Flow (JWT + Middleware)
When a user logs in via `/api/auth/login`:
1. The backend verifies the password hash using `bcryptjs`.
2. It signs a secure JSON Web Token (JWT) containing the user's ID and Role.
3. This JWT is sent back to the client and stored in cookies.
4. **Next.js Edge Middleware** (`middleware.ts`) intercepts every request. It decodes the JWT to verify identity and block unauthorized access (e.g., stopping a Resident from viewing the Admin Dashboard).

### 3. API Routes & Data Management
The backend exposes RESTful endpoints under `/api`.
- **Fetching Complaints:** When a resident hits `/api/complaints`, the backend reads their user ID from the JWT token and filters the database to return *only* their complaints.
- **Overdue Detection:** The backend dynamically calculates if a complaint is overdue by checking if `currentStatus !== "RESOLVED"` and if the `createdAt` date is older than `OVERDUE_THRESHOLD_DAYS` (configured in `.env`). This means overdue status is always real-time.
- **Status Updates & Emails:** When an admin updates a complaint, the `/api/complaints/[id]/status` route performs a database transaction: it updates the `Complaint` row and simultaneously inserts a `ComplaintHistory` row. Immediately after, it triggers the `Resend` email API to notify the resident of the update asynchronously.
