import type { Article, Brand, Deal, WalletCard } from "./types";

/**
 * Fallback mock data shown when Sanity is not yet configured.
 * Mirrors the original web app's content for visual parity.
 */

export const mockArticles: Article[] = [
  {
    id: "1",
    type: "editorial",
    coverImage: "https://images.unsplash.com/photo-1618362429894-235528bbb226?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "THE COVER STORY",
    headline: "The Architecture of Influence",
    subheadline: "How silence became the loudest statement in modern luxury",
    body: "In a world saturated with noise, the most powerful influencers have mastered the art of restraint. The new luxury is not about visibility — it is about selectivity. Those who curate rather than accumulate define the new aesthetic order.",
    author: "ELENA VASQUEZ",
    readTime: "6 MIN READ",
    deal: {
      id: "d1",
      brand: "MAISON NOIR",
      description: "Private access to the Obsidian Collection",
      code: "ATMAD-NOIR-2026",
      discount: "First Access + 20% Reserved",
      points: 350,
      expiry: "Valid through April 2026",
      category: "Fashion",
      terms: "Exclusive to Obsidian Tier members. One use per account.",
    },
  },
  {
    id: "2",
    type: "editorial",
    coverImage: "https://images.unsplash.com/photo-1692611894076-9f8aac7b1b4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "BEAUTY PHILOSOPHY",
    headline: "The New Language of Skin",
    subheadline: "Beyond surface — the ritual of conscious luxury",
    body: "The most sophisticated beauty routines are built not around products, but around philosophy. This season the conversation shifts from coverage to revelation.",
    author: "MARGAUX DELACROIX",
    readTime: "4 MIN READ",
    deal: {
      id: "d2",
      brand: "LUMIÈRE LABS",
      description: "Complimentary serum with any consultation",
      code: "LUM-PRIV-9201",
      discount: "Complimentary Serum (€240 value)",
      points: 200,
      expiry: "Valid through May 2026",
      category: "Beauty",
      terms: "Available in select boutiques. Must present ATMAD code.",
    },
  },
  {
    id: "3",
    type: "spread",
    coverImage: "https://images.unsplash.com/photo-1701519664307-a402295fc7c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "CULTURE",
    headline: "Silence as Spectacle",
    subheadline: "The cultural moment where less became everything",
    body: "When Valentina Cruz walked the Marais last September in nothing but a single white dress and no accessories, the photograph became one of the most shared images of the year.",
    author: "THEO NAKAMURA",
    readTime: "5 MIN READ",
  },
  {
    id: "4",
    type: "editorial",
    coverImage: "https://images.unsplash.com/photo-1717764488252-71702b7acf7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "FASHION INTELLIGENCE",
    headline: "Dressed in Conviction",
    subheadline: "The women who stopped asking permission",
    body: "For a generation raised on algorithmic validation, true confidence has become the rarest luxury. These seven women discuss the moment they stopped dressing for the room and started dressing for the archive.",
    author: "INES BEAUMONT",
    readTime: "7 MIN READ",
    deal: {
      id: "d3",
      brand: "ARCHIVE ATELIER",
      description: "Personal styling consultation — private session",
      code: "ARCH-VIP-0344",
      discount: "Complimentary 90-min Styling Session",
      points: 500,
      expiry: "Valid through June 2026",
      category: "Fashion",
      terms: "By appointment only. Subject to availability in your city.",
    },
  },
  {
    id: "5",
    type: "editorial",
    coverImage: "https://images.unsplash.com/photo-1630243237838-a44b1a87eb95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    category: "PHILOSOPHY",
    headline: "Owning Nothing, Having Everything",
    subheadline: "The post-ownership luxury movement",
    body: "The most forward-thinking collectors no longer buy to possess. They curate access.",
    author: "CYRUS VALE",
    readTime: "8 MIN READ",
  },
];

export const mockDeals: Deal[] = mockArticles
  .map((a) => a.deal)
  .filter((d): d is Deal => Boolean(d));

export const mockBrands: Brand[] = [
  {
    id: "maison-noir",
    name: "MAISON NOIR",
    category: "Fashion",
    tagline: "The new theater of luxury",
    campaignImages: [
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=900",
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=900",
    ],
  },
  {
    id: "archive-atelier",
    name: "ARCHIVE ATELIER",
    category: "Fashion",
    tagline: "Wardrobes worth keeping",
    campaignImages: [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900",
    ],
  },
  {
    id: "lumiere-labs",
    name: "LUMIÈRE LABS",
    category: "Beauty",
    tagline: "Conscious skin, considered ritual",
    campaignImages: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900",
    ],
  },
];

export const mockWallet: WalletCard[] = [
  {
    id: "w1",
    type: "loyalty",
    title: "OBSIDIAN TIER",
    subtitle: "ATMAD Member",
    points: 0,
    validUntil: "Lifetime",
    brand: "ATMAD",
  },
];

export const COVER = {
  image:
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200",
  issueLabel: "Issue 01",
  headline: "The Architecture of Influence",
  subheadline:
    "Silence, restraint, and the new theater of luxury — curated for the obsidian few.",
};
