-- Tuparit 2026 RSVP table. Run once in Supabase Dashboard → SQL Editor.

create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  email       text check (email is null or char_length(email) <= 200),
  hype        smallint check (hype between 1 and 100),
  created_at  timestamptz not null default now()
);

alter table public.rsvps enable row level security;

-- Anyone with the page can RSVP and see who's coming…
drop policy if exists "anon can rsvp" on public.rsvps;
create policy "anon can rsvp" on public.rsvps
  for insert to anon with check (true);

drop policy if exists "anon can read guest list" on public.rsvps;
create policy "anon can read guest list" on public.rsvps
  for select to anon using (true);

-- …but only the public columns. Emails are visible only in the dashboard.
revoke all on public.rsvps from anon;
grant insert (name, email, hype) on public.rsvps to anon;
grant select (id, name, created_at) on public.rsvps to anon;
