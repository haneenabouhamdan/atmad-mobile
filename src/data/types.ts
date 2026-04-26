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
  deal?: Deal;
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
