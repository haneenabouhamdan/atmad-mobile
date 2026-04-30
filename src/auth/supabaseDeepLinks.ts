/**
 * Supabase Auth email confirmation + OAuth return to the app via deep link.
 * Web uses detectSessionInUrl; in React Native we must parse the redirect URL
 * and install the session (tokens in hash/query, or PKCE `code` exchange).
 */
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { SupabaseClient } from "@supabase/supabase-js";

const TOKEN_HASH_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

type TokenHashOtpType = (typeof TOKEN_HASH_TYPES)[number];

function isTokenHashOtpType(s: string): s is TokenHashOtpType {
  return (TOKEN_HASH_TYPES as readonly string[]).includes(s);
}

async function handleAuthCallbackUrl(supabase: SupabaseClient, url: string) {
  const { params } = QueryParams.getQueryParams(url);

  if (params.error || params.error_code || params.error_description) {
    if (__DEV__) {
      console.warn(
        "[auth deep link] provider error:",
        params.error,
        params.error_description,
      );
    }
    return;
  }

  if (
    typeof params.token_hash === "string" &&
    params.token_hash.length > 0 &&
    typeof params.type === "string" &&
    isTokenHashOtpType(params.type)
  ) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type,
    });
    if (error && __DEV__) {
      console.warn("[auth deep link] verifyOtp(token_hash):", error.message);
    }
    return;
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error && __DEV__) console.warn("[auth deep link] exchangeCodeForSession:", error.message);
    return;
  }

  const access = params.access_token;
  const refresh = params.refresh_token;
  if (
    typeof access === "string" &&
    access.length > 0 &&
    typeof refresh === "string" &&
    refresh.length > 0
  ) {
    const { error } = await supabase.auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
    if (error && __DEV__) console.warn("[auth deep link] setSession:", error.message);
  }
}

function looksLikeSupabaseAuthRedirect(url: string): boolean {
  if (/auth\/callback/i.test(url)) return true;
  if (/[?&#](access_token|refresh_token|code|token_hash)=/i.test(url)) return true;
  return false;
}

/** Call once (e.g. from AuthProvider mount). Unsubscribe in cleanup. */
export function subscribeSupabaseAuthDeepLinks(supabase: SupabaseClient) {
  async function onIncoming(url: string | null) {
    if (!url) return;
    if (!looksLikeSupabaseAuthRedirect(url)) {
      return;
    }
    WebBrowser.maybeCompleteAuthSession();
    await handleAuthCallbackUrl(supabase, url);
  }

  void Linking.getInitialURL().then((url) => onIncoming(url));

  const sub = Linking.addEventListener("url", ({ url }) => {
    void onIncoming(url);
  });

  return () => sub.remove();
}
