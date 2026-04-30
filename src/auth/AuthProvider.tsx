/**
 * AuthProvider — single source of truth for the auth session.
 * Wraps the app, exposes `useAuth()`, and persists session to secure storage.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { supabase } from "../lib/supabase";
import { env } from "../lib/env";
import { subscribeSupabaseAuthDeepLinks } from "./supabaseDeepLinks";
import { isBiometricSupported } from "./biometrics";
import { isSyntheticEmail } from "./authActions";
import { useHomeIntelligenceStore } from "../store/homeIntelligenceStore";

const BIOMETRIC_KEY = "atmad.biometric.enabled.v1";

// Biometric is mandatory for every ATMAD member as soon as both the
// phone and the email have been verified. We default the flag to "1"
// the first time we see a fully-verified session on a device whose
// hardware is enrolled — users can still flip it off later from PIN
// & Biometrics, in which case the flag becomes "0" and we leave it.
async function ensureBiometricDefault(userEmail: string | null | undefined) {
  try {
    if (!userEmail || isSyntheticEmail(userEmail)) return;
    const flag = await SecureStore.getItemAsync(BIOMETRIC_KEY);
    if (flag !== null) return;
    const { supported, enrolled } = await isBiometricSupported();
    if (!supported || !enrolled) return;
    await SecureStore.setItemAsync(BIOMETRIC_KEY, "1");
  } catch {
    // best-effort
  }
}

export type UserRole =
  | "member"
  | "content_creator"
  | "advertiser"
  | "admin";

type Profile = {
  id: string;
  full_name: string | null;
  user_role: UserRole;
  interests: string[] | null;
  points: number;
  tier: string;
  phone_e164: string | null;
  /** ISO country for market UX (profiles.country_iso) */
  country_iso: string | null;
  /** BCP-47 locale preference */
  locale: string | null;
  /** home | travel (absent until region migration applied) */
  travel_mode?: string | null;
  /** Personalization blob — see migration `20260501_001_engagement_state_codes_public.sql`. */
  engagement_state?: Record<string, unknown> | null;
};

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** True while a persisted session exists but the device hasn't been unlocked
   *  with biometrics yet on this app run. Fresh sign-ins are auto-unlocked. */
  locked: boolean;
  unlock: () => void;
  signOut: () => Promise<void>;
  /** Reload `profile` from Supabase; returns the row or null on error / no session. */
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locked, setLocked]   = useState(false);

  const loadProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      if (__DEV__) {
        console.warn("[AuthProvider] loadProfile", error.message, error.code, error.details);
      }
      setProfile(null);
      return null;
    }
    const row = (data as Profile) ?? null;
    if (row?.engagement_state) {
      useHomeIntelligenceStore.getState().hydrateFromSupabase(row.engagement_state);
    }
    setProfile(row);
    return row;
  }, []);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) return null;
    let row = await loadProfile(uid);
    if (row) return row;
    await new Promise<void>((r) => setTimeout(r, 400));
    return loadProfile(uid);
  }, [loadProfile]);

  async function shouldRequireBiometric(userEmail: string | null | undefined): Promise<boolean> {
    if (!userEmail || isSyntheticEmail(userEmail)) return false;
    const flag = await SecureStore.getItemAsync(BIOMETRIC_KEY);
    if (flag === "0") return false;
    const { supported, enrolled } = await isBiometricSupported();
    return supported && enrolled;
  }

  useEffect(() => {
    if (!env.IS_CONFIGURED) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const unsubDeepLinks = subscribeSupabaseAuthDeepLinks(supabase);

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
        await ensureBiometricDefault(data.session.user.email);
        // Cold-start with a persisted session ⇒ require biometric.
        // Fresh sign-ins / sign-ups land via onAuthStateChange below
        // and are auto-unlocked there.
        if (await shouldRequireBiometric(data.session.user.email)) {
          setLocked(true);
        }
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (evt, s) => {
      setSession(s);
      if (s?.user) {
        await loadProfile(s.user.id);
        await ensureBiometricDefault(s.user.email);
      } else {
        setProfile(null);
      }
      // SIGNED_IN, USER_UPDATED, TOKEN_REFRESHED — the user is actively
      // interacting with the app, no biometric prompt needed.
      if (evt === "SIGNED_IN" || evt === "USER_UPDATED" || evt === "TOKEN_REFRESHED") {
        setLocked(false);
      } else if (evt === "SIGNED_OUT") {
        setLocked(false);
      }
    });

    return () => {
      mounted = false;
      unsubDeepLinks();
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      locked,
      unlock: () => setLocked(false),
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setLocked(false);
      },
      refreshProfile,
    }),
    [loading, session, profile, locked, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
