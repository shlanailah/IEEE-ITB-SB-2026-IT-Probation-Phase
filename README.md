# IEEE ITB Student Branch — Event Website

Profile website for the **IEEE ITB Student Branch** for publishing and managing events, built with **HTML + CSS + JavaScript (vanilla)** and **Supabase** as the backend (Postgres, Auth, and access control through Row Level Security). Built as the deliverable for the IT Probation Phase 2026.

---

## 1. Project Overview

A two-sided web application:

- **Public pages** — display upcoming & past event lists as carousels, plus a detail page for each event. No login required.
- **Admin pages** — secure login to manage (add, edit, delete) events through a dashboard.

All data is stored in Supabase. Validation happens at two layers: **client-side** (form & feedback) and **server-side** (CHECK constraints, triggers, and RLS policies).

---

## 2. Completed Features

Public pages:

- **Home** (`index.html`) — hero + *Upcoming Events* carousel. Instant render from a sessionStorage cache when available (shimmer skeleton on first paint), then silently refreshes.
- **About** (`about.html`) — short profile of the organization.
- **Events** (`events.html`) — two carousels: *Upcoming* and *Past*.
- **Event Detail** (`event-detail.html?id=...`) — date, time, location, description, and event image.

Admin pages (`admin/`):

- **Login** (`login.html`) — email/password authentication via Supabase Auth, with form validation and friendly error messages.
- **Dashboard** (`dashboard.html`) — statistics (total / upcoming / past), filter tabs (All / Upcoming / Past), multi-event selection, and batch delete with a confirmation modal.
- **Event Form** (`event-form.html`) — add a new event or edit an existing one (`?id=` for edit), with per-field validation and toast feedback.

Backend & system:

- `profiles` (admin) and `events` tables in Postgres/Supabase.
- **Row Level Security (RLS)**: anyone can *read* events; only authenticated admins can *write* (insert/update/delete).
- `NOT NULL` + `CHECK` constraints and an automatic `updated_at` trigger.
- Complete UI states: loading (skeleton/spinner), empty, error + retry, and toast notifications.
- Responsive UI: carousel shows 2 cards per slide (desktop) / 1 card (mobile); navbar & footer are injected automatically via JS.

---

## 3. Architecture

A simple layered architecture without frameworks, everything exposed through the global `window.app`:

```
Static HTML shell
   └─ js/config.js        Configuration: SUPABASE_URL + SUPABASE_ANON_KEY
        └─ js/api.js      Data layer: Supabase client wrapper (auth + events CRUD)
             └─ js/shared.js   Shared UI: navbar/footer, toast, states, carousel, templates
                  └─ js/pages/*.js   Per-page controllers
                        └─ Supabase (Postgres + Auth + RLS)
```

Data flow:

1. Each HTML page loads the `@supabase/supabase-js` CDN, then `config.js → api.js → shared.js → pages/<page>.js`.
2. The page controller calls functions on `app` (e.g. `app.listEvents('upcoming')`) to fetch/mutate data.
3. `api.js` translates Supabase errors into friendly messages.
4. Admin pages are protected by `app.requireAdmin()` (redirects to login when there is no session); on the server side, RLS blocks non-admin writes as a second security layer.

The full database schema and RLS policies live in `supabase/schema.sql`; sample data is in `supabase/seed.sql`.

---

## 4. Tech Stack & Rationale

| Technology | Role | Rationale |
| --- | --- | --- |
| **HTML5 + CSS3** | Structure & design | Semantic, no build step. Custom design system (dark glassmorphism, navy–teal gradient, Poppins font) in `css/style.css`. |
| **JavaScript (vanilla)** | Frontend logic | No framework and no runtime dependencies — easy to evaluate and fast to load in the browser. |
| **Supabase** (Postgres, Auth, RLS) | Backend | Hosted Postgres + email/password auth + RLS policies provide server-side validation and security without running your own backend server. |
| **supabase-js v2** (jsDelivr CDN) | Supabase client | Official, stable, loaded directly from the HTML page. |
| **`npx serve` / Live Server** | Local static server | `serve.json` (`cleanUrls=false`) is included for consistent path resolution. |

