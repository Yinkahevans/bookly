# Bookly — Architecture

## 1. What it is

Bookly is a PWA that replaces WhatsApp/call-based booking for small local businesses (salons, clinics, auto repair, tutors, and more). Three surfaces:

- **Customer + Business web app** (`frontend`) — customers discover businesses and book; business owners manage their profile, services, availability, and incoming bookings.
- **Admin panel** (`admin`) — you, the platform owner, monitor and control every business and booking on the platform.
- **Backend API** (`backend`) — handles anything that shouldn't run in the browser: sending emails via Resend, scheduled reminder jobs, and privileged admin actions.

## 2. Why this stack

| Layer      | Choice                          | Reason |
|------------|----------------------------------|--------|
| Database/Auth | Supabase (Postgres)           | Built-in auth, row-level security, realtime, generous free tier |
| Frontend   | React + Vite + TypeScript + Tailwind | Fast dev loop, installable as PWA via `vite-plugin-pwa` |
| Email      | Resend                          | Simple transactional email API for confirmations/reminders |
| API/Jobs   | Node + Express (Render)          | Cron-style reminder jobs and Resend calls need a server, not just client-side Supabase calls |
| Hosting    | Vercel (frontend, admin) / Render (backend) | Matches your existing stack |

## 3. Data model

```
businesses
  id, owner_id (auth.users), name, category, description,
  location, phone, email, status (pending/active/suspended),
  created_at

services
  id, business_id, name, description, duration_minutes,
  price, requires_approval (bool, default false), active

availability
  id, business_id, service_id (nullable = applies to all services),
  day_of_week, start_time, end_time

bookings
  id, business_id, service_id, customer_id (nullable — guest),
  guest_name, guest_email, guest_phone,
  start_time, end_time, status (pending/confirmed/cancelled/completed),
  created_at

customers
  id (auth.users), name, email, phone, created_at
```

Guest bookings store contact info directly on the `bookings` row. If a guest later creates an account with the same email, bookings can be linked retroactively.

## 4. Core flows

**Business onboarding**
1. Business owner signs up (Supabase Auth) → creates `businesses` row with `status = pending`.
2. Owner adds services and availability.
3. Admin reviews and flips `status` to `active` (or it can auto-activate — configurable in admin settings).

**Customer booking**
1. Customer browses/searches businesses by category or location (no login required).
2. Picks a service → sees available slots (computed from `availability` minus existing `bookings`).
3. Books as guest (name/email/phone) or logs in first.
4. If `services.requires_approval = false` → booking inserted as `confirmed`, confirmation email sent immediately.
5. If `true` → booking inserted as `pending`, business owner notified, customer gets a "request received" email. Owner approves/declines from their dashboard, which triggers the final customer email.

**Reminders**
- A scheduled job in `backend/src/jobs/sendReminders.job.ts` runs periodically (e.g. every 30 min via Render cron or `node-cron`), finds bookings starting within the next N hours that haven't been reminded yet, and sends a Resend reminder email.

**Admin oversight**
- View/search all businesses and bookings platform-wide.
- Approve or suspend businesses.
- View platform stats (bookings this week, active businesses, etc.).
- Impersonation-free — admin never needs a business's login, RLS + a service-role backend endpoint handles privileged reads/writes.

## 5. Auth & permissions (Supabase RLS)

Three roles, distinguished by a `role` field on the user's profile (or `auth.users.app_metadata.role`):

- `customer` — can read active businesses/services, create bookings, read/update only their own bookings.
- `business_owner` — can read/update only their own `businesses`, `services`, `availability`, and read/update `bookings` that belong to their business.
- `admin` — bypasses RLS via the backend's Supabase service-role key (never exposed to the browser); the `admin` frontend app talks to `backend`, not directly to Supabase, for anything privileged.

## 6. PWA specifics

- `vite-plugin-pwa` generates the manifest + service worker for `frontend`.
- `manifest.json` defines name (Bookly), theme colors (navy/orange), icons, `display: standalone`.
- Offline strategy for v1: cache static assets + last-viewed business pages; booking actions require network (clear "you're offline" state rather than fake offline bookings).

## 7. Build order (how we'll build it together)

1. Supabase schema + RLS (`supabase/migrations/0001_init.sql`)
2. Supabase client + auth context in `frontend`
3. Business dashboard: create business → services → availability
4. Public customer flow: browse → book (guest)
5. Booking approval flow + status updates
6. `backend`: Resend integration for confirmation/approval/reminder emails
7. Reminder cron job
8. `admin`: business approval, bookings oversight, platform stats
9. PWA manifest/service worker + installability polish
10. Deploy: `frontend`/`admin` → Vercel, `backend` → Render, DB → Supabase

## 8. Folder structure

See the repo tree — each app is self-contained with its own `package.json`, `.env.example`, and `src/` organized by `pages` (routes), `components` (reusable UI), `lib` (external clients like Supabase), `context` (React context, e.g. auth), and app-specific folders (`jobs`, `services`, `routes` in `backend`).
