import { useEffect } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { authenticateWithBiometrics, isBiometricSupported } from "../../auth/biometrics";
import { useAuth } from "../../auth/AuthProvider";
import { env } from "../../lib/env";
import { colors, fonts, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Splash">;

export function SplashScreen() {
  const nav  = useNavigation<Nav>();
  const auth = useAuth();

  useEffect(() => {
    let cancelled = false;
    if (!env.IS_CONFIGURED) return;
    (async () => {
      if (auth.loading) return;

      if (auth.session) {
        const { supported, enrolled } = await isBiometricSupported();
        if (supported && enrolled) {
          const r = await authenticateWithBiometrics("Unlock ATMAD");
          if (cancelled) return;
          if (!r.success) {
            await auth.signOut();
            nav.replace("PhoneEntry");
            return;
          }
        }
      } else {
        nav.replace("PhoneEntry");
      }
    })();
    return () => { cancelled = true; };
  }, [auth.loading, auth.session]);

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
