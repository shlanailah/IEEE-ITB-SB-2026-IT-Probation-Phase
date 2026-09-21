This is a website to publish and manage organizational events. Built with **HTML + CSS + vanilla JavaScript** and **Supabase** as the backend (database, authentication, and access control). Created as the deliverable for **IEEE ITB SB IT Probation Phase 2026**.

---

## What Can This Website Do?

The site has **two sides**:

### Public Side (no login required)

- **Home**: landing page with a hero section and an *Upcoming Events* carousel
- **About**: a short profile of the organization
- **Events**: full event list with:
  - Search (by name, place, or description)
  - Filter tabs (All / Upcoming / Past)
  - Pagination to split the list into multiple pages
- **Event Detail**: full event info (date, time, location, description, image)

### Admin Side (login required)

- **Login**: sign in with email & password
- **Dashboard**: event stats (total / upcoming / past), filter tabs, and delete event
- **Event Form**: add a new event or edit an existing one, with validation, toast feedback, and image upload (max 5MB)

---

## How It Works (Short Version)

This website **does not have its own server**. All data lives in **Supabase** (a free hosted database service). Here's the flow:

1. The HTML page loads scripts from a CDN
2. Those scripts fetch/send data to Supabase
3. Supabase stores the data in a **Postgres** database
4. Security rules (**Row Level Security**) make sure only admins can add/edit/delete events

Validation runs on **two layers**: in the browser (so users get instant feedback) and on the server (to prevent tampering).

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **HTML + CSS** | Page structure and design |
| **Vanilla JavaScript** | Browser-side logic — no framework, lightweight and easy to read |
| **Supabase** | Database, authentication, and security rules |
| **supabase-js v2** | Official Supabase library, loaded via CDN |

**No installs required.** No build step, no `npm install`, no bundler. Just open it in a browser.

---

## Running It Locally

### Requirements

- A [Supabase](https://supabase.com) account 
- Node.js (optional, only if you want to use `npx serve`)

### Steps

**1. Download / clone this project**, then open the folder.

**2. Set up Supabase** (see the [Database Setup](#database-setup) section below).

**3. Fill in your credentials** in `js/config.js`:

```js
window.SUPABASE_URL = 'https://<project-ref>.supabase.co';
window.SUPABASE_ANON_KEY = '<anon-key>';
```

**4. Run a local server** (pick one):

```bash
npx serve .
```

Or open `index.html` directly in a browser (Live Server in VS Code works too).

**5. Open the pages:**

- Public → `http://localhost:3000/`
- Admin → `http://localhost:3000/admin/login.html`

---

## Database Setup

All database setup is done in **Supabase Dashboard → SQL Editor**. Run these files **in order, one time only**:

| Order | File | Purpose |
|---|---|---|
| 1 | `supabase/schema.sql` | Creates the `profiles` & `events` tables, triggers, and RLS policies |
| 2 | `supabase/seed.sql` | Inserts 6 sample events (3 upcoming, 3 past) — safe to re-run, won't duplicate |
| 3 | `supabase/storage.sql` | Creates the `event-images` storage bucket for image uploads |

### Table Overview

**`profiles`** — admin data:

- `id`, `username`, `role`, `created_at`
- RLS: public read, owner-only write

**`events`** — event data:

- `id`, `title`, `description`, `date`, `time`, `location`, `status`, `image_url`, `created_at`, `updated_at`
- `status` must be one of: `upcoming`, `ongoing`, `past`
- RLS: public read, admin-only write

---

## Creating an Admin Account

For security reasons, **there is no built-in demo account**. Each environment must create its own.

**1. Create a user in Supabase:**

- Go to **Supabase Dashboard → Authentication → Users → Add User**
- Enter an email & password (minimum 6 characters)
- If email confirmation is enabled, confirm the email first

**2. Register the user as admin** — run in the SQL Editor:

```sql
insert into public.profiles (id, username, role)
select id, 'admin', 'admin' from auth.users limit 1;
```

**3. Log in** at `admin/login.html` with that email & password.

---

## Project Structure

```
├── index.html              Home page (public)
├── about.html              About page (public)
├── events.html             Events list page (public)
├── event-detail.html       Event detail page (public)
│
├── admin/                  Admin-only pages
│   ├── login.html
│   ├── dashboard.html
│   └── event-form.html
│
├── css/
│   └── style.css           All styling (dark glassmorphism, navy-teal)
│
├── js/
│   ├── config.js           Supabase credentials
│   ├── api.js              Supabase wrapper (auth + CRUD)
│   ├── shared.js           Shared components (navbar, footer, toast, carousel)
│   └── pages/              Per-page controllers
│
└── supabase/
    ├── schema.sql          Database schema + RLS
    ├── seed.sql            Sample data
    └── storage.sql         Image bucket setup
```

---

## Environment Configuration

There is a **`.env.example`** file as a template (no sensitive data):

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

> **Important:** since this is a static frontend with no build step, `.env` variables are **not read automatically at runtime**. You still need to paste the values manually into `js/config.js`. The `.env.example` file is only for documentation.

**Things to remember:**

- Use the **anon / publishable key**, safe for frontends, access is restricted by RLS
- **Never** use the `service_role` key in the frontend

---

## Known Limitations

Things that are **not yet implemented**:

- **No backend pagination** — all events are fetched at once, not ideal for large datasets
- **Home cache of 5 minutes** — data may appear slightly stale after an admin change
- **Hardcoded timezone** — time is displayed as `WIB` without converting to the visitor's timezone
- **No automated tests** — `test.sql` and `tes.js` are still empty stubs
- **No CI/CD**
- **RLS intentionally allows public read** — do not store sensitive data in the `events` table

---

## Possible Future Improvements

Ideas for extending the project:

- Event search (already in UI, can be strengthened)
- Upcoming/Past filtering (already there, can add sorting)
- Server-side pagination (Supabase `.range()`)
- Image upload (already there, can add compression/crop)
- Improved authentication handling (session refresh, guards, etc.)
- Reusable API/service layer (centralize all Supabase calls)

---

## License & Contribution

This project was built for **IT Probation Phase 2026** at IEEE ITB Student Branch.