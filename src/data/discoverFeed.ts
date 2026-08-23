import type { Article } from "./types";

export type DiscoverFeedRow =
  | { kind: "section"; id: string; title: string }
  | { kind: "article"; id: string; article: Article; layout: "hero" | "standard" }
  | { kind: "mustReadRail"; id: string; articles: Article[] }
  | { kind: "video"; id: string; article: Article };

function isVideoArticle(a: Article): boolean {
  return Boolean(a.videoUrl?.trim());
}

/**
 * Vogue-style vertical rhythm: cover story, must-read cluster, then latest stories
 * (editorial and video only).
 */
export function buildDiscoverFeed(sortedArticles: Article[]): DiscoverFeedRow[] {
  if (sortedArticles.length === 0) return [];

  const rows: DiscoverFeedRow[] = [];
  const used = new Set<string>();

  const hero = sortedArticles[0];
  rows.push({ kind: "section", id: "sec-cover", title: "Cover story" });
  rows.push({ kind: "article", id: `a-hero-${hero.id}`, article: hero, layout: "hero" });
  used.add(hero.id);

  const pool = sortedArticles.filter((a) => !used.has(a.id));
  const mustRead = pool.filter((a) => a.type === "editorial").slice(0, 3);
  for (const a of mustRead) used.add(a.id);

  if (mustRead.length > 0) {
    rows.push({ kind: "section", id: "sec-must", title: "Must read" });
    rows.push({ kind: "mustReadRail", id: "rail-must-read", articles: mustRead });
  }

  rows.push({ kind: "section", id: "sec-latest", title: "Latest stories" });

  const rest = sortedArticles.filter((a) => !used.has(a.id));

  for (const a of rest) {
    if (isVideoArticle(a)) {
      rows.push({ kind: "video", id: `v-${a.id}`, article: a });
    } else {
      rows.push({ kind: "article", id: `a-${a.id}`, article: a, layout: "standard" });
    }
  }

  return rows;
}
