/**
 * Auth actions: phone OTP, sign in / sign up, profile updates, OAuth.
 *
 * Phone OTP routes through our own Edge Functions backed by Twilio Verify
 * (start-otp / verify-otp). On verify success, the function returns a
 * magic-link `token_hash`; we exchange it via supabase.auth.verifyOtp to
 * obtain a real GoTrue-managed session (with refresh tokens). The client
 * never touches the service role key or the Twilio credentials.
 *
 * Email OTP routes through Supabase's built-in email auth. Sign-up creates
 * the auth user with the phone (Twilio-verified above) and a synthetic
 * email; we then collect the user's real email and call updateUser to
 * trigger an email_change confirmation. The user enters the 6-digit code
 * we send to their inbox and we exchange it for a confirmed email.
 */
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "../lib/supabase";
import { env } from "../lib/env";

WebBrowser.maybeCompleteAuthSession();

const PHONE_E164 = /^\+[1-9]\d{6,14}$/;

/** Supabase `AuthApiError.code` — useful for branching in forms (e.g. duplicate signup → prompt log in). */
function authErrCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Confirmation and OAuth links redirect here. This exact URI (or `EXPO_PUBLIC_AUTH_REDIRECT_URI`)
 * must appear under Supabase → Authentication → Redirect URLs. If Supabase rejects the redirect,
 * signup confirmation falls back to the project Site URL (often `http://localhost:3000`) and the
 * app will never receive the session.
 *
 * Typical values: Expo Go `exp://…:8081/--/auth/callback`; dev/production build `atmad://auth/callback`;
 * Expo web `https://localhost:19006/auth/callback` (Metro port differs from 3000 unless you unify them).
 */
export function getAuthRedirectUriForSupabase(): string {
  const uri = env.AUTH_REDIRECT_URI || Linking.createURL("auth/callback", { scheme: "atmad" });
  if (__DEV__) {
    console.log(
      "[auth] emailRedirectTo / OAuth redirect (paste into Supabase → Auth → Redirect URLs):",
      uri,
    );
  }
  return uri;
}

/** Redact middle digits for logs (avoid leaking full numbers in __DEV__). */
function maskPhoneE164ForLog(e164: string): string {
  const s = e164.replace(/\s/g, "");
  if (s.length <= 8) return `${s.slice(0, 2)}***`;
  return `${s.slice(0, 4)}…${s.slice(-3)}`;
}

/**
 * Extra user-facing hint for common Twilio / carrier failure messages surfaced by start-otp.
 * Server message stays primary; append this only when keyword match (second line).
 */
export function otpSendFailureAdvice(serverMessage: string): string | null {
  const m = serverMessage.toLowerCase();
  if (
    /\b21211\b|\b21608\b|\b20404\b/.test(serverMessage) ||
    (m.includes("invalid") && (m.includes("phone") || m.includes("number"))) ||
    (m.includes("not a valid") && m.includes("phone"))
  ) {
    return "Confirm the full number—including country code—matches what you use on SMS.";
  }
  if (
    m.includes("trial") ||
    (m.includes("not verified") && m.includes("twilio")) ||
    m.includes("unverified recipient") ||
    m.includes("not a valid sms channel")
  ) {
    return "Twilio trial projects often only SMS numbers you verify in Twilio Console (Verified Caller IDs).";
  }
  if (m.includes("60200") || m.includes("60410") || m.includes("rate limit") || m.includes("too many")) {
    return "Wait about a minute, then tap Resend.";
  }
  return null;
}
// Mirrors the synthetic email pattern emitted by the verify-otp edge fn.
// We use it to detect "phone-verified, email not yet verified" sessions.
const SYNTHETIC_EMAIL_DOMAIN = "@phone.atmad.local";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type OtpChannel = "sms" | "whatsapp";

export function isSyntheticEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.endsWith(SYNTHETIC_EMAIL_DOMAIN));
}

/**
 * supabase-js v2 surfaces non-2xx Edge Function responses as `FunctionsHttpError`
 * with the real payload buried inside `error.context` (a `Response`). Without
 * reading it, callers only ever see a generic "non-2xx status code" string —
 * which makes Twilio errors (unverified number, sandbox not joined, etc.)
 * effectively invisible. This helper digs the real message back out.
 */
