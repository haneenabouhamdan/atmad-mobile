-- Same as luxury_magazine_app …/20260430_003_profiles_user_role_check_atmad.sql — run in Supabase SQL if needed.

alter table public.profiles drop constraint if exists profiles_user_role_check;

update public.profiles set user_role = 'member'
  where user_role = 'consumer';

update public.profiles set user_role = 'content_creator'
  where user_role = 'influencer';

update public.profiles set user_role = 'publisher'
  where user_role = 'affiliate';

update public.profiles set user_role = 'member'
  where user_role is not null
    and user_role not in ('member','content_creator','publisher','advertiser','admin');

alter table public.profiles
  add constraint profiles_user_role_check
  check (user_role in ('member','content_creator','publisher','advertiser','admin'));

alter table public.profiles alter column user_role set default 'member';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone_e164, full_name, user_role)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
