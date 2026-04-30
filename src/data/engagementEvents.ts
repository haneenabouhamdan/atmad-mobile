/** Supabase `record_article_engagement.p_kind` and transaction analytics. */
export const ARTICLE_READ = "article_read" as const;
export const ARTICLE_ENGAGED = "article_engaged" as const;

export type ArticleEngagementKind = typeof ARTICLE_READ | typeof ARTICLE_ENGAGED;
