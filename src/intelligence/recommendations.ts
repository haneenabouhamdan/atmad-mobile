import type { Article } from "../data/types";
import { mockBrands, mockDeals, mockInfluencers } from "../data/mock";
import type { Tier } from "./tierConfig";

export interface DealSummary {
  code: string;
  brand: string;
  category: string;
  points: number;
}

export interface HomeRecommendations {
  /** Index into `articles` for hero emphasis (v17-style). */
  featuredArticleIndex: number;
  suggestedBrandId: string;
  suggestedDealCode: string;
  suggestedInfluencerSlug: string;
  effectiveCategory: string;
}

const DIVERSIFY_POOL = ["Tech", "Finance", "Travel", "Automotive"] as const;

function topCategory(clickScores: Record<string, number>): string {
  const sorted = Object.entries(clickScores).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "Fashion";
}

function tierMinDealPoints(tier: Tier): number {
  return tier.id === "noir-elite" || tier.id === "noir-prime" ? 300 : 0;
}

function dealsFromMocks(): DealSummary[] {
  return mockDeals.map((d) => ({
    code: d.code,
    brand: d.brand,
    category: String(d.category),
    points: d.points ?? 0,
  }));
}

/**
 * Session-scoped suggestions from category clicks + brand visits (v17 §9.2, simplified: no activity log yet).
 * Pass `dynamicDeals` from Supabase `codes_public` when available; otherwise uses mock catalogue.
 */
export function computeHomeRecommendations(
  categoryClicks: Record<string, number>,
  brandVisits: Record<string, number>,
  lastBrandId: string | null,
  _userPoints: number,
  tier: Tier,
  articles: Article[],
  dynamicDeals?: DealSummary[],
): HomeRecommendations {
  const dealPool =
    dynamicDeals && dynamicDeals.length > 0 ? dynamicDeals : dealsFromMocks();

  const preferred = topCategory(categoryClicks);
  const isOverexposed = Object.values(brandVisits).some((v) => v >= 3);
  const effectiveCategory = isOverexposed
    ? (DIVERSIFY_POOL.find((c) => c !== preferred) ?? preferred)
    : preferred;

  const minPts = tierMinDealPoints(tier);
  const eligibleDeals = dealPool.filter((d) => d.points >= minPts);
  const categoryDeals = eligibleDeals.filter(
    (d) => String(d.category) === effectiveCategory,
  );
  const deal = categoryDeals[0] ?? eligibleDeals[0] ?? dealPool[0];
  const suggestedDealCode = deal?.code ?? dealPool[0]?.code ?? "";

  const categoryBrands = mockBrands.filter(
    (b) => String(b.category) === effectiveCategory,
  );
  const freshBrands = isOverexposed
    ? categoryBrands.filter((b) => b.id !== lastBrandId)
    : categoryBrands;
  const brand = freshBrands[0] ?? mockBrands[0];
  const suggestedBrandId = brand?.id ?? "maison-noir";

  const influencers = Object.values(mockInfluencers);
  const inf =
    influencers.find((i) =>
      i.collabs.some(
        (c) =>
          mockBrands.find((b) => b.id === c.brandSlug)?.category === effectiveCategory,
      ),
    ) ?? influencers[0];
  const suggestedInfluencerSlug = inf?.slug ?? "elena-vasquez";

  let featuredArticleIndex = 0;
  if (articles.length > 0) {
    if (preferred === "Fashion") featuredArticleIndex = 0;
    else if (preferred === "Finance") featuredArticleIndex = Math.min(4, articles.length - 1);
    else featuredArticleIndex = Math.min(2, articles.length - 1);
    const day = Math.floor(Date.now() / 86400000) % articles.length;
    featuredArticleIndex = (featuredArticleIndex + day) % articles.length;
  }

  return {
    featuredArticleIndex,
    suggestedBrandId,
    suggestedDealCode,
    suggestedInfluencerSlug,
    effectiveCategory,
  };
}
