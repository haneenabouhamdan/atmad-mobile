-- Treat `publisher` and `content_creator` as one role (`content_creator` only).

update public.profiles
set user_role = 'content_creator'
where user_role = 'publisher';

alter table public.profiles drop constraint if exists profiles_user_role_check;

alter table public.profiles
  add constraint profiles_user_role_check
  check (user_role in ('member','content_creator','advertiser','admin'));

drop policy if exists "self insert" on public.profiles;

create policy "self insert"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and user_role in ('member', 'content_creator', 'advertiser')
  );

drop policy if exists "self update" on public.profiles;

create policy "self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and user_role in ('member', 'content_creator', 'advertiser')
    and points = (select p.points from public.profiles p where p.id = auth.uid())
    and tier   = (select p.tier   from public.profiles p where p.id = auth.uid())
  );
