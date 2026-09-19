# Bookly

A multi-category local service booking PWA — customers book appointments with salons, clinics, auto repair shops, tutors, and other small businesses, without WhatsApp/call chaos.

Owned by Gordon Mills — Divine Intelligence Group Ltd.

## Apps in this repo

| App        | Purpose                                              | Users                | Deploy target |
|------------|-------------------------------------------------------|-----------------------|---------------|
| `frontend` | Customer discovery/booking + business owner dashboard | Customers & businesses | Vercel        |
| `admin`    | Platform control panel                                 | You (platform owner)  | Vercel        |
| `backend`  | API for emails, reminders, admin-only operations       | Internal service       | Render        |
| `supabase` | Database schema, RLS policies, migrations               | —                      | Supabase      |

See `ARCHITECTURE.md` for the full breakdown of how everything fits together and how it functions.

## Quick start

1. Create a Supabase project, run the SQL in `supabase/migrations/0001_init.sql`.
2. Create a Resend account, get an API key.
3. Copy `.env.example` → `.env` in `frontend/`, `admin/`, and `backend/`, fill in your keys.
4. Install and run each app:

```bash
cd frontend && npm install && npm run dev
cd admin && npm install && npm run dev
cd backend && npm install && npm run dev
```

`frontend` runs on `:5173`, `admin` on `:5174`, `backend` API on `:4000` by default.

## Brand

- Name: **Bookly**
- Colors: Navy (trust, structure) + Warm Orange (energy, action) — see `frontend/src/config/theme.ts` for exact tokens.