No bundler, no `package.json`, no transpilation — just open it in a browser or serve it from any static web server.

---

## 5. Local Setup & Run

Prerequisites: a [Supabase](https://supabase.com) account (free tier) and Node.js (only for `npx serve` — optional).

1. **Clone and open the project folder.**
2. **Prepare Supabase** (see sections 6 & 7): create a project, run `schema.sql` then `seed.sql`, and fill in the credentials.
3. **Fill in the configuration** in `js/config.js`:
   ```js
   window.SUPABASE_URL = 'https://<project-ref>.supabase.co';
   window.SUPABASE_ANON_KEY = '<anon-key>';
   ```
4. **Run a local server** (choose one):
   ```bash
   npx serve .            # default port 3000; uses serve.json
   ```
   or open `index.html` directly (via VS Code Live Server / browser). A local server is recommended so paths and the CDN behave consistently.

5. Open the pages:
   - Public: `http://localhost:3000/`
   - Admin: `http://localhost:3000/admin/login.html`

---

## 6. Required Environment Variables

A template is available in **`.env.example`** (no secrets):

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

> Note: because this is a **static frontend with no build step**, the `SUPABASE_URL` and `SUPABASE_ANON_KEY` variables are NOT read from a `.env` file at runtime — they are pasted directly into `js/config.js`. The `.env.example` file documents the required variables.

**Important:** use the **anon/publishable key** (safe for frontends — data access is restricted by RLS). **Never** use the `service_role` key in the frontend.

---

## 7. Database Setup

Full setup using the Supabase SQL Editor (run in order, once):

1. Open **Supabase Dashboard → SQL Editor**.
2. Run **`supabase/schema.sql`** — creates `public.profiles` & `public.events`, the `updated_at` trigger, and all RLS policies plus the `public.is_admin()` function.
3. Run **`supabase/seed.sql`** — inserts 6 sample events (3 upcoming, 3 past) with dates relative to `current_date`.

Schema summary:

- **`profiles`** — `id (PK → auth.users)`, `username`, `role` (`'admin'`), `created_at`. RLS: public read, owner-only write.
- **`events`** — `id (PK)`, `title`, `description`, `date`, `time`, `location`, `status` (`upcoming|ongoing|past`), `image_url` (optional), `created_at`, `updated_at`. `NOT NULL` + `CHECK` constraints (text length, status enum). RLS: public read; insert/update/delete only when `public.is_admin()`.

> `supabase/test.sql` and `js/tes.js` are empty stubs — not implemented yet.

---

## 8. Evaluator / Demo Account Credentials

**No ready-made demo account** — for security, each environment should create its own admin account.

To prepare an evaluator account:

1. Open **Supabase Dashboard → Authentication → Users → Add user**. Create an email + password (min. 6 characters). If email confirmation is enabled, confirm the email first.
2. Link the user as an admin — run in the SQL Editor (once per admin user):
   ```sql
   insert into public.profiles (id, username, role)
   select id, 'admin', 'admin' from auth.users limit 1;
   ```
3. Log in at `admin/login.html` with that email & password.

---

## 9. Known Issues & Limitations

- **No real env configuration** — Supabase credentials are written directly in `js/config.js` (including a project URL/anon key from the developer's project that is already committed). For your own environment, replace them with your project's values.
- **No search or pagination** — all events are fetched at once; not ideal for very large datasets.
- **Home caching** — the Home page uses sessionStorage for 5 minutes; data can appear slightly stale after an admin change.
- **Hardcoded timezone** — time is displayed as `... WIB` on the detail page without conversion to the visitor's timezone.
- **Images via external URLs** — no upload/Storage via Supabase Storage; broken images fall back to a placeholder.
- **No demo account** — admin creation requires manual steps in the Supabase Dashboard + SQL.
- **No automated tests** (`test.sql` / `tes.js` are still stubs) and no CI/CD.
- RLS intentionally allows **everyone to read** event data (for the public pages); avoid storing sensitive data in that table.