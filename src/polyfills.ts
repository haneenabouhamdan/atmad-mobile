/** Load before `App`/`supabase`: improves PKCE RNG; WebCrypto/subtle warnings may remain in RN (harmless fallback). */
import "react-native-get-random-values";
