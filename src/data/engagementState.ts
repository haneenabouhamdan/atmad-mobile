/**
 * Canonical shape for `profiles.engagement_state` (Supabase jsonb) and local persisted cache.
 * Same keys in both places so the app can sync without transforms.
 */
export type EngagementStateBlob = {
  streakDays?: number;
  lastOpenDate?: string;
  affinityCategory?: string | null;
  categoryClicks?: Record<string, number>;
  brandVisits?: Record<string, number>;
  lastBrandId?: string | null;
  followedInfluencerSlugs?: string[];
};

/** Parse Supabase / API JSON into a partial patch for the home-intelligence store. */
export function parseEngagementBlob(raw: unknown): Partial<EngagementStateBlob> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const out: Partial<EngagementStateBlob> = {};

  if (typeof o.streakDays === "number" && o.streakDays >= 0) out.streakDays = o.streakDays;
  if (typeof o.lastOpenDate === "string") out.lastOpenDate = o.lastOpenDate;
  if (o.affinityCategory === null || typeof o.affinityCategory === "string") {
    out.affinityCategory = o.affinityCategory as string | null;
  }
  if (o.categoryClicks && typeof o.categoryClicks === "object" && !Array.isArray(o.categoryClicks)) {
    const cc: Record<string, number> = {};
    for (const [k, v] of Object.entries(o.categoryClicks as Record<string, unknown>)) {
      if (typeof v === "number" && v >= 0) cc[k] = v;
    }
    if (Object.keys(cc).length) out.categoryClicks = cc;
  }
  if (o.brandVisits && typeof o.brandVisits === "object" && !Array.isArray(o.brandVisits)) {
    const bv: Record<string, number> = {};
    for (const [k, v] of Object.entries(o.brandVisits as Record<string, unknown>)) {
      if (typeof v === "number" && v >= 0) bv[k] = v;
    }
    if (Object.keys(bv).length) out.brandVisits = bv;
  }
  if (o.lastBrandId === null || typeof o.lastBrandId === "string") {
    out.lastBrandId = o.lastBrandId as string | null;
  }
  if ("followedInfluencerSlugs" in o && Array.isArray(o.followedInfluencerSlugs)) {
    out.followedInfluencerSlugs = o.followedInfluencerSlugs.filter(
      (x): x is string => typeof x === "string",
    );
  }

  return out;
}

export function engagementBlobFromPersisted(s: {
  streakDays: number;
  lastOpenDate: string;
  affinityCategory: string | null;
  categoryClicks: Record<string, number>;
  brandVisits: Record<string, number>;
  lastBrandId: string | null;
  followedInfluencerSlugs: string[];
}): EngagementStateBlob {
  return {
    streakDays: s.streakDays,
    lastOpenDate: s.lastOpenDate,
    affinityCategory: s.affinityCategory,
    categoryClicks: s.categoryClicks,
    brandVisits: s.brandVisits,
    lastBrandId: s.lastBrandId,
    followedInfluencerSlugs: s.followedInfluencerSlugs,
  };
}
