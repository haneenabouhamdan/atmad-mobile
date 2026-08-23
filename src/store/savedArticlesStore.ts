import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Locally saved article ids (for Discover bookmarks). */
interface SavedArticlesState {
  articleIds: string[];
  saveArticle: (id: string) => void;
  removeArticle: (id: string) => void;
  hasArticle: (id: string) => boolean;
}

export const useSavedArticlesStore = create<SavedArticlesState>()(
  persist(
    (set, get) => ({
      articleIds: [],
      saveArticle: (id) => {
        const trimmed = id.trim();
        if (!trimmed) return;
        const cur = get().articleIds;
        if (cur.includes(trimmed)) return;
        set({ articleIds: [...cur, trimmed] });
      },
      removeArticle: (id) => {
        const trimmed = id.trim();
        set({ articleIds: get().articleIds.filter((x) => x !== trimmed) });
      },
      hasArticle: (id) => get().articleIds.includes(id.trim()),
    }),
    { name: "atmad-saved-articles", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
