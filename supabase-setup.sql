-- ============================================================
-- Hengistbury Partners Portal — Supabase Setup
-- Run this in the Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

-- Profiles (mirrors auth.users, stores role)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'investor' check (role in ('investor', 'admin')),
  created_at  timestamptz not null default now()
);

-- Letters (quarterly investor letters — PDF uploads)
create table if not exists public.letters (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  date        date not null,
  description text,
  file_url    text,
  status      text not null default 'draft' check (status in ('draft', 'published')),
  created_at  timestamptz not null default now()
);

-- Posts (news / commentary)
create table if not exists public.posts (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  content     text,           -- rich HTML from TipTap
  excerpt     text,
  status      text not null default 'draft' check (status in ('draft', 'published')),
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- STORAGE BUCKET
-- ------------------------------------------------------------
-- Creates the 'documents' bucket for PDF uploads.
-- Run this after the tables above.
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------

-- Profiles
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can update all profiles
create policy "Admins can update profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can insert profiles (for invite flow)
create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Letters
alter table public.letters enable row level security;

-- Authenticated users can read published letters
create policy "Investors can read published letters"
  on public.letters for select
  using (auth.role() = 'authenticated' and status = 'published');

-- Admins can read all letters (including drafts)
create policy "Admins can read all letters"
  on public.letters for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can insert letters
create policy "Admins can insert letters"
  on public.letters for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can update letters
create policy "Admins can update letters"
  on public.letters for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can delete letters
create policy "Admins can delete letters"
  on public.letters for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Posts
alter table public.posts enable row level security;

-- Authenticated users can read published posts
create policy "Investors can read published posts"
  on public.posts for select
  using (auth.role() = 'authenticated' and status = 'published');

-- Admins can read all posts
create policy "Admins can read all posts"
  on public.posts for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can insert posts
create policy "Admins can insert posts"
  on public.posts for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can update posts
create policy "Admins can update posts"
  on public.posts for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can delete posts
create policy "Admins can delete posts"
  on public.posts for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Storage policies for 'documents' bucket
create policy "Authenticated users can read documents"
  on storage.objects for select
  using (auth.role() = 'authenticated' and bucket_id = 'documents');

create policy "Admins can upload documents"
  on storage.objects for insert
  with check (
    auth.role() = 'authenticated'
    and bucket_id = 'documents'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can delete documents"
  on storage.objects for delete
  using (
    auth.role() = 'authenticated'
    and bucket_id = 'documents'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- TRIGGER: auto-create profile on signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'investor')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- SEED DATA
-- ------------------------------------------------------------

-- Sample quarterly letter
insert into public.letters (title, date, description, file_url, status)
values (
  'Q3 2024 Investor Letter',
  '2024-10-15',
  'A review of portfolio performance during Q3 2024, including commentary on macro conditions, positioning updates, and the outlook for year-end.',
  null,  -- replace with actual Supabase Storage URL after uploading a PDF
  'published'
);

-- Sample news post
insert into public.posts (title, content, excerpt, status)
values (
  'Navigating Elevated Rate Environments',
  '<h2>Market Commentary</h2><p>As central banks maintain restrictive monetary policy into 2025, we continue to see opportunity in select credit markets where spreads adequately compensate investors for duration and default risk. Our alternative strategies remain well-positioned to benefit from continued volatility.</p><p>We have been selectively adding exposure to event-driven situations where the risk/reward profile is compelling independent of the broader macro backdrop. The team will publish a more detailed note in the coming weeks.</p><h2>Portfolio Update</h2><p>The portfolio ended the period with net exposure broadly in line with our long-term target range. Gross exposure was modestly reduced given uncertainty around near-term catalysts.</p>',
  'Central banks maintaining restrictive policy into 2025 — our positioning and near-term outlook.',
  'published'
);

-- ------------------------------------------------------------
-- DEMO USERS
-- ------------------------------------------------------------
-- Create demo users in Supabase Dashboard > Authentication > Users:
--
-- Admin user:
--   Email:    admin@hengistburypartners.com
--   Password: (set a strong password)
--   After creating, run:
--     update public.profiles set role = 'admin'
--     where email = 'admin@hengistburypartners.com';
--
-- Investor user:
--   Email:    investor@example.com
--   Password: (set a strong password)
--   Role defaults to 'investor' via the trigger — no extra step needed.
--
-- Note: The trigger (on_auth_user_created) automatically creates a profile
-- row for every new user. You only need to manually set role='admin' for
-- admin accounts, since the default role is 'investor'.
-- ------------------------------------------------------------
