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
import type { ProfileStackParamList } from "../../navigation/types";
import {
  verifyPhoneOtp,
  sendPhoneOtp,
  otpSendFailureAdvice,
  type OtpChannel,
} from "../../auth/authActions";
import { authColumnStyle } from "./authLayout";
import { useAuth } from "../../auth/AuthProvider";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const OTP_LEN = 6;

type Nav = NativeStackNavigationProp<ProfileStackParamList, "OtpVerify">;
type RP  = RouteProp<ProfileStackParamList, "OtpVerify">;

export function OtpVerifyScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<RP>();
  const { phoneE164, channel } = route.params;
  const [otpChannel, setOtpChannel] = useState<OtpChannel>(channel);
  const { refreshProfile } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** Twilio/backend hints shown only after a failed resend or “SMS instead”; cleared on verify. */
  const [sendAdvice, setSendAdvice] = useState<string | null>(null);
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
    setSendAdvice(null);
    if (code.length !== OTP_LEN) {
      setError(`Enter the ${OTP_LEN}-digit code`);
      return;
    }
    setSubmitting(true);
    try {
      const r = await verifyPhoneOtp(phoneE164, code);
      if (!r.success) {
        setError(r.error ?? "Verification failed");
        return;
      }
      await refreshProfile();
      if (nav.canGoBack()) {
        nav.pop(2);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (resendSec > 0) return;
    setResendSec(45);
    setError(null);
    const r = await sendPhoneOtp(phoneE164, otpChannel);
    if (!r.success) {
      setError(r.error ?? "Could not send code");
      setSendAdvice(otpSendFailureAdvice(r.error ?? "") ?? null);
    } else setSendAdvice(null);
  }

  async function switchToSmsAndSend() {
    setError(null);
    setSendAdvice(null);
    setOtpChannel("sms");
    setResendSec(45);
    const r = await sendPhoneOtp(phoneE164, "sms");
    if (!r.success) {
      setError(r.error ?? "Could not send SMS code");
      setSendAdvice(otpSendFailureAdvice(r.error ?? "") ?? null);
    } else setSendAdvice(null);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.xl,
      }}>
        <View style={authColumnStyle}>
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
          Sent to {phoneE164} via {otpChannel === "whatsapp" ? "WhatsApp" : "SMS"}
        </Text>
        {otpChannel === "whatsapp" ? (
          <Text style={{
            marginBottom: spacing.md,
            fontFamily: fonts.bodyLight, fontSize: 11, lineHeight: 16,
            color: colors.textTertiary, textAlign: "center",
          }}>
            If nothing arrives here, switch to SMS below — WhatsApp often takes extra carrier setup.
          </Text>
        ) : (
          <Text style={{
            marginBottom: spacing.md,
            fontFamily: fonts.bodyLight, fontSize: 11, lineHeight: 16,
            color: colors.textFaint, textAlign: "center",
          }}>
            SMS is delivered by our backend (carrier and Twilio). If nothing arrives after a few minutes, confirm the number above. Twilio trial projects must list this exact destination as a verified recipient.
          </Text>
        )}

        <View style={{ position: "relative", alignSelf: "stretch" }}>
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
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, OTP_LEN))}
            keyboardType="number-pad"
            maxLength={OTP_LEN}
            textContentType="oneTimeCode"
            {...(Platform.OS === "ios" ? {} : { autoComplete: "sms-otp" as const })}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              opacity: 0.02,
            }}
          />
        </View>

        {error ? (
          <View style={{ marginTop: spacing.lg, alignSelf: "stretch", alignItems: "center", gap: 8 }}>
            <Text style={{
              textAlign: "center",
              fontFamily: fonts.body, fontSize: 11,
              color: colors.destructiveSoft,
            }}>
              {error}
            </Text>
            {sendAdvice ? (
              <Text style={{
                textAlign: "center",
                fontFamily: fonts.bodyLight, fontSize: 10, lineHeight: 15,
                color: colors.textTertiary,
              }}>
                {sendAdvice}
              </Text>
            ) : null}
          </View>
        ) : null}

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

        {otpChannel === "whatsapp" ? (
          <Pressable
            onPress={() => void switchToSmsAndSend()}
            disabled={resendSec > 0}
            style={{
              marginTop: spacing.sm,
              paddingVertical: spacing.sm,
              alignSelf: "center",
            }}
          >
            <Text style={{
              fontFamily: fonts.body, fontSize: 11,
              color: resendSec > 0 ? colors.textTertiary : colors.foreground,
              textDecorationLine: "underline",
              textAlign: "center",
            }}>
              Send code by SMS instead
            </Text>
          </Pressable>
        ) : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
