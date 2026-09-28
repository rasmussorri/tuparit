# Tuparit 2026

Goofy ahh housewarming invite. Vite + vanilla JS.

```bash
npm install
npm run dev
```

## Guest list backend (Supabase)

1. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon key
   (Project Settings → API). On Vercel, add the same two variables under
   Project → Settings → Environment Variables and redeploy.

Anonymous visitors can RSVP and read names only; emails and hype levels are
visible only in the Supabase dashboard. Without the env vars the list falls back
to localStorage (this browser only).
