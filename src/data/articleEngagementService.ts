import { supabase } from "../lib/supabase";
import { env } from "../lib/env";
import type { ArticleEngagementKind } from "./engagementEvents";

export type ArticleEngagementResult = {
  awarded: boolean;
  deltaPoints: number;
};

function parseRpcPayload(raw: unknown): ArticleEngagementResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { awarded: false, deltaPoints: 0 };
  }
  const o = raw as Record<string, unknown>;
  return {
    awarded: o.awarded === true,
    deltaPoints: typeof o.delta_points === "number" ? o.delta_points : 0,
  };
}

/**
 * Awards points once per (user, article, kind) per UTC day (server-side).
 * No-op when Supabase env is not configured.
 */
export async function recordArticleEngagement(
  articleId: string,
  kind: ArticleEngagementKind,
): Promise<ArticleEngagementResult> {
  if (!env.IS_CONFIGURED) {
    return { awarded: false, deltaPoints: 0 };
  }
  try {
    const { data, error } = await supabase.rpc("record_article_engagement", {
      p_article_id: articleId,
      p_kind: kind,
    });
    if (error) {
      if (__DEV__) {
        console.warn("[recordArticleEngagement]", kind, error.message);
      }
      return { awarded: false, deltaPoints: 0 };
    }
    return parseRpcPayload(data);
  } catch (e) {
    if (__DEV__) console.warn("[recordArticleEngagement]", e);
    return { awarded: false, deltaPoints: 0 };
  }
}
