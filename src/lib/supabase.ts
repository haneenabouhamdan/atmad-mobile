import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { SecureStorage } from "./secureStorage";
import { env } from "./env";

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
  global: {
    headers: { "x-client": "atmad-mobile" },
  },
});
