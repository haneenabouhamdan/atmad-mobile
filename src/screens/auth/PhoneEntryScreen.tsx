import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { sendPhoneOtp } from "../../auth/authActions";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<AuthStackParamList, "PhoneEntry">;

const COUNTRY_CODE = "+971";

export function PhoneEntryScreen() {
  const nav = useNavigation<Nav>();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onContinue() {
    setError(null);
    if (phone.length < 7) {
      setError("Enter a valid number");
      return;
    }
    const e164 = `${COUNTRY_CODE}${phone.replace(/\D/g, "")}`;
    setSubmitting(true);
    const r = await sendPhoneOtp(e164);
    setSubmitting(false);
    if (!r.success) {
      setError(r.error ?? "Could not send code");
      return;
    }
    nav.navigate("OtpVerify", { phoneE164: e164 });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: spacing.xxxl }}>
          <Text style={{
            fontFamily: fonts.heading, fontSize: 32, letterSpacing: 12,
            color: colors.foreground,
          }}>
            ATMAD
          </Text>
          <Text style={{
            marginTop: 6, fontFamily: fonts.body, fontSize: 10,
            letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase",
          }}>
            Luxury Commerce Magazine
          </Text>
        </View>

        <Text style={{
          fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
          color: colors.textTertiary, textTransform: "uppercase",
          marginBottom: spacing.sm,
        }}>
          Phone Number
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{
            backgroundColor: colors.card, borderRadius: radius.md,
            paddingHorizontal: spacing.md, justifyContent: "center",
            borderWidth: 1, borderColor: colors.border,
          }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary }}>
              {COUNTRY_CODE}
            </Text>
          </View>
          <TextInput
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, ""))}
            placeholder="50 000 0000"
            placeholderTextColor={colors.textFaint}
            keyboardType="phone-pad"
            maxLength={12}
            style={{
              flex: 1,
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
        </View>

        {error && (
          <Text style={{
            fontFamily: fonts.body, fontSize: 11, color: colors.destructiveSoft,
            marginTop: spacing.sm,
          }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={onContinue}
          disabled={submitting}
          style={({ pressed }) => ({
            marginTop: spacing.xl,
            paddingVertical: 16,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.borderFocus,
            alignItems: "center",
            opacity: pressed || submitting ? 0.7 : 1,
          })}
        >
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
            color: colors.foreground, textTransform: "uppercase",
          }}>
            {submitting ? "Sending…" : "Continue"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
