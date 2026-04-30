-- Destructive: removes Authentication users so you can retry sign-up from scratch.
-- Run ONLY on a disposable dev Supabase project. Back up data before running.
--
-- Option A — Supabase Dashboard → Authentication → Users → delete rows.
--
-- Option B — SQL Editor:

DELETE FROM public.profiles;

DELETE FROM auth.users;
