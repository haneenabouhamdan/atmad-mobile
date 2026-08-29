import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../auth/AuthProvider";
import { updatePassword } from "../../auth/authActions";
import { PasswordField } from "./PasswordField";
import { AuthBackButton } from "./AuthBackButton";
import { authColumnStyle } from "./authLayout";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

export function ResetPasswordScreen() {
  const { clearPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (password.length < 8) return false;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  async function onSubmit() {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await updatePassword(password);
      if (!r.success) {
        setError(r.error ?? "Could not update password");
        return;
      }
      clearPasswordRecovery();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthBackButton onPress={() => signOut()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            alignItems: "center",
            paddingHorizontal: spacing.xl,
            flexGrow: 1,
            paddingBottom: spacing.xxxl,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authColumnStyle}>
          <Text style={{
            marginBottom: spacing.sm,
            fontFamily: fonts.heading,
            fontSize: 24,
            color: colors.foreground,
            textAlign: "center",
          }}>
            Choose a new password
          </Text>
          <Text style={{
            marginBottom: spacing.lg,
            fontFamily: fonts.bodyLight,
            fontSize: 13,
            lineHeight: 20,
            color: colors.textSecondary,
            textAlign: "center",
          }}>
            Enter and confirm your new password to finish resetting your account.
          </Text>

          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="New password · min 8 characters"
            autoComplete="password-new"
            textContentType="newPassword"
            visible={showPassword}
            onToggleVisible={() => setShowPassword((v) => !v)}
          />

          <View style={{ height: spacing.md }} />

          <PasswordField
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            autoComplete="password-new"
            textContentType="newPassword"
            visible={showConfirmPassword}
            onToggleVisible={() => setShowConfirmPassword((v) => !v)}
          />

          <Pressable
            disabled={submitting}
            onPress={onSubmit}
            style={({ pressed }) => ({
              marginTop: spacing.lg,
              paddingVertical: 16,
              borderRadius: radius.md,
              backgroundColor: canSubmit ? colors.foreground : "rgba(10,10,10,0.06)",
              alignItems: "center",
              opacity: pressed && !submitting ? 0.92 : 1,
            })}
          >
            <Text style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 11,
              letterSpacing: 3,
              color: canSubmit ? colors.inverse : colors.textTertiary,
              textTransform: "uppercase",
            }}>
              {submitting ? "Please wait…" : "Update password"}
            </Text>
          </Pressable>

          {error ? (
            <Text style={{
              marginTop: spacing.sm,
              fontFamily: fonts.body,
              fontSize: 11,
              color: colors.destructiveSoft,
              textAlign: "center",
            }}>
              {error}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
