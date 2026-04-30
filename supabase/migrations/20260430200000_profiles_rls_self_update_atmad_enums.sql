-- ============================================================================
-- Align profiles "self update" RLS with ATMAD app enums.
-- ============================================================================
-- Deployments migrated from legacy policies still had:
--   user_role in ('consumer','influencer','affiliate','advertiser')
-- The RN app onboarding sends:
--   member | content_creator | publisher | advertiser
-- so WITH CHECK failed with: "new row violates row-level security policy".
-- ============================================================================

drop policy if exists "self update" on public.profiles;

create policy "self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and user_role in ('member','content_creator','publisher','advertiser')
    and points = (select p.points from public.profiles p where p.id = auth.uid())
    and tier   = (select p.tier   from public.profiles p where p.id = auth.uid())
  );
