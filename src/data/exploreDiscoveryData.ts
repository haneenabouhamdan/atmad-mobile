import type { ListingCategory } from "../lib/listings";
import type { Article } from "./types";
import { mockArticles } from "./mock";

export type ExploreEntityAction =
  | { kind: "copy_code"; code: string }
  | { kind: "activate"; url: string }
  | { kind: "get_the_look" };

export type ExploreArticleCard = {
  id: string;
  headline: string;
  author: string;
  readTime: string;
  imageUrl: string;
  action: ExploreEntityAction;
};

function exploreActionForArticle(a: Article | undefined): ExploreEntityAction {
  if (!a) return { kind: "get_the_look" };
  if (a.type === "spread") return { kind: "get_the_look" };
  if (a.type === "deal_embedded") {
    const url = a.deal?.affiliateUrl ?? a.partnerUrl;
    if (url) return { kind: "activate", url };
  }
  const code = a.deal?.code?.trim();
  if (code) return { kind: "copy_code", code };
  if (a.partnerUrl) return { kind: "activate", url: a.partnerUrl };
  if (a.deal?.affiliateUrl) return { kind: "activate", url: a.deal.affiliateUrl };
  return { kind: "get_the_look" };
}

export type DiscoveryCategory = {
  id: string;
  label: string;
  sublabel: string;
  heroImage: string;
  articlesCount: number;
  tag: string;
  editorialNote: string;
  route?: "Brand" | "Influencer" | "Lifestyle" | "Automotive";
  routeParam?: string;
  listingCategory?: ListingCategory;
  articles: ExploreArticleCard[];
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop&q=80";

function shortenReadTime(s?: string): string {
  if (!s) return "5 min";
  const m = s.match(/(\d+)/);
  return m ? `${m[1]} min` : "5 min";
}

function cardsFromArticleIds(ids: string[]): ExploreArticleCard[] {
  return ids.map((id) => {
    const a = mockArticles.find((x) => x.id === id);
    if (!a) {
      return {
        id,
        headline: "Editorial",
        author: "ATMAD",
        readTime: "5 min",
        imageUrl: FALLBACK_IMG,
        action: { kind: "get_the_look" },
      };
    }
    return {
      id: a.id,
      headline: a.headline,
      author: a.author,
      readTime: shortenReadTime(a.readTime),
      imageUrl: a.coverImage || FALLBACK_IMG,
      action: exploreActionForArticle(a),
    };
  });
}

type RawCat = Omit<DiscoveryCategory, "articles"> & { articleIds: string[] };

const RAW: RawCat[] = [
  {
    id: "quiet-luxury",
    label: "Quiet Luxury",
    sublabel: "The new opulence of restraint",
    heroImage:
      "https://images.unsplash.com/photo-1618362429894-235528bbb226?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900&q=80",
    articlesCount: 14,
    tag: "Fashion",
    editorialNote: "When silence becomes the most expensive statement.",
    route: "Brand",
    routeParam: "maison-noir",
    listingCategory: "fashion",
    articleIds: ["1", "5", "4"],
  },
  {
    id: "digital-creators",
    label: "Digital Creators",
    sublabel: "Influence in the algorithm age",
    heroImage:
      "https://images.unsplash.com/photo-1692611894076-9f8aac7b1b4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900&q=80",
    articlesCount: 9,
    tag: "Culture",
    editorialNote: "Architecture built not in stone, but in perception.",
    route: "Influencer",
    routeParam: "elena-vasquez",
    articleIds: ["1", "6", "3", "2"],
  },
  {
    id: "private-finance",
    label: "Private Finance",
    sublabel: "Wealth that moves without announcement",
    heroImage:
      "https://images.unsplash.com/photo-1630243237838-a44b1a87eb95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900&q=80",
    articlesCount: 7,
    tag: "Finance",
    editorialNote: "The grammar of old money, spoken in new markets.",
    listingCategory: "finance",
    articleIds: ["5", "2", "4"],
  },
  {
    id: "automotive-culture",
    label: "Automotive Culture",
    sublabel: "Machines as philosophical objects",
    heroImage:
      "https://images.unsplash.com/photo-1701519664307-a402295fc7c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900&q=80",
    articlesCount: 6,
    tag: "Automotive",
    editorialNote: "To drive is to express. To collect is to commit.",
    route: "Automotive",
    listingCategory: "automotive",
    articleIds: ["3", "1", "5"],
  },
  {
    id: "future-travel",
    label: "Future Travel",
    sublabel: "The geography of intention",
    heroImage:
      "https://images.unsplash.com/photo-1717764488252-71702b7acf7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900&q=80",
    articlesCount: 11,
    tag: "Travel",
    editorialNote: "Destinations chosen not for Instagram, but for perspective.",
    route: "Lifestyle",
    listingCategory: "travel",
    articleIds: ["4", "5", "3"],
  },
  {
    id: "fashion-editorials",
    label: "Fashion Editorials",
    sublabel: "Clothing as cultural text",
    heroImage:
      "https://images.unsplash.com/photo-1645951249336-172f41b34321?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900&q=80",
    articlesCount: 21,
    tag: "Fashion",
    editorialNote: "Every collection is a sentence. Every season, a thesis.",
    listingCategory: "fashion",
    articleIds: ["4", "2", "1", "3"],
  },
];

export const DISCOVERY_CATEGORIES: DiscoveryCategory[] = RAW.map((c) => {
  const { articleIds, ...rest } = c;
  return {
    ...rest,
    articles: cardsFromArticleIds(articleIds),
  };
});