async function unwrapFunctionError(
  error: { message?: string; context?: unknown } | null,
  fallback: string,
): Promise<string> {
  if (!error) return fallback;
  const ctx = (error as { context?: unknown }).context;
  if (ctx instanceof Response) {
    try {
      const body = await ctx.clone().json();
      const msg = body?.error?.message ?? body?.message ?? body?.error;
      if (typeof msg === "string" && msg.length > 0) return msg;
    } catch {
      try {
        const txt = await ctx.clone().text();
        if (txt) return txt;
      } catch {
        // fall through
      }
    }
  }
  return error.message ?? fallback;
}

export async function sendPhoneOtp(
  phoneE164: string,
  channel: OtpChannel = "sms",
) {
  if (!PHONE_E164.test(phoneE164)) {
    return { success: false, error: "Invalid phone number" };
  }
  const { data, error } = await supabase.functions.invoke("start-otp", {
    body: { phone: phoneE164, channel },
  });
  if (__DEV__) {
    console.log("[sendPhoneOtp]", maskPhoneE164ForLog(phoneE164), channel, {
      fnError: error ? String((error as { message?: string }).message ?? error) : null,
      data,
    });
  }
  if (error) {
    return { success: false, error: await unwrapFunctionError(error, "Could not send code") };
  }

  type StartPayload = Record<string, unknown> & {
    success?: boolean;
    error?: unknown;
    message?: unknown;
  };
  const payload = data as StartPayload | null | undefined;

  if (payload && payload.success === false) {
    const err = payload.error;
    const msg =
      typeof err === "string"
        ? err
        : err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
          ? (err as { message: string }).message
          : typeof payload.message === "string"
            ? payload.message
            : "Could not send code";
    return { success: false, error: msg };
  }

  if (payload?.error != null) {
    const e = payload.error;
    const msg =
      typeof e === "string"
        ? e
        : typeof e === "object" &&
            e !== null &&
            "message" in e &&
            typeof (e as { message: unknown }).message === "string"
          ? (e as { message: string }).message
          : "Could not send code";
    return { success: false, error: msg };
  }

  return { success: true };
}

export async function verifyPhoneOtp(phoneE164: string, token: string) {
  const cleaned = token.replace(/\D/g, "");
  if (cleaned.length < 4 || cleaned.length > 8) {
    return { success: false, error: "Invalid code" };
  }

  // 1. Validate the OTP via Twilio Verify (server-side) and mint a magic-link token
  const { data, error } = await supabase.functions.invoke("verify-otp", {
    body: { phone: phoneE164, code: cleaned },
  });
  if (error) {
    return { success: false, error: await unwrapFunctionError(error, "Verification failed") };
  }
  if (data?.error) return { success: false, error: data.error.message ?? "Verification failed" };
  if (!data?.token_hash) return { success: false, error: "No session token" };

  // 2. Exchange the magic-link token for a real Supabase session
  const { data: session, error: vErr } = await supabase.auth.verifyOtp({
    token_hash: data.token_hash,
    type: "magiclink",
  });
  if (vErr) return { success: false, error: vErr.message };
  return { success: true, session: session.session };
}

export async function updateProfile(payload: {
  fullName?: string;
  interests?: string[];
  userRole?: "member" | "content_creator" | "advertiser" | "admin";
  /** ISO 3166-1 alpha-2 (e.g. AE) — column `country_iso` */
  countryIso?: string;
  /** BCP-47 tag (e.g. en, ar) */
  locale?: string;
  travelMode?: "home" | "travel";
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const row: Record<string, unknown> = { id: user.id };
  if (payload.fullName  !== undefined) row.full_name = payload.fullName;
  if (payload.interests !== undefined) row.interests = payload.interests;
  if (payload.userRole  !== undefined) row.user_role = payload.userRole;
  if (payload.countryIso !== undefined) row.country_iso = payload.countryIso;
  if (payload.locale !== undefined) row.locale = payload.locale;
  if (payload.travelMode !== undefined) row.travel_mode = payload.travelMode;

  const { error } = await supabase.from("profiles").upsert(row, {
    onConflict: "id",
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  fullName?: string,
) {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) return { success: false, error: "Invalid email address" };
  if (password.length < 8) return { success: false, error: "Password must be at least 8 characters" };

  const emailRedirectTo = getAuthRedirectUriForSupabase();

  const { data, error } = await supabase.auth.signUp({
    email: trimmed,
    password,
    options: {
      emailRedirectTo,
      data: { full_name: fullName?.trim() ?? "" },
    },
  });
  if (error) {
    return { success: false as const, error: error.message, authCode: authErrCode(error) };
  }
  if (__DEV__) {
    console.log("[signUpWithEmailPassword]", {
      hasSession: Boolean(data.session),
      userId: data.user?.id,
      confirmationHint: data.session ? "session returned (confirm email may be off)" : "no session (check inbox or Supabase Auth logs)",
    });
  }
  return {
    success: true,
    session: data.session,
    needsEmailConfirmation: !data.session,
  };
}

export async function signInWithEmailPassword(email: string, password: string) {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) return { success: false, error: "Invalid email address" };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });
  if (error) {
    return { success: false as const, error: error.message, authCode: authErrCode(error) };
  }
  return { success: true, session: data.session };
}

