-- See luxury_magazine_app backend migrations for rationale.
-- Run in Supabase SQL editor if migrations are applied manually.

drop policy if exists "self insert" on public.profiles;

create policy "self insert"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and user_role in ('member', 'content_creator', 'publisher', 'advertiser')
  );
