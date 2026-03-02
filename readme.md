# Hengistbury Partners Portal

Investor portal MVP for **Hengistbury Investment Partners** — an FCA-regulated alternative investment firm based in Mayfair, London.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 5 (hybrid SSR) |
| UI Islands | React 19 |
| Auth + Database | Supabase (PostgreSQL + Auth + Storage) |
| Rich Text Editor | TipTap |
| Deployment | Cloudflare Pages |
| Fonts | EB Garamond + DM Sans |
| Styling | Scoped CSS (no Tailwind) |

---

## Project Structure

```
src/
├── components/          # React islands and Astro components
│   ├── Nav.astro
│   ├── Footer.astro
│   ├── ContactForm.tsx
│   ├── LoginForm.tsx
│   ├── InvestorDashboard.tsx
│   ├── LettersArchive.tsx
│   ├── NewsPage.tsx
│   ├── AdminOverview.tsx
│   ├── AdminLetters.tsx
│   ├── AdminPosts.tsx   # TipTap editor
│   └── AdminUsers.tsx
├── layouts/
│   ├── BaseLayout.astro      # Public site (nav + footer)
│   └── DashboardLayout.astro # Portal/admin (sidebar)
├── lib/
│   ├── supabase.ts           # Browser client + TypeScript types
│   └── supabase-server.ts    # Server client for SSR pages
├── middleware.ts              # Auth guard for /portal/* and /admin/*
└── pages/
    ├── index.astro            # Home
    ├── about.astro
    ├── contact.astro
    ├── disclosures/
    │   ├── index.astro        # Disclosures hub
    │   ├── pillar-3.astro
    │   ├── remuneration.astro
    │   ├── stewardship-code.astro
    │   ├── privacy-notice.astro
    │   └── modern-slavery.astro
    ├── portal/
    │   ├── login.astro
    │   ├── index.astro        # Investor dashboard
    │   ├── letters.astro
    │   ├── news.astro
    │   └── sign-out.astro
    └── admin/
        ├── index.astro        # Admin overview
        ├── letters.astro
        ├── posts.astro
        └── users.astro
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/modernwebarchitecture/hengistbury-partners-portal.git
cd hengistbury-partners-portal
npm install
```

### 2. Supabase project

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-setup.sql` — this creates:
   - `profiles`, `letters`, `posts` tables with RLS policies
   - `documents` storage bucket for PDF uploads
   - Trigger to auto-create a profile row on user signup
   - Sample seed data (one letter, one post)

### 3. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase project URL and anon key (found in **Settings → API**):

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Create demo users

In **Supabase Dashboard → Authentication → Users**, create:

| Email | Password | Post-setup |
|-------|----------|------------|
| `admin@hengistburypartners.com` | (choose) | Run SQL: `update public.profiles set role = 'admin' where email = 'admin@hengistburypartners.com';` |
| `investor@example.com` | (choose) | No extra step — role defaults to `investor` |

### 5. Run locally

```bash
npm run dev
```

Visit [http://localhost:4321](http://localhost:4321)

---

## Demo Walkthrough

### Public site
1. **Home** (`/`) — hero, info strip, about teaser, disclosures grid, CTA
2. **About** (`/about`) — firm bio + details card
3. **Disclosures** (`/disclosures`) — hub linking to 5 individual pages (each with full regulatory text)
4. **Contact** (`/contact`) — contact form (React island)

### Investor portal
1. Go to `/portal/login`
2. Sign in as `investor@example.com`
3. **Dashboard** (`/portal`) — latest letter + recent news
4. **Letters** (`/portal/letters`) — chronological archive with PDF links
5. **News** (`/portal/news`) — feed; click a post to read full content

### Admin portal
1. Sign out, then sign in as `admin@hengistburypartners.com`
2. **Overview** (`/admin`) — counts + quick action buttons
3. **Letters** (`/admin/letters`) — upload PDF, set title/date/description, publish/draft/delete
4. **Posts** (`/admin/posts`) — TipTap rich text editor, draft/publish workflow, edit/delete
5. **Users** (`/admin/users`) — invite new investors by email, view current user list

---

## Deployment (Cloudflare Pages)

1. Push to GitHub
2. In **Cloudflare Pages → Create application → Connect to Git**
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add environment variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

---

## Key Design Decisions

- **Hybrid rendering**: public pages are fully static (`export const prerender = true`); portal/admin pages are SSR (`prerender = false`) for server-side auth checking via middleware
- **Auth guard**: `src/middleware.ts` intercepts all `/portal/*` and `/admin/*` requests, checks the Supabase session, and redirects unauthenticated users to `/portal/login`
- **React islands**: interactive components (`client:load`) are used only where needed — login form, dashboards, admin CRUD, TipTap editor
- **No Tailwind**: all styles are scoped CSS with CSS custom properties for the design system
- **Storage**: PDFs are uploaded to the Supabase `documents` bucket; RLS restricts access to authenticated users; only admins can upload/delete

---

## Contact

Hengistbury Investment Partners LLP
First Floor, 34 Brook Street, London W1K 5DN
+44 20 7529 4646 · info@hengistburypartners.com · OC365747
