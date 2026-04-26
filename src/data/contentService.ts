import { sanity, urlFor } from "../lib/sanity";
import { env } from "../lib/env";
import type { Article, Brand } from "./types";
import { mockArticles, mockBrands } from "./mock";

const isConfigured = () => env.SANITY_PROJECT_ID !== "placeholder";

export async function fetchArticles(): Promise<Article[]> {
  if (!isConfigured()) return mockArticles;
  try {
    const rows = await sanity.fetch<any[]>(
      `*[_type == "article"] | order(publishedAt desc) {
        _id, headline, subheadline, type, category, author, readTime,
        coverImage, body, linkedDealCode
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
