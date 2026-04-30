/**
 * Email verification step.
 *
 * Reached after a user has completed the phone OTP step and has a
 * Supabase session, but their auth email is still the synthetic
 * `phone…@phone.atmad.local` address. We:
 *
 *   1. Read a pending address from SecureStore when stashed before phone verify
 *      (or prompt for one if nothing was stashed — handles re-installs
 *      where the user already has a phone-only session).
 *   2. Call updateUser({ email }) to trigger a 6-digit confirmation.
 *   3. Verify the code via verifyOtp({ type: "email_change" }), which
 *      swaps the synthetic email for the real, verified one.
 *
 * Once the verified email lands in `auth.user.email`, RootNavigator
 * automatically advances the user to onboarding / main.
 */
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../auth/AuthProvider";
import { sendEmailOtp, verifyEmailOtp } from "../../auth/authActions";
import { PENDING_EMAIL_KEY } from "./PhoneEntryScreen";
import { authColumnStyle } from "./authLayout";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const OTP_LEN = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "loadingEmail" | "needsEmail" | "sending" | "code";

export function EmailVerifyScreen() {
  const { signOut } = useAuth();
  const [step, setStep] = useState<Step>("loadingEmail");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendSec, setResendSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info,  setInfo]  = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Hydrate the pending email and dispatch the OTP automatically.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stashed = await SecureStore.getItemAsync(PENDING_EMAIL_KEY);
        if (cancelled) return;
        if (stashed && EMAIL_RE.test(stashed)) {
          setEmail(stashed);
          await dispatchEmailOtp(stashed, /* silent */ true);
        } else {
          setStep("needsEmail");
        }
      } catch {
        if (!cancelled) setStep("needsEmail");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend countdown.
  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  async function dispatchEmailOtp(targetEmail: string, silent = false) {
    setError(null);
    if (!silent) setInfo(null);
    if (!EMAIL_RE.test(targetEmail)) {
      setError("Enter a valid email");
      setStep("needsEmail");
      return;
    }
    setStep("sending");
    const r = await sendEmailOtp(targetEmail);
    if (!r.success) {
      setError(r.error ?? "Could not send email code");
      setStep("needsEmail");
      return;
    }
    setStep("code");
    setResendSec(45);
    setCode("");
    if (!silent) setInfo("New code sent.");
    // Focus the hidden input so the OS keyboard appears.
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  async function onSubmitCode() {
    setError(null);
    if (code.length !== OTP_LEN) {
      setError(`Enter the ${OTP_LEN}-digit code`);
      return;
    }
    setSubmitting(true);
    const r = await verifyEmailOtp(email, code);
    setSubmitting(false);
    if (!r.success) {
      setError(r.error ?? "Verification failed");
      return;
    }
    // Email is now verified on the auth user; RootNavigator will
    // re-render to onboarding / main as soon as Supabase emits the
    // USER_UPDATED event. Clean up the pending email regardless.
    try { await SecureStore.deleteItemAsync(PENDING_EMAIL_KEY); } catch {
      // best-effort cleanup
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          alignItems: "center",
          flexGrow: 1,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xxl,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={authColumnStyle}>
        <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
          <Text style={{
            fontFamily: fonts.heading, fontSize: 28, color: colors.foreground,
            letterSpacing: 8,
            textAlign: "center",
          }}>
            ATMAD
          </Text>
          <Text style={{
            marginTop: 6, fontFamily: fonts.body, fontSize: 10, letterSpacing: 3,
            color: colors.textTertiary, textTransform: "uppercase",
            textAlign: "center",
          }}>
            Verify your email
          </Text>
        </View>

        {step === "loadingEmail" || step === "sending" ? (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
            <ActivityIndicator color={colors.foreground} />
            <Text style={{
              marginTop: spacing.md, fontFamily: fonts.body, fontSize: 12,
              color: colors.textTertiary,
              textAlign: "center",
            }}>
              {step === "sending" ? "Sending code…" : "Preparing…"}
            </Text>
          </View>
        ) : step === "needsEmail" ? (
          <View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor={colors.textFaint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              style={{
                backgroundColor: colors.card,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: error ? colors.destructive : colors.border,
                paddingHorizontal: spacing.lg,
                paddingVertical: 14,
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.foreground,
              }}
            />
            {error && (
              <Text style={{
                marginTop: spacing.sm,
                fontFamily: fonts.body, fontSize: 11, color: colors.destructiveSoft,
                textAlign: "center",
              }}>
                {error}
              </Text>
            )}
            <Pressable
              onPress={() => dispatchEmailOtp(email.trim().toLowerCase())}
              style={({ pressed }) => ({
                marginTop: spacing.xl, paddingVertical: 16, borderRadius: radius.md,
                borderWidth: 1, borderColor: colors.borderFocus, alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{
                fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
                color: colors.foreground, textTransform: "uppercase",
              }}>
                Send Code
              </Text>
            </Pressable>
          </View>
        ) : (
          // step === "code"
          <View>
            <Text style={{
              fontFamily: fonts.heading, fontSize: 22, color: colors.foreground,
              textAlign: "center",
            }}>
              Check your inbox
            </Text>
            <Text style={{
              marginTop: 6, marginBottom: spacing.xl,
              fontFamily: fonts.body, fontSize: 12, color: colors.textTertiary,
              textAlign: "center",
            }}>
              Sent to {email}
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
                fontFamily: fonts.body, fontSize: 11, color: colors.destructiveSoft,
              }}>
                {error}
              </Text>
            )}
            {info && !error && (
              <Text style={{
                marginTop: spacing.lg, textAlign: "center",
                fontFamily: fonts.body, fontSize: 11, color: colors.textTertiary,
              }}>
                {info}
              </Text>
            )}

            <Pressable
              onPress={onSubmitCode}
              disabled={submitting || code.length !== OTP_LEN}
              style={({ pressed }) => ({
                marginTop: spacing.xl, paddingVertical: 16, borderRadius: radius.md,
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
                {submitting ? "Verifying…" : "Verify Email"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => resendSec === 0 && dispatchEmailOtp(email)}
              disabled={resendSec > 0}
              style={{ marginTop: spacing.lg }}
            >
              <Text style={{
                textAlign: "center",
                fontFamily: fonts.body, fontSize: 11, letterSpacing: 2,
                color: resendSec > 0 ? colors.textTertiary : colors.foreground,
                textTransform: "uppercase",
              }}>
                {resendSec > 0 ? `Resend in ${resendSec}s` : "Resend code"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setStep("needsEmail")}
              style={{ marginTop: spacing.md }}
            >
              <Text style={{
                textAlign: "center",
                fontFamily: fonts.bodyLight, fontSize: 11,
                color: colors.textTertiary, textTransform: "uppercase",
                letterSpacing: 2,
              }}>
                Use a different email
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable onPress={signOut} style={{ marginTop: spacing.xxl }}>
          <Text style={{
            textAlign: "center",
            fontFamily: fonts.bodyLight, fontSize: 10,
            color: colors.textFaint, textTransform: "uppercase", letterSpacing: 2,
          }}>
            Cancel sign-up
          </Text>
        </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
