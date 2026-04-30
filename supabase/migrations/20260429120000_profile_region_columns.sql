-- Apply in Supabase (Dashboard SQL editor or CLI) so `profiles` carries
-- market / personalization fields used by atmad-mobile.

alter table public.profiles add column if not exists country_iso text;
alter table public.profiles add column if not exists locale text;
alter table public.profiles add column if not exists travel_mode text default 'home';

comment on column public.profiles.country_iso is 'ISO 3166-1 alpha-2 (e.g. AE, US)';
comment on column public.profiles.locale is 'BCP-47 locale tag (e.g. en, ar)';
comment on column public.profiles.travel_mode is 'home | travel';