/** Google or Apple OAuth via PKCE redirect; configure providers in Supabase Auth. */
export async function signInWithOAuth(provider: "google" | "apple") {
  const redirectTo = getAuthRedirectUriForSupabase();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) return { success: false as const, error: error.message };
  if (!data?.url) return { success: false as const, error: "OAuth did not return a URL" };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "cancel") {
    return { success: false as const, error: "Cancelled" };
  }

  const url =
    result.type === "success" && "url" in result && typeof result.url === "string"
      ? result.url
      : undefined;
  if (!url) return { success: false as const, error: "OAuth did not return a callback URL" };

  const parsed = Linking.parse(url);
  const code = typeof parsed.queryParams?.code === "string"
    ? parsed.queryParams.code
    : undefined;

  if (code) {
    const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeErr) return { success: false as const, error: exchangeErr.message };
    return { success: true as const };
  }

  const hashPart = url.includes("#") ? url.split("#")[1] ?? "" : "";
  const searchPart = hashPart.includes("access_token") ? hashPart : (url.includes("?") ? url.split("?")[1] ?? "" : "");
  const qp = new URLSearchParams(hashPart.includes("access_token") ? hashPart : searchPart);

  const access_token = qp.get("access_token");
  const refresh_token = qp.get("refresh_token");
  if (access_token && refresh_token) {
    const { error: sessionErr } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sessionErr) return { success: false as const, error: sessionErr.message };
    return { success: true as const };
  }

  return { success: false as const, error: "Could not parse OAuth redirect" };
}

/**
 * Trigger an email_change confirmation. Requires an authenticated session
 * (we always call this *after* the phone OTP step has minted one).
 *
 * Supabase sends a 6-digit token to `email`; the user submits it to
 * `verifyEmailOtp` to swap their synthetic email for the real one.
 */
export async function sendEmailOtp(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) {
    return { success: false, error: "Invalid email address" };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  // Already verified to this address — no need to re-send.
  if (user.email && user.email.toLowerCase() === trimmed && !isSyntheticEmail(user.email)) {
    return { success: true, alreadyVerified: true };
  }

  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function verifyEmailOtp(email: string, token: string) {
  const trimmed = email.trim().toLowerCase();
  const cleaned = token.replace(/\D/g, "");
  if (!EMAIL_RE.test(trimmed)) return { success: false, error: "Invalid email address" };
  if (cleaned.length < 4 || cleaned.length > 8) {
    return { success: false, error: "Invalid code" };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: trimmed,
    token: cleaned,
    type: "email_change",
  });
  if (error) return { success: false, error: error.message };
  return { success: true, session: data.session };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Server-side coupon redemption via Edge Function.
 */
export async function redeemCode(input: {
  code: string;
  deviceFingerprint?: string;
}): Promise<
  | { success: true; type: string; points: number; discountPercent?: number; discountAmount?: number; redemptionId?: string }
  | { success: false; error: string; code?: string }
> {
  const { data, error } = await supabase.functions.invoke("redeem-code", {
    body: input,
  });
  if (error) {
    return { success: false, error: await unwrapFunctionError(error, "Could not redeem code") };
  }
  if (data?.error)  return { success: false, error: data.error.message, code: data.error.code };
  return { success: true, ...data };
}
