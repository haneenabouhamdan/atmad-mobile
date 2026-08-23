import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type FeedStoryComment = { id: string; text: string; at: number; author?: string };

const EMPTY_COMMENTS: FeedStoryComment[] = [];

/** Stable empty list for Zustand selectors (never `[]` inline). */
export const emptyFeedStoryComments = EMPTY_COMMENTS;

/** Display-only baseline so counts aren’t empty (deterministic per story id). */
export function storyEngagementSeed(articleId: string): { likes: number; comments: number } {
  let h = 2166136261;
  for (let i = 0; i < articleId.length; i++) {
    h ^= articleId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = h >>> 0;
  return {
    likes: 520 + (u % 4100),
    comments: 3 + ((u >>> 10) % 96),
  };
}

interface DiscoverFeedEngagementState {
  likedStoryIds: string[];
  commentsByStory: Record<string, FeedStoryComment[]>;
  toggleLike: (storyId: string) => void;
  addComment: (storyId: string, text: string) => void;
}

export const useDiscoverFeedEngagementStore = create<DiscoverFeedEngagementState>()(
  persist(
    (set, get) => ({
      likedStoryIds: [],
      commentsByStory: {},
      toggleLike: (storyId) => {
        const cur = get().likedStoryIds;
        const has = cur.includes(storyId);
        set({
          likedStoryIds: has ? cur.filter((x) => x !== storyId) : [...cur, storyId],
        });
      },
      addComment: (storyId, text) => {
        const t = text.trim();
        if (!t) return;
        const row: FeedStoryComment = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: t,
          at: Date.now(),
          author: "You",
        };
        const prev = get().commentsByStory[storyId] ?? [];
        set({
          commentsByStory: {
            ...get().commentsByStory,
            [storyId]: [...prev, row],
          },
        });
      },
    }),
    { name: "atmad-discover-feed-engagement", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
