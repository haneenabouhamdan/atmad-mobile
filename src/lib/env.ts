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

export const env = {
  // Use harmless placeholders so the app can still boot (UI preview mode).
  SUPABASE_URL:       SUPABASE_URL      || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY:  SUPABASE_ANON_KEY || "placeholder-anon-key",
  SANITY_PROJECT_ID:  read("EXPO_PUBLIC_SANITY_PROJECT_ID",  "placeholder"),
  SANITY_DATASET:     read("EXPO_PUBLIC_SANITY_DATASET",     "production"),
  SANITY_API_VERSION: read("EXPO_PUBLIC_SANITY_API_VERSION", "2024-10-01"),
  IS_CONFIGURED:      Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
};
