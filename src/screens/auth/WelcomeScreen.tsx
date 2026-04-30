import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GoogleGIcon } from "../../components/GoogleGIcon";
import { signInWithOAuth } from "../../auth/authActions";
import { trackJourney } from "../../analytics/journeyContracts";
import { supabase } from "../../lib/supabase";
import { authColumnStyle } from "./authLayout";
import { EmailAuthForm } from "./EmailAuthForm";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

function RowDivider() {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      marginVertical: spacing.xl,
      gap: spacing.md,
    }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text style={{
        fontFamily: fonts.body,
        fontSize: 10,
        letterSpacing: 2,
        color: colors.textTertiary,
        textTransform: "lowercase",
      }}>
        or
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}

/** OAuth first, email/password last — mobile number is collected after sign-up (Edit Profile). */
export function WelcomeScreen() {
  useEffect(() => {
    trackJourney("auth_welcome_view");
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void supabase.auth.getSession();
    });
    return () => sub.remove();
  }, []);

  const [oauthBusy, setOauthBusy] = useState<"google" | "apple" | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  async function onOAuth(provider: "google" | "apple") {
    setOauthError(null);
    trackJourney("auth_oauth_start");
    setOauthBusy(provider);
    const r = await signInWithOAuth(provider);
    setOauthBusy(null);
    if (r.success === true) {
      trackJourney("auth_oauth_complete");
      return;
    }
    setOauthError(r.error === "Cancelled" ? null : r.error);
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            alignItems: "center",
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xxxl,
            paddingBottom: spacing.xxxl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={authColumnStyle}>
            <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
              <Text style={{
                fontFamily: fonts.heading,
                fontSize: 32,
                letterSpacing: 12,
                color: colors.foreground,
                textAlign: "center",
              }}>
                ATMAD
              </Text>
              <Text style={{
                marginTop: 8,
                fontFamily: fonts.body,
                fontSize: 10,
                letterSpacing: 3,
                color: colors.textSecondary,
                textTransform: "uppercase",
                textAlign: "center",
              }}>
                Deals, rewards, luxury commerce
              </Text>
            </View>

            <OAuthSocialButton
              label="Continue with Google"
              busy={oauthBusy === "google"}
              disabled={oauthBusy !== null && oauthBusy !== "google"}
              onPress={() => onOAuth("google")}
              icon={<GoogleGIcon size={22} />}
            />
            {Platform.OS === "ios" ? (
              <OAuthSocialButton
                label="Continue with Apple"
                busy={oauthBusy === "apple"}
                disabled={oauthBusy !== null && oauthBusy !== "apple"}
                onPress={() => onOAuth("apple")}
                icon={<Ionicons name="logo-apple" size={24} color={colors.foreground} />}
              />
            ) : null}

            <RowDivider />

            <EmailAuthForm variant="embedded" initialMode="signup" />

            {oauthError ? (
              <Text style={{
                marginTop: spacing.lg,
                textAlign: "center",
                fontFamily: fonts.body,
                fontSize: 11,
                lineHeight: 16,
                color: colors.destructiveSoft,
              }}>
                {oauthError}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function OAuthSocialButton({
  label,
  onPress,
  busy,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  icon: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        marginTop: spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        paddingVertical: 14,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderFocus,
        backgroundColor: colors.background,
        opacity: pressed && !disabled ? 0.85 : disabled ? 0.55 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator color={colors.foreground} size="small" />
      ) : (
        <>
          {icon}
          <Text style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 12,
            letterSpacing: 1,
            color: colors.foreground,
          }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
