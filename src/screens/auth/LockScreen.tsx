/**
 * Cold-start biometric gate.
 *
 * Rendered by the root navigator whenever a persisted Supabase session
 * is restored on app launch (i.e. the user is "logged in") and the
 * biometric preference is on. The gate stays in place until the user
 * authenticates with Face ID / Touch ID / fingerprint, at which point
 * `auth.unlock()` releases the rest of the app.
 *
 * Fresh sign-ins via OTP do not pass through this screen — they unlock
 * automatically via the SIGNED_IN auth event in AuthProvider.
 */
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../auth/AuthProvider";
import { authenticateWithBiometrics, isBiometricSupported } from "../../auth/biometrics";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

export function LockScreen() {
  const { unlock, signOut } = useAuth();
  const [busy, setBusy]   = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind]   = useState("Biometrics");

  async function tryUnlock() {
    setBusy(true);
    setError(null);
    const support = await isBiometricSupported();
    if (!support.supported || !support.enrolled) {
      // Hardware/enrolment regressed since we last saw it — let the user
      // through without biometrics rather than locking them out for good.
      unlock();
      return;
    }
    setKind(
      support.type === "face" ? "Face ID"
      : support.type === "fingerprint" ? "Touch ID"
      : "Biometrics",
    );
    const r = await authenticateWithBiometrics("Unlock ATMAD");
    setBusy(false);
    if (r.success) {
      unlock();
    } else {
      setError(r.error ?? "Authentication cancelled");
    }
  }

  useEffect(() => {
    tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{
      flex: 1, backgroundColor: colors.background,
      alignItems: "center", justifyContent: "center", padding: spacing.xl,
    }}>
      <Text style={{
        fontFamily: fonts.heading, fontSize: 36, letterSpacing: 12,
        color: colors.foreground,
      }}>
        ATMAD
      </Text>
      <Text style={{
        marginTop: 6, fontFamily: fonts.body, fontSize: 10,
        letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase",
      }}>
        Locked
      </Text>

      <View style={{
        marginTop: spacing.xxxl,
        width: 96, height: 96, borderRadius: 999,
        borderWidth: 1, borderColor: colors.border,
        alignItems: "center", justifyContent: "center",
        backgroundColor: colors.card,
      }}>
        {busy ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <Feather name="lock" size={32} color={colors.foreground} />
        )}
      </View>

      <Text style={{
        marginTop: spacing.xl,
        fontFamily: fonts.bodyLight, fontSize: 13,
        color: colors.textSecondary, textAlign: "center",
      }}>
        Use {kind} to unlock ATMAD.
      </Text>

      {error && (
        <Text style={{
          marginTop: spacing.md,
          fontFamily: fonts.body, fontSize: 11, color: colors.destructiveSoft,
          textAlign: "center",
        }}>
          {error}
        </Text>
      )}

      <Pressable
        onPress={tryUnlock}
        style={({ pressed }) => ({
          marginTop: spacing.xl, paddingHorizontal: spacing.xxl, paddingVertical: 14,
          borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderFocus,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{
          fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
          color: colors.foreground, textTransform: "uppercase",
        }}>
          Try again
        </Text>
      </Pressable>

      <Pressable onPress={signOut} style={{ marginTop: spacing.lg }}>
        <Text style={{
          fontFamily: fonts.bodyLight, fontSize: 10, letterSpacing: 2,
          color: colors.textFaint, textTransform: "uppercase",
        }}>
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}
