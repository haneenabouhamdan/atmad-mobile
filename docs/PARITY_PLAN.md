# ATMAD Mobile — Parity with v17 Feature Spec

This document tracks alignment between **atmad-mobile** (Expo + Supabase + Sanity) and the **ATMAD Feature Documentation v17** (React/Vite prototype: Zustand-only, static coupons). The prototype is described in `page_1.html` and the Skywork deployment; **production** uses a real backend—do not remove Supabase/Sanity when porting behaviors.

## Principles

1. **Server truth** for auth, profiles, codes, redemptions, points; add client layers (recommendations, banners, streaks) with optional sync to **`profiles.engagement_state`** (JSON) so home/Explore signals survive reinstalls without minting points.
2. **Screen parity** can ship before **engine parity** (full Zustand-style intelligence).
3. **Avoid double bookkeeping** for tier/points without a defined sync rule.

---

## Phase 0 — Inventory

- [ ] Map each v17 § section to a screen file (done / partial / missing).
- [x] Magazine engagement event names: `article_read`, `article_engaged` (`src/data/engagementEvents.ts`, RPC `record_article_engagement`).

---

## Phase 1 — Navigation & hubs (shipped in repo)

- [x] Home stack: `Notifications`, `Identity` → real screens (not placeholders).
- [x] Explore stack: `Brand`, `Influencer`, `Lifestyle`, `Automotive` → real screens.
- [x] Wallet stack: `InStore` → `InStoreScreen`.
- [x] Profile: **Tools Hub** screen (v17 §7.3 clusters) + menu entry.

---

## Phase 2 — Home Intelligence (v17 §3.1, §9.2)

- [x] Hero + featured article index from recommendation engine (session clicks + points tier).
- [x] Affinity label from `categoryClicks` / `affinityCategory` (Explore “Continue” on categories updates store).
- [x] `computeHomeRecommendations` (brand / deal code / influencer slug); tier-based min points for deals.
- [x] `touchStreak` on Home focus + persistence via Zustand + MMKV.
- [x] Quick access: Vault, Alerts (notifications), In-store, Wallet, Scan; top bell + identity shortcuts.
- [x] Magazine feed ribbon: “From voices you follow” when influencer slugs followed (persisted).
- [x] **Supabase-backed deals**: `codes_public` drives `fetchDealSummariesForHome` → `computeHomeRecommendations` when configured; migrations expand the view with `deal_category` / `affiliate_url` from `codes.metadata`, then set `security_invoker = false` + `GRANT SELECT` so the client can read the view while `codes` stays admin-only (`20260501_001`, `20260501_002`).
- [x] **Engagement sync**: debounced `profiles.engagement_state` upsert when session exists (`EngagementSync`).
- [ ] Full activity-log–driven category scores (`deal_saved`, …) — later.

---

## Phase 3 — Magazine feed (v17 §3.3)

- [x] `article_read` / `article_engaged` with client debounce + scroll depth; Supabase RPC `record_article_engagement` → `profiles.points` + `transactions` (`reason = editorial`, `ref_id` = engagement row). Dedupe: one award per (user, article, kind) per UTC day (`article_engagements`). Migration: `20260502_001_article_engagement.sql`.
- [x] “From voices you follow”: persisted slugs in `engagement_state` + feed sort when `article.influencerSlug` matches; Sanity GROQ `influencer->slug.current` (optional `influencer` reference on `article` in Studio).

---

## Phase 4 — Deal activation (v17 §4.1)

- [x] Unlock → reveal → copy → open partner URL (`affiliate_url`); return-from-browser modal nudge; inline copy of Save vs Redeem (`DealActivationScreen`).
- [x] Local **Save for later** bookmarks (`savedDealsStore` + Wallet chips); **Redeem for points** = server `redeemCode`.

---

## Phase 5 — Coupon vault (v17 §4.2)

- [x] Member catalogue from Supabase `codes_public` (or mocks); scroll-gated teaser rows; codes only on deal screen.
- [ ] Full Sanity-driven vault + richer scroll gate / paywall (when product defines it).

---

## Phase 6 — Wallet cockpit (v17 §4.3)

- [x] Tier card + progress bar from `tierConfig` + server `profiles.tier` label; visit streak dots; saved offers; redeemed list; **Recent points** from `transactions`.

---

## Phase 7 — Notifications engine (v17 §6.2, §9.3)

- [x] Ephemeral in-app banner (~4.5s auto-dismiss + tap dismiss, `notificationBannerStore`); streak seed on Home; Deal screen uses same for copy/save feedback.
- [ ] Full trigger map, seeds inventory, push parity (when backend exists).

---

## Phase 8 — Mind Lounge & Lifestyle (v17 §3.5, §6.1)

- [ ] Games + `mindlounge_complete` → server points + deep link to deal (CMS slug).

---

## Phase 9 — Creator & advertiser (v17 §7.1–7.2)

- [ ] Creator hub (external Studio + in-app briefs).
- [ ] Advertiser: extend **My Leads** + real KPIs when data exists.

---

## Phase 10 — Utilities (v17 §8.x)

- [ ] Compare / reviews from Sanity or catalog, not only hardcoded mock.
- [ ] Referral wired to Supabase when schema exists.

---

## References

- v17 doc: local `page_1.html` (feature copy, flows, Zustand schemas).
- Backend migrations & CMS: sister repo `luxury_magazine_app/backend/supabase/migrations/` (apply in timestamp order; engagement + public codes: `20260501_001_engagement_state_codes_public.sql`, then `20260501_002_codes_public_invoker_grant.sql`, then `20260502_001_article_engagement.sql` for magazine points).
