import { useEffect, useState } from "react";
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
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { requestPasswordReset, verifyRecoveryOtp } from "../../auth/authActions";
import { AuthBackButton } from "./AuthBackButton";
import { authColumnStyle } from "./authLayout";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<AuthStackParamList, "ForgotPassword">;
type Rt = RouteProp<AuthStackParamList, "ForgotPassword">;

const OTP_LEN = 6;

const inputStyle = {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: 14,
  fontFamily: fonts.body,
  fontSize: 14,
  color: colors.foreground,
} as const;

/**
 * Step 1: email → send recovery OTP
 * Step 2: enter code → verifyOtp(type: recovery) → RootNavigator shows ResetPasswordScreen
 */
export function ForgotPasswordScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const [email, setEmail] = useState(route.params?.email ?? "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [submitting, setSubmitting] = useState(false);
  const [resendSec, setResendSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  async function onSendCode() {
    setError(null);
    setSubmitting(true);
    try {
      const r = await requestPasswordReset(email);
      if (!r.success) {
        setError(r.error ?? "Could not send code");
        return;
      }
      setStep("code");
      setCode("");
      setResendSec(45);
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifyCode() {
    setError(null);
    setSubmitting(true);
    try {
      const r = await verifyRecoveryOtp(email, code);
      if (!r.success) {
        setError(r.error ?? "Invalid or expired code");
        return;
      }
      // PASSWORD_RECOVERY session → RootNavigator mounts ResetPasswordScreen
    } finally {
      setSubmitting(false);
    }
  }

  function onBack() {
    if (step === "code") {
      setStep("email");
      setError(null);
      return;
    }
    if (nav.canGoBack()) nav.goBack();
    else nav.navigate("Welcome");
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthBackButton onPress={onBack} />
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
            {step === "email" ? "Reset password" : "Enter code"}
          </Text>
          <Text style={{
            marginBottom: spacing.lg,
            fontFamily: fonts.bodyLight,
            fontSize: 13,
            lineHeight: 20,
            color: colors.textSecondary,
            textAlign: "center",
          }}>
            {step === "email"
              ? "Enter your email and we’ll send a one-time code."
              : `We sent a ${OTP_LEN}-digit code to ${email.trim().toLowerCase()}. Enter it to continue.`}
          </Text>

          {step === "email" ? (
            <>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor={colors.textFaint}
                autoComplete="email"
                textContentType="emailAddress"
                style={inputStyle}
              />

              <Pressable
                disabled={submitting || !email.trim()}
                onPress={onSendCode}
                style={({ pressed }) => ({
                  marginTop: spacing.lg,
                  paddingVertical: 16,
                  borderRadius: radius.md,
                  backgroundColor: email.trim() ? colors.foreground : "rgba(10,10,10,0.06)",
                  alignItems: "center",
                  opacity: pressed && !submitting ? 0.92 : 1,
                })}
              >
                <Text style={{
                  fontFamily: fonts.bodyMedium,
                  fontSize: 11,
                  letterSpacing: 3,
                  color: email.trim() ? colors.inverse : colors.textTertiary,
                  textTransform: "uppercase",
                }}>
                  {submitting ? "Please wait…" : "Send code"}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, OTP_LEN))}
                keyboardType="number-pad"
                placeholder={`${OTP_LEN}-digit code`}
                placeholderTextColor={colors.textFaint}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={OTP_LEN}
                style={{
                  ...inputStyle,
                  letterSpacing: 8,
                  textAlign: "center",
                  fontSize: 20,
                  fontFamily: fonts.bodyMedium,
                }}
              />

              <Pressable
                disabled={submitting || code.length < OTP_LEN}
                onPress={onVerifyCode}
                style={({ pressed }) => ({
                  marginTop: spacing.lg,
                  paddingVertical: 16,
                  borderRadius: radius.md,
                  backgroundColor: code.length >= OTP_LEN ? colors.foreground : "rgba(10,10,10,0.06)",
                  alignItems: "center",
                  opacity: pressed && !submitting ? 0.92 : 1,
                })}
              >
                <Text style={{
                  fontFamily: fonts.bodyMedium,
                  fontSize: 11,
                  letterSpacing: 3,
                  color: code.length >= OTP_LEN ? colors.inverse : colors.textTertiary,
                  textTransform: "uppercase",
                }}>
                  {submitting ? "Please wait…" : "Continue"}
                </Text>
              </Pressable>

              <Pressable
                disabled={submitting || resendSec > 0}
                onPress={onSendCode}
                style={{ marginTop: spacing.md }}
              >
                <Text style={{
                  textAlign: "center",
                  fontFamily: fonts.body,
                  fontSize: 11,
                  color: resendSec > 0 ? colors.textTertiary : colors.foreground,
                  textDecorationLine: resendSec > 0 ? "none" : "underline",
                }}>
                  {resendSec > 0 ? `Resend code in ${resendSec}s` : "Resend code"}
                </Text>
              </Pressable>
            </>
          )}

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
