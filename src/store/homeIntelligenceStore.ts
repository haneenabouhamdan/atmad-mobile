import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { EngagementStateBlob } from "../data/engagementState";
import { engagementBlobFromPersisted, parseEngagementBlob } from "../data/engagementState";

export interface HomeIntelPersisted {
  streakDays: number;
  lastOpenDate: string;
  affinityCategory: string | null;
  categoryClicks: Record<string, number>;
  brandVisits: Record<string, number>;
  lastBrandId: string | null;
  followedInfluencerSlugs: string[];
}

interface HomeIntelligenceState extends HomeIntelPersisted {
  touchStreak: () => void;
  recordCategoryClick: (category: string) => void;
  recordBrandVisit: (brandId: string, category: string) => void;
  recordInfluencerView: (_slug: string) => void;
  followInfluencer: (slug: string) => void;
  unfollowInfluencer: (slug: string) => void;
  isFollowing: (slug: string) => boolean;
  /** Merge server `profiles.engagement_state` after login (Supabase). */
  hydrateFromSupabase: (raw: unknown) => void;
  /** Snapshot for local persistence + Supabase upload. */
  toEngagementBlob: () => EngagementStateBlob;
}

function recomputeAffinity(clicks: Record<string, number>): string | null {
  const sorted = Object.entries(clicks).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function pickNewerOpenDate(current: string, incoming: string): string {
  return incoming >= current ? incoming : current;
}

export const useHomeIntelligenceStore = create<HomeIntelligenceState>()(
  persist(
    (set, get) => ({
      streakDays: 1,
      lastOpenDate: new Date().toISOString().slice(0, 10),
      affinityCategory: null,
      categoryClicks: {},
      brandVisits: {},
      lastBrandId: null,
      followedInfluencerSlugs: [],

      touchStreak: () =>
        set((s) => {
          const today = new Date().toISOString().slice(0, 10);
          if (s.lastOpenDate === today) return s;
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const nextStreak =
            s.lastOpenDate === yesterday ? s.streakDays + 1 : 1;
          return {
            ...s,
            streakDays: nextStreak,
            lastOpenDate: today,
          };
        }),

      recordCategoryClick: (category) =>
        set((s) => {
          const categoryClicks = {
            ...s.categoryClicks,
            [category]: (s.categoryClicks[category] ?? 0) + 1,
          };
          return {
            ...s,
            categoryClicks,
            affinityCategory: recomputeAffinity(categoryClicks),
          };
        }),

      recordBrandVisit: (brandId, category) =>
        set((s) => {
          const brandVisits = {
            ...s.brandVisits,
            [brandId]: (s.brandVisits[brandId] ?? 0) + 1,
          };
          const categoryClicks = {
            ...s.categoryClicks,
            [category]: (s.categoryClicks[category] ?? 0) + 1,
          };
          return {
            ...s,
            lastBrandId: brandId,
            brandVisits,
            categoryClicks,
            affinityCategory: recomputeAffinity(categoryClicks),
          };
        }),

      recordInfluencerView: () => {
        /* reserved for future session memory / analytics */
      },

      followInfluencer: (slug) =>
        set((s) => ({
          ...s,
          followedInfluencerSlugs: s.followedInfluencerSlugs.includes(slug)
            ? s.followedInfluencerSlugs
            : [...s.followedInfluencerSlugs, slug],
        })),

      unfollowInfluencer: (slug) =>
        set((s) => ({
          ...s,
          followedInfluencerSlugs: s.followedInfluencerSlugs.filter((x) => x !== slug),
        })),

      isFollowing: (slug) => get().followedInfluencerSlugs.includes(slug),

      hydrateFromSupabase: (raw) => {
        const patch = parseEngagementBlob(raw);
        if (Object.keys(patch).length === 0) return;
        set((s) => ({
          ...s,
          streakDays:
            patch.streakDays !== undefined
              ? Math.max(s.streakDays, patch.streakDays)
              : s.streakDays,
          lastOpenDate:
            patch.lastOpenDate !== undefined
              ? pickNewerOpenDate(s.lastOpenDate, patch.lastOpenDate)
              : s.lastOpenDate,
          affinityCategory:
            patch.affinityCategory !== undefined ? patch.affinityCategory : s.affinityCategory,
          categoryClicks: patch.categoryClicks
            ? { ...s.categoryClicks, ...patch.categoryClicks }
            : s.categoryClicks,
          brandVisits: patch.brandVisits
            ? { ...s.brandVisits, ...patch.brandVisits }
            : s.brandVisits,
          lastBrandId: patch.lastBrandId !== undefined ? patch.lastBrandId : s.lastBrandId,
          followedInfluencerSlugs:
            patch.followedInfluencerSlugs !== undefined
              ? patch.followedInfluencerSlugs
              : s.followedInfluencerSlugs,
        }));
      },

      toEngagementBlob: () =>
        engagementBlobFromPersisted({
          streakDays: get().streakDays,
          lastOpenDate: get().lastOpenDate,
          affinityCategory: get().affinityCategory,
          categoryClicks: get().categoryClicks,
          brandVisits: get().brandVisits,
          lastBrandId: get().lastBrandId,
          followedInfluencerSlugs: get().followedInfluencerSlugs,
        }),
    }),
    {
      name: "home-intelligence",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        streakDays: s.streakDays,
        lastOpenDate: s.lastOpenDate,
        affinityCategory: s.affinityCategory,
        categoryClicks: s.categoryClicks,
        brandVisits: s.brandVisits,
        lastBrandId: s.lastBrandId,
        followedInfluencerSlugs: s.followedInfluencerSlugs,
      }),
    },
  ),
);
