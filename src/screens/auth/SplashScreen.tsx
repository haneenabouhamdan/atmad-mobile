import { useEffect } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { env } from "../../lib/env";
import { colors, fonts, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Splash">;

/**
 * Branded intro when `AUTH_INITIAL_ROUTE=Splash`. We only render this stack while
 * logged out (`RootNavigator`), so there is never a persisted session here — biometrics / unlock
 * run from `MainTabs`, not Splash.
 */
export function SplashScreen() {
  const nav = useNavigation<Nav>();

  useEffect(() => {
    let cancelled = false;
    if (!env.IS_CONFIGURED) return;

    const startedAt = Date.now();

    async function delayRemainderSplash(): Promise<void> {
      const rem = env.SPLASH_MIN_MS - (Date.now() - startedAt);
      if (cancelled || rem <= 0) return;
      await new Promise<void>((resolve) => setTimeout(resolve, rem));
    }

    void (async () => {
      await delayRemainderSplash();
      if (!cancelled) nav.replace("Welcome");
    })();

    return () => {
      cancelled = true;
    };
  }, [nav]);

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Text style={{
        fontFamily: fonts.heading,
        fontSize: 36,
        letterSpacing: 12,
        color: colors.foreground,
      }}>
        ATMAD
      </Text>
      <Text style={{
        marginTop: 6,
        fontFamily: fonts.body,
        fontSize: 10,
        letterSpacing: 3,
        color: colors.textTertiary,
        textTransform: "uppercase",
      }}>
        Luxury Commerce Magazine
      </Text>
      {env.IS_CONFIGURED ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.foreground} />
      ) : (
        <View style={{
          marginTop: spacing.xxxl,
          padding: spacing.lg,
          maxWidth: 320,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          backgroundColor: colors.card,
        }}>
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
            color: colors.foreground, textTransform: "uppercase",
            marginBottom: spacing.sm, textAlign: "center",
          }}>
            UI Preview Mode
          </Text>
          <Text style={{
            fontFamily: fonts.bodyLight, fontSize: 12,
            color: colors.textSecondary, lineHeight: 18, textAlign: "center",
          }}>
            Backend not configured yet. Add Supabase keys to{" "}
            <Text style={{ fontFamily: fonts.bodyMedium }}>mobile/.env</Text>{" "}
            to enable real auth.
          </Text>
        </View>
      )}
    </View>
  );
}
