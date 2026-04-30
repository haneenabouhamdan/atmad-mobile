import { useCallback, useEffect, useRef } from "react";
import type { NativeSyntheticEvent } from "react-native";
import type { NativeScrollEvent } from "react-native";
import type { Article } from "../data/types";
import { recordArticleEngagement } from "../data/articleEngagementService";
import {
  ARTICLE_ENGAGED,
  ARTICLE_READ,
} from "../data/engagementEvents";
import { env } from "../lib/env";
import { useHomeIntelligenceStore } from "../store/homeIntelligenceStore";

const READ_DWELL_MS = 2800;
const ENGAGED_DWELL_MS = 24000;
const ENGAGED_SCROLL_FRAC = 0.56;

/**
 * Debounced magazine engagement: `article_read` after short dwell,
 * `article_engaged` on deep scroll or longer dwell. Updates local category
 * affinity; refreshes profile when points are awarded.
 */
export function useArticleEngagementTracking(
  article: Article | null,
  hasSession: boolean,
  refreshProfile: () => Promise<unknown>,
) {
  const readSent = useRef(false);
  const engagedSent = useRef(false);
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engagedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const articleRef = useRef(article);
  const sessionRef = useRef(hasSession);
  const refreshRef = useRef(refreshProfile);

  articleRef.current = article;
  sessionRef.current = hasSession;
  refreshRef.current = refreshProfile;

  const bumpLocalAffinity = useCallback((a: Article) => {
    useHomeIntelligenceStore.getState().recordCategoryClick(a.category);
  }, []);

  const sendRead = useCallback(async () => {
    const a = articleRef.current;
    if (!a || readSent.current) return;
    if (!env.IS_CONFIGURED) {
      readSent.current = true;
      bumpLocalAffinity(a);
      return;
    }
    if (!sessionRef.current) return;
    readSent.current = true;
    const r = await recordArticleEngagement(a.id, ARTICLE_READ);
    if (r.awarded) {
      bumpLocalAffinity(a);
      await refreshRef.current();
    }
  }, [bumpLocalAffinity]);

  const sendEngaged = useCallback(async () => {
    const a = articleRef.current;
    if (!a || engagedSent.current) return;
    if (!env.IS_CONFIGURED) {
      engagedSent.current = true;
      if (engagedTimer.current) {
        clearTimeout(engagedTimer.current);
        engagedTimer.current = null;
      }
      bumpLocalAffinity(a);
      return;
    }
    if (!sessionRef.current) return;
    engagedSent.current = true;
    if (engagedTimer.current) {
      clearTimeout(engagedTimer.current);
      engagedTimer.current = null;
    }
    const r = await recordArticleEngagement(a.id, ARTICLE_ENGAGED);
    if (r.awarded) {
      bumpLocalAffinity(a);
      await refreshRef.current();
    }
  }, [bumpLocalAffinity]);

  useEffect(() => {
    readSent.current = false;
    engagedSent.current = false;
    if (readTimer.current) clearTimeout(readTimer.current);
    if (engagedTimer.current) clearTimeout(engagedTimer.current);
    if (!article?.id) return;

    readTimer.current = setTimeout(() => {
      void sendRead();
    }, READ_DWELL_MS);

    engagedTimer.current = setTimeout(() => {
      void sendEngaged();
    }, ENGAGED_DWELL_MS);

    return () => {
      if (readTimer.current) clearTimeout(readTimer.current);
      if (engagedTimer.current) clearTimeout(engagedTimer.current);
    };
  }, [article?.id, hasSession, sendRead, sendEngaged]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!articleRef.current || engagedSent.current) return;
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const visible = layoutMeasurement.height;
      const total = contentSize.height;
      const maxScroll = Math.max(0, total - visible);
      if (maxScroll <= 24) return;
      const frac = contentOffset.y / maxScroll;
      if (frac >= ENGAGED_SCROLL_FRAC) {
        void sendEngaged();
      }
    },
    [sendEngaged],
  );

  return { onScroll };
}
