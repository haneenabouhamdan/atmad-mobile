import { create } from "zustand";

export type InAppBanner = { id: string; title: string; body: string };

interface NotificationBannerState {
  current: InAppBanner | null;
  /** v17-style ~4.5s auto-dismiss. */
  show: (title: string, body: string, durationMs?: number) => void;
  dismiss: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useNotificationBannerStore = create<NotificationBannerState>((set) => ({
  current: null,
  show: (title, body, durationMs = 4500) => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    const id = `${Date.now()}`;
    set({ current: { id, title, body } });
    hideTimer = setTimeout(() => {
      set({ current: null });
      hideTimer = null;
    }, durationMs);
  },
  dismiss: () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ current: null });
  },
}));
