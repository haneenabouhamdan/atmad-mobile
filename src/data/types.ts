export type DealCategory =
  | "Fashion" | "Luxury" | "Tech" | "Travel" | "Automotive" | "Finance" | "F&B" | "Beauty";

export interface Deal {
  id: string;
  brand: string;
  description: string;
  code: string;
  discount: string;
  points: number;
  expiry: string;
  category: DealCategory | string;
  terms: string;
  /** Partner checkout URL from `codes.metadata.affiliate_url` when configured. */
  affiliateUrl?: string;
}

export interface Article {
  id: string;
  type: "editorial" | "deal_embedded" | "spread";
  coverImage: string;
  category: string;
  headline: string;
  subheadline?: string;
  body: string;
  author: string;
  readTime?: string;
  /** Sanity `influencer` reference — used to prioritize the feed for followed voices. */
  influencerSlug?: string;
  deal?: Deal;
  /** Optional listing id deep-linked from the cover image (Sanity listing._id). */
  linkedListingId?: string;
}

export interface WalletCard {
  id: string;
  type: "loyalty" | "deal" | "offer";
  title: string;
  subtitle: string;
  points?: number;
  code?: string;
  validUntil: string;
  brand: string;
}

export interface Brand {
  id: string;
  name: string;
  category: DealCategory | string;
  tagline: string;
  logoUrl?: string;
  campaignImages?: string[];
}

/** Sanity `influencer` (and mock) — cover feature + videos. */
export interface Influencer {
  slug: string;
  name: string;
  role: string;
  imageUrl: string;
  quote: string;
  subQuote: string;
  issues: number;
  points: number;
  featureHeadline: string;
  featurePreview: string;
  collabs: { brand: string; note: string; brandSlug?: string }[];
  videos: {
    title: string;
    type: string;
    duration?: string;
    linkedCouponCode?: string;
    thumbnailUrl?: string;
  }[];
}
