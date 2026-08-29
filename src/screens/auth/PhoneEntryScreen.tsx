import { useMemo, useState } from "react";
import type { ComponentProps } from "react";
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
import { Feather } from "@expo/vector-icons";
import { CountryCodePicker } from "../../components/CountryCodePicker";
import type { Country } from "../../data/countries";
import { DEFAULT_COUNTRY } from "../../data/countries";
import * as SecureStore from "expo-secure-store";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { ProfileStackParamList } from "../../navigation/types";
import { sendPhoneOtp, otpSendFailureAdvice, type OtpChannel } from "../../auth/authActions";
import {
  clampNationalDigits,
  nationalNumberLengthBounds,
  validateNationalPhoneDigits,
} from "../../validation/phoneNationalDigits";
import { authColumnStyle } from "./authLayout";
import { AuthBackButton } from "./AuthBackButton";
import { useAuth } from "../../auth/AuthProvider";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "PhoneEntry">;
type PhoneEntryRoute = RouteProp<ProfileStackParamList, "PhoneEntry">;

// Cleared here when verifying phone while logged in (avoids stale pre-fill).
// Exported for EmailVerifyScreen; other flows may stash pending email before OTP if needed.
export const PENDING_EMAIL_KEY = "atmad.pending_email.v1";
/** Persisted beside email so onboarding can seed `profiles.country_iso`. */
export const PENDING_COUNTRY_ISO_KEY = "atmad.pending_country_iso.v1";

export function PhoneEntryScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<PhoneEntryRoute>();
  const { session } = useAuth();

  const mode = route.params?.mode ?? "signup";
  const isLogin = mode === "login";

  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<OtpChannel>("sms");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const phoneNationalBounds = useMemo(
    () => nationalNumberLengthBounds(country.code),
    [country.code],
  );

  const phoneErrAdvice = error ? otpSendFailureAdvice(error) : null;

  const hintText = useMemo(() => {
    if (isLogin) return "We'll send a code to your phone.";
    return "We'll send a verification code via SMS or WhatsApp.";
  }, [isLogin]);

  async function onContinue() {
    setError(null);
    const lenErr = validateNationalPhoneDigits(country.code, phone);
    if (lenErr) {
      setError(lenErr);
      return;
    }
    const digits = phone.replace(/\D/g, "");
    const e164 = `${country.dial.replace(/\s/g, "")}${digits}`;

    setSubmitting(true);

    try {
      try {
        if (session) {
          try {
            await SecureStore.deleteItemAsync(PENDING_EMAIL_KEY);
          } catch {
            //
          }
        }
        await SecureStore.setItemAsync(PENDING_COUNTRY_ISO_KEY, country.code);
      } catch {
        // SecureStore fallback to nav-only flow
      }

      const r = await sendPhoneOtp(e164, channel);
      if (!r.success) {
        setError(r.error ?? "Could not send code");
        return;
      }
      nav.navigate("OtpVerify", {
        phoneE164: e164,
        channel,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <AuthBackButton onPress={() => nav.goBack()} />

        <ScrollView
          contentContainerStyle={{
            alignItems: "center",
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xxxl,
            justifyContent: "center",
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
        >
          <View style={authColumnStyle}>
          <View style={{ alignItems: "center", marginBottom: spacing.xxxl }}>
            <Text style={{
              fontFamily: fonts.heading, fontSize: 32, letterSpacing: 12,
              color: colors.foreground, textAlign: "center",
            }}>
              ATMAD
            </Text>
            <Text style={{
              marginTop: 6, fontFamily: fonts.body, fontSize: 10,
              letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase",
              textAlign: "center",
            }}>
              {session ? "Add & verify mobile" : "Luxury Commerce Magazine"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "stretch" }}>
            <CountryCodePicker selected={country} onSelect={setCountry} />
            <TextInput
              value={phone}
              onChangeText={(v) =>
                setPhone(clampNationalDigits(v, phoneNationalBounds.max))
              }
              placeholder="Phone number"
              placeholderTextColor={colors.textFaint}
              editable={!submitting}
              keyboardType={Platform.OS === "web" ? "default" : "phone-pad"}
              {...(Platform.OS === "ios" ? { textContentType: "telephoneNumber" as const } : {})}
              autoCapitalize="none"
              autoCorrect={false}
              {...(Platform.OS === "web" ? { autoComplete: "off" as const, spellCheck: false as const } : {})}
              maxLength={phoneNationalBounds.max}
              style={{
                flex: 1,
                minWidth: 0,
                flexShrink: 1,
                backgroundColor: colors.card,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: error ? colors.destructive : colors.border,
                paddingHorizontal: spacing.lg,
                paddingVertical: 14,
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.foreground,
                ...(Platform.OS === "web"
                  ? { outlineStyle: "solid" as const, outlineWidth: 0 }
                  : {}),
              }}
            />
          </View>

          <Text style={{
            marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 11,
            color: colors.textTertiary,
            textAlign: "center",
          }}>
            {hintText}
          </Text>

          {error ? (
            <View style={{ alignSelf: "stretch", gap: spacing.xs, marginTop: spacing.sm }}>
              <Text style={{
                fontFamily: fonts.body, fontSize: 11, color: colors.destructiveSoft,
                textAlign: "center",
              }}>
                {error}
              </Text>
              {phoneErrAdvice ? (
                <Text style={{
                  fontFamily: fonts.bodyLight, fontSize: 10,
                  lineHeight: 15,
                  color: colors.textTertiary,
                  textAlign: "center",
                }}>
                  {phoneErrAdvice}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={{ height: spacing.xl }} />
          <View style={{
            flexDirection: "row",
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1, borderColor: colors.border,
            padding: 4,
          }}>
            <ChannelTab
              active={channel === "sms"}
              label="SMS"
              icon="message-square"
              onPress={() => setChannel("sms")}
            />
            <ChannelTab
              active={channel === "whatsapp"}
              label="WhatsApp"
              icon="message-circle"
              onPress={() => setChannel("whatsapp")}
            />
          </View>

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChannelTab({
  active, label, icon, onPress,
}: {
  active: boolean;
  label: string;
  icon: ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: radius.sm,
        backgroundColor: active ? colors.background : "transparent",
        borderWidth: active ? 1 : 0,
        borderColor: colors.border,
        opacity: pressed && !active ? 0.6 : 1,
      })}
    >
      <Feather
        name={icon}
        size={14}
        color={active ? colors.foreground : colors.textTertiary}
        style={{ marginRight: 6 }}
      />
      <Text style={{
        fontFamily: active ? fonts.bodyMedium : fonts.body,
        fontSize: 11, letterSpacing: 2,
        color: active ? colors.foreground : colors.textTertiary,
        textTransform: "uppercase",
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
