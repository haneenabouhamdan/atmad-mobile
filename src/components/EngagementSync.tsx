import { useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import { env } from "../lib/env";
import { supabase } from "../lib/supabase";
import { useHomeIntelligenceStore } from "../store/homeIntelligenceStore";

/**
 * Debounced upload of home-intelligence fields to `profiles.engagement_state`.
 * Runs only when Supabase is configured and a session exists. RLS allows
 * self-update without changing points/tier.
 */
export function EngagementSync() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const lastPushed = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId || !env.IS_CONFIGURED) return;
    lastPushed.current = JSON.stringify(useHomeIntelligenceStore.getState().toEngagementBlob());
  }, [userId]);

  useEffect(() => {
    if (!userId || !env.IS_CONFIGURED) return;

    const unsub = useHomeIntelligenceStore.subscribe((state) => {
      const blob = state.toEngagementBlob();
      const ser = JSON.stringify(blob);
      if (ser === lastPushed.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        const { error } = await supabase
          .from("profiles")
          .update({ engagement_state: blob })
          .eq("id", userId);
        if (!error) lastPushed.current = ser;
        else if (__DEV__) console.warn("[EngagementSync]", error.message);
      }, 900);
    });

    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId]);

  return null;
}
