import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Bookmarked offer codes (local only). Redeeming is separate and happens on the server. */
interface SavedDealsState {
  codes: string[];
  saveCode: (code: string) => void;
  removeCode: (code: string) => void;
  hasCode: (code: string) => boolean;
}

export const useSavedDealsStore = create<SavedDealsState>()(
  persist(
    (set, get) => ({
      codes: [],
      saveCode: (code) => {
        const c = code.trim().toUpperCase();
        if (!c) return;
        const cur = get().codes;
        if (cur.includes(c)) return;
        set({ codes: [...cur, c] });
      },
      removeCode: (code) => {
        const c = code.trim().toUpperCase();
        set({ codes: get().codes.filter((x) => x !== c) });
      },
      hasCode: (code) => get().codes.includes(code.trim().toUpperCase()),
    }),
    { name: "atmad-saved-deals", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
