# CLAUDE.md — Edit History

This file tracks significant edits made to the project by Claude Code.

---

## Initial Build — 2026-03-02

**Prompt:** Full Astro + React + Supabase investor portal MVP for Hengistbury Investment Partners.

### Files Created

#### Configuration
- `package.json` — Astro 5, React 19, @supabase/ssr, TipTap, @astrojs/cloudflare dependencies
- `astro.config.mjs` — Hybrid output mode, Cloudflare adapter, React integration
- `tsconfig.json` — Strict mode, React JSX, path aliases
- `.env.example` — Supabase URL and anon key placeholders
- `.gitignore` — node_modules, dist, .env, .wrangler, .astro

#### Database
- `supabase-setup.sql` — Full schema with:
  - `profiles` table (id, email, full_name, role, created_at)
  - `letters` table (id, title, date, description, file_url, status, created_at)
  - `posts` table (id, title, content, excerpt, status, created_at)
  - Row Level Security policies for all tables
  - Supabase Storage `documents` bucket + storage policies
  - Trigger to auto-create profiles on user signup
  - Seed data (one sample letter, one sample post)
  - Comments for creating demo users

#### Auth / Middleware
- `src/middleware.ts` — Auth guard intercepting /portal/* and /admin/* routes
- `src/lib/supabase.ts` — Browser Supabase client + TypeScript types (Profile, Letter, Post)
- `src/lib/supabase-server.ts` — SSR Supabase client using @supabase/ssr + cookie helpers

#### Layouts
- `src/layouts/BaseLayout.astro` — Public site shell: Google Fonts, CSS variables, Nav + Footer slots
- `src/layouts/DashboardLayout.astro` — Portal/admin shell: sticky sidebar with role-based nav

#### Components (Astro)
- `src/components/Nav.astro` — Sticky navy nav with mobile hamburger, Investor Login button
- `src/components/Footer.astro` — Three-column footer with firm details, nav links, FCA statement, dynamic copyright year

#### Components (React Islands)
- `src/components/ContactForm.tsx` — Controlled form with client-side submit (ready to wire to email API)
- `src/components/LoginForm.tsx` — Supabase email/password auth; redirects to /admin (admin role) or /portal (investor)
- `src/components/InvestorDashboard.tsx` — Shows latest published letter + 3 most recent posts
- `src/components/LettersArchive.tsx` — Chronological list of published letters with PDF download links
- `src/components/NewsPage.tsx` — Post feed with click-to-read inline article view
- `src/components/AdminOverview.tsx` — Stats grid (letter/post/user counts) + quick action buttons
- `src/components/AdminLetters.tsx` — Upload PDF to Supabase Storage, set metadata, publish/draft toggle, delete
- `src/components/AdminPosts.tsx` — TipTap rich text editor (StarterKit + Link), draft/publish workflow, edit/delete
- `src/components/AdminUsers.tsx` — Invite investors by email (Supabase signUp), view user table with roles

#### Public Pages (Astro, prerendered)
- `src/pages/index.astro` — Hero, info strip (FCA/Mayfair/Portal), about teaser, disclosures grid, CTA
- `src/pages/about.astro` — Firm bio, details card sidebar (address, tel, email, partnership no)
- `src/pages/contact.astro` — Contact details + ContactForm island
- `src/pages/disclosures/index.astro` — Hub listing all 5 disclosure links
- `src/pages/disclosures/pillar-3.astro` — Full Pillar 3 capital adequacy disclosure
- `src/pages/disclosures/remuneration.astro` — Remuneration policy (MIFIDPRU)
- `src/pages/disclosures/stewardship-code.astro` — FRC UK Stewardship Code 2020 statement
- `src/pages/disclosures/privacy-notice.astro` — UK GDPR Privacy Notice
- `src/pages/disclosures/modern-slavery.astro` — Modern Slavery Act 2015 statement

#### Portal Pages (Astro, SSR)
- `src/pages/portal/login.astro` — Split-layout login page with LoginForm island
- `src/pages/portal/index.astro` — InvestorDashboard island
- `src/pages/portal/letters.astro` — LettersArchive island
- `src/pages/portal/news.astro` — NewsPage island
- `src/pages/portal/sign-out.astro` — Server-side sign out handler

#### Admin Pages (Astro, SSR)
- `src/pages/admin/index.astro` — AdminOverview island
- `src/pages/admin/letters.astro` — AdminLetters island
- `src/pages/admin/posts.astro` — AdminPosts island (TipTap editor)
- `src/pages/admin/users.astro` — AdminUsers island

#### Documentation
- `README.md` — Full setup guide, project structure, demo walkthrough, deployment steps
- `CLAUDE.md` — This file

### Architecture Decisions

1. **Hybrid rendering** (`output: 'hybrid'` in astro.config.mjs): public pages are static; portal/admin pages are SSR for server-side auth.
2. **Middleware auth guard** (`src/middleware.ts`): intercepts all protected routes before rendering; redirects unauthenticated users to login and non-admins away from /admin.
3. **React islands pattern**: `client:load` only on interactive components (forms, dashboards, editors). Static disclosure pages have zero JS.
4. **@supabase/ssr** for server-side session management via cookies, compatible with Cloudflare Workers runtime.
5. **TipTap** for the admin post editor — StarterKit provides headings, bold/italic, lists, blockquotes, undo/redo.
6. **No Tailwind** — all styling via scoped CSS and CSS custom properties (--navy, --gold, --font-heading, etc.) defined globally in BaseLayout.
7. **Supabase Storage** for PDF uploads to the `documents` bucket; presigned URLs served directly to authenticated users.
8. **RLS everywhere** — all tables use Row Level Security; investors see only published content, admins have full CRUD.
