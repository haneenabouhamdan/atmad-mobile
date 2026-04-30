/**
 * Reads environment variables from app.config / EXPO_PUBLIC_* / extra fields.
 * Never commit real secrets to source control — they belong in:
 *   - .env files (gitignored) for local dev
 *   - EAS Secrets for builds
 *
 * Only the SUPABASE_ANON_KEY is exposed to the client; the service role key
 * lives on the server (Edge Functions) only.
 */
import Constants from "expo-constants";

function read(key: string, fallback = ""): string {
  const fromEnv  = (process.env as Record<string, string | undefined>)[key];
  const fromExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  return fromEnv ?? (fromExtra[key] as string | undefined) ?? fallback;
}

const SUPABASE_URL      = read("EXPO_PUBLIC_SUPABASE_URL");
const SUPABASE_ANON_KEY = read("EXPO_PUBLIC_SUPABASE_ANON_KEY");
const PREVIEW_MODE      = read("EXPO_PUBLIC_PREVIEW_MODE").toLowerCase() === "true";
/** When true (default), synthetic `*@phone.atmad.local` users skip EmailVerify and go to onboarding / main. Set EXPO_PUBLIC_SKIP_EMAIL_VERIFICATION=false to require real email OTP again. */
const SKIP_EMAIL_VERIFICATION =
  read("EXPO_PUBLIC_SKIP_EMAIL_VERIFICATION", "true").toLowerCase() !== "false";

/** Min ms the splash branded screen stays visible before `Welcome`. Empty/unset defaults: ~1.2s in dev builds, 0 in production. Override with EXPO_PUBLIC_SPLASH_MIN_MS=800 etc. Set to 0 to disable. */
const SPLASH_MS_RAW = read("EXPO_PUBLIC_SPLASH_MIN_MS");
const SPLASH_MIN_MS =
  SPLASH_MS_RAW !== ""
    ? Math.max(0, Number.parseInt(SPLASH_MS_RAW, 10) || 0)
    : __DEV__
      ? 1200
      : 0;

/** First route when logged out (`AuthStack`). Unset = production defaults to Splash; in __DEV__ defaults to Welcome so sign-up/sign-in is the first screen when testing (set EXPO_PUBLIC_AUTH_INITIAL_ROUTE=splash to test the branded splash). */
const AUTH_ROUTE_RAW = read("EXPO_PUBLIC_AUTH_INITIAL_ROUTE");
const AUTH_INITIAL_ROUTE = ((): "Splash" | "Welcome" => {
  const r = AUTH_ROUTE_RAW.toLowerCase();
  if (r === "splash") return "Splash";
  if (r === "welcome") return "Welcome";
  return __DEV__ ? "Welcome" : "Splash";
})();

/** After email/password sign-up, try sign-in immediately. Succeeds when Supabase Auth has “Confirm email” disabled (immediate session behavior). Unclear/set in __DEV__: default true (“skip inbox wait”). Set EXPO_PUBLIC_TRY_SIGNIN_AFTER_EMAIL_SIGNUP=false to always show confirmation banner. Production default: false. */
const TRY_SIGNIN_AFTER_RAW = read("EXPO_PUBLIC_TRY_SIGNIN_AFTER_EMAIL_SIGNUP");
const TRY_SIGNIN_AFTER_EMAIL_SIGNUP = ((): boolean => {
  const r = TRY_SIGNIN_AFTER_RAW.toLowerCase();
  if (r === "true") return true;
  if (r === "false") return false;
  return __DEV__;
})();

/** When set (must exactly match Email link redirect URLs in Supabase), overrides the auto deep link from `Linking.createURL('auth/callback')`. Fixes confirmation emails hitting localhost:3000 if that URL was the project Site URL and the app-generated redirect was rejected. Example: `atmad://auth/callback`, `exp://192.168.1.x:8081/--/auth/callback`. */
const AUTH_REDIRECT_URI = read("EXPO_PUBLIC_AUTH_REDIRECT_URI").trim();

export const env = {
  // Use harmless placeholders so the app can still boot (UI preview mode).
  SUPABASE_URL:       SUPABASE_URL      || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY:  SUPABASE_ANON_KEY || "placeholder-anon-key",
  SANITY_PROJECT_ID:  read("EXPO_PUBLIC_SANITY_PROJECT_ID",  "placeholder"),
  SANITY_DATASET:     read("EXPO_PUBLIC_SANITY_DATASET",     "production"),
  SANITY_API_VERSION: read("EXPO_PUBLIC_SANITY_API_VERSION", "2024-10-01"),
  IS_CONFIGURED:      Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  PREVIEW_MODE,
  SKIP_EMAIL_VERIFICATION,
  SPLASH_MIN_MS,
  AUTH_INITIAL_ROUTE,
  TRY_SIGNIN_AFTER_EMAIL_SIGNUP,
  /** Prefer setting this equal to `[auth]` Metro log URI + adding it in Supabase → Auth → Redirect URLs */
  AUTH_REDIRECT_URI,
};
