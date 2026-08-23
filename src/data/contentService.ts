import { sanity, urlFor } from "../lib/sanity";
import { env } from "../lib/env";
import type { Article, Brand, Influencer } from "./types";
import { mockArticles, mockBrands, mockInfluencers } from "./mock";

const isConfigured = () => env.SANITY_PROJECT_ID !== "placeholder";

export type RegionalContentFilter = {
  countryIso?: string;
  locale?: string;
};

export async function fetchArticles(
  _regional?: RegionalContentFilter,
): Promise<Article[]> {
  if (!isConfigured()) return mockArticles;
  if (__DEV__ && _regional && (_regional.countryIso || _regional.locale)) {
    console.log("[fetchArticles] regional filter (wire to GROQ when ready):", _regional);
  }
  try {
    const rows = await sanity.fetch<any[]>(
      `*[_type == "article"] | order(publishedAt desc) {
        _id, headline, subheadline, type, category, author, readTime,
        coverImage, body, linkedDealCode,
        videoUrl,
        "videoAssetUrl": video.asset->url,
        "influencerSlug": influencer->slug.current
      }`,
    );
    return rows.map((r) => ({
      id: r._id,
      type: (r.type ?? "editorial") as Article["type"],
      coverImage: r.coverImage ? urlFor(r.coverImage).width(1200).url() : "",
      category: r.category ?? "EDITORIAL",
      headline: r.headline,
      subheadline: r.subheadline,
      body: portableTextToPlain(r.body),
      author: r.author,
      readTime: r.readTime,
      influencerSlug:
        typeof r.influencerSlug === "string" && r.influencerSlug
          ? r.influencerSlug
          : undefined,
      videoUrl:
        typeof r.videoUrl === "string" && r.videoUrl.trim()
          ? r.videoUrl.trim()
          : typeof r.videoAssetUrl === "string" && r.videoAssetUrl.trim()
            ? r.videoAssetUrl.trim()
            : undefined,
    }));
  } catch (e) {
    console.warn("Sanity articles fetch failed, falling back to mock:", e);
    return mockArticles;
  }
}

export async function fetchBrand(slug: string): Promise<Brand | null> {
  if (!isConfigured()) {
    return mockBrands.find((b) => b.id === slug) ?? null;
  }
  try {
    const r = await sanity.fetch<any>(
      `*[_type == "brand" && slug.current == $slug][0] {
        _id, name, tagline, category, logo, campaignImages
      }`,
      { slug },
    );
    if (!r) return null;
    return {
      id: slug,
      name: r.name,
      category: r.category,
      tagline: r.tagline ?? "",
      logoUrl: r.logo ? urlFor(r.logo).width(300).url() : undefined,
      campaignImages: (r.campaignImages ?? []).map((img: any) =>
        urlFor(img).width(900).url(),
      ),
    };
  } catch (e) {
    console.warn("Sanity brand fetch failed, falling back to mock:", e);
    return mockBrands.find((b) => b.id === slug) ?? null;
  }
}

export async function fetchInfluencer(slug: string): Promise<Influencer | null> {
  if (!isConfigured()) {
    return mockInfluencers[slug] ?? Object.values(mockInfluencers)[0] ?? null;
  }
  try {
    const r = await sanity.fetch<any>(
      `*[_type == "influencer" && slug.current == $slug][0] {
        "slug": slug.current,
        name, role, quote, subQuote, issues, points,
        featureHeadline, featurePreview,
        image,
        collabs[]{
          note,
          "brand": brand->name,
          "brandSlug": brand->slug.current
        },
        videos[]{ title, type, duration, linkedCouponCode, thumbnail }
      }`,
      { slug },
    );
    if (!r) return mockInfluencers[slug] ?? null;
    return {
      slug: r.slug ?? slug,
      name: r.name ?? "",
      role: r.role ?? "",
      imageUrl: r.image ? urlFor(r.image).width(900).url() : "",
      quote: r.quote ?? "",
      subQuote: r.subQuote ?? "",
      issues: r.issues ?? 0,
      points: r.points ?? 0,
      featureHeadline: r.featureHeadline ?? "",
      featurePreview: r.featurePreview ?? "",
      collabs: (r.collabs ?? []).map((c: any) => ({
        brand: c.brand ?? "",
        note: c.note ?? "",
        brandSlug: c.brandSlug ?? undefined,
      })),
      videos: (r.videos ?? []).map((v: any) => ({
        title: v.title ?? "",
        type: v.type ?? "editorial",
        duration: v.duration,
        linkedCouponCode: v.linkedCouponCode,
        thumbnailUrl: v.thumbnail ? urlFor(v.thumbnail).width(400).url() : undefined,
      })),
    };
  } catch (e) {
    console.warn("Sanity influencer fetch failed, falling back to mock:", e);
    return mockInfluencers[slug] ?? null;
  }
}

function portableTextToPlain(blocks: unknown): string {
  if (typeof blocks === "string") return blocks;
  if (!Array.isArray(blocks)) return "";
  return blocks
    .filter((b: any) => b._type === "block")
    .map((b: any) =>
      (b.children ?? [])
        .filter((c: any) => c._type === "span")
        .map((c: any) => c.text)
        .join(""),
    )
    .join("\n\n");
}
