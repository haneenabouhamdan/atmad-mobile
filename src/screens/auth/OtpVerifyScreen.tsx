import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { verifyPhoneOtp, sendPhoneOtp } from "../../auth/authActions";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const OTP_LEN = 6;

type Nav = NativeStackNavigationProp<AuthStackParamList, "OtpVerify">;
type RP  = RouteProp<AuthStackParamList, "OtpVerify">;

export function OtpVerifyScreen() {
  const nav   = useNavigation<Nav>();
  const route = useRoute<RP>();
  const { phoneE164 } = route.params;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendSec, setResendSec] = useState(45);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const t = setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  async function onSubmit() {
    setError(null);
    if (code.length !== OTP_LEN) {
      setError(`Enter the ${OTP_LEN}-digit code`);
      return;
    }
    setSubmitting(true);
    const r = await verifyPhoneOtp(phoneE164, code);
    setSubmitting(false);
    if (!r.success) {
      setError(r.error ?? "Verification failed");
      return;
    }
    // The session is set globally; root navigator switches to Onboarding/Main automatically.
  }

  async function onResend() {
    if (resendSec > 0) return;
    setResendSec(45);
    await sendPhoneOtp(phoneE164);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
        <Text style={{
          fontFamily: fonts.heading, fontSize: 22, color: colors.foreground,
          textAlign: "center",
        }}>
          Enter the code
        </Text>
        <Text style={{
          marginTop: 6, marginBottom: spacing.xl,
          fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary,
          textAlign: "center",
        }}>
          Sent to {phoneE164}
        </Text>

        <Pressable onPress={() => inputRef.current?.focus()}>
          <View style={{ flexDirection: "row", gap: spacing.sm, justifyContent: "center" }}>
            {Array.from({ length: OTP_LEN }).map((_, i) => {
              const ch = code[i] ?? "";
              const focused = i === code.length;
              return (
                <View key={i} style={{
                  width: 44, height: 52, borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: focused ? colors.borderFocus : colors.border,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: colors.card,
                }}>
                  <Text style={{
                    fontFamily: fonts.bodyMedium, fontSize: 22, color: colors.foreground,
                  }}>
                    {ch}
                  </Text>
                </View>
              );
            })}
          </View>
        </Pressable>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, OTP_LEN))}
          keyboardType="number-pad"
          maxLength={OTP_LEN}
          style={{ position: "absolute", opacity: 0 }}
        />

        {error && (
          <Text style={{
            marginTop: spacing.lg, textAlign: "center",
            fontFamily: fonts.body, fontSize: 11,
            color: colors.destructiveSoft,
          }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={onSubmit}
          disabled={submitting || code.length !== OTP_LEN}
          style={({ pressed }) => ({
            marginTop: spacing.xl,
            paddingVertical: 16, borderRadius: radius.md,
            borderWidth: 1,
            borderColor: code.length === OTP_LEN ? colors.borderFocus : colors.border,
            alignItems: "center",
            opacity: pressed || submitting ? 0.7 : 1,
          })}
        >
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
            color: code.length === OTP_LEN ? colors.foreground : colors.textTertiary,
            textTransform: "uppercase",
          }}>
            {submitting ? "Verifying…" : "Verify"}
          </Text>
        </Pressable>

        <Pressable onPress={onResend} disabled={resendSec > 0} style={{ marginTop: spacing.lg }}>
          <Text style={{
            textAlign: "center",
            fontFamily: fonts.body, fontSize: 11, letterSpacing: 2,
            color: resendSec > 0 ? colors.textTertiary : colors.foreground,
            textTransform: "uppercase",
          }}>
            {resendSec > 0 ? `Resend in ${resendSec}s` : "Resend code"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
