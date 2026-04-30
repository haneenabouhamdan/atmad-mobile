import { useEffect, useState } from "react";
import type { ReactNode } from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useAuth, type UserRole } from "../../auth/AuthProvider";
import type { ProfileStackParamList } from "../../navigation/types";
import { PROMPT_DISMISSED_KEY } from "../../navigation/SignupPhoneReminder";
import { updateProfile } from "../../auth/authActions";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const INTERESTS = ["Fashion", "Luxury", "Tech", "Travel", "Automotive", "Finance", "F&B", "Beauty"];

function roleLabel(role: UserRole): { title: string; sub: string } {
  switch (role) {
    case "advertiser":
      return { title: "Advertiser", sub: "Brand campaigns and leads." };
    case "admin":
      return { title: "Admin", sub: "Platform administration." };
    case "content_creator":
      return {
        title: "Creator / publisher",
        sub: "Publish offers, editorial tools, commissions.",
      };
    case "member":
    default:
      return { title: "Consumer", sub: "Discover deals, activate offers, earn rewards." };
  }
}

type Nav = NativeStackNavigationProp<ProfileStackParamList, "EditProfile">;
type Rt = RouteProp<ProfileStackParamList, "EditProfile">;

export function EditProfileScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { profile, refreshProfile, user } = useAuth();
  const rl = roleLabel(profile?.user_role ?? "member");

  const [name, setName] = useState(profile?.full_name ?? "");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneDisplay = profile?.phone_e164 ?? user?.phone ?? "";
  const hasVerifiedPhone = Boolean(phoneDisplay);
  const [showPhoneBanner, setShowPhoneBanner] = useState(
    !!(route.params?.openPhoneReminder && !hasVerifiedPhone),
  );

  useEffect(() => {
    if (!hasVerifiedPhone && route.params?.openPhoneReminder) {
      setShowPhoneBanner(true);
    }
  }, [hasVerifiedPhone, route.params?.openPhoneReminder]);

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setInterests(profile?.interests ?? []);
  }, [profile?.full_name, profile?.interests]);

  function toggleInterest(i: string) {
    setInterests((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }

  async function dismissPhoneBanner() {
    setShowPhoneBanner(false);
    try {
      await SecureStore.setItemAsync(PROMPT_DISMISSED_KEY, "1");
    } catch {
      //
    }
    nav.setParams({ openPhoneReminder: undefined });
  }

  async function save() {
    setError(null);
    setSaving(true);
    const role = profile?.user_role ?? "member";
    const r = await updateProfile({
      fullName: name.trim(),
      interests,
      userRole: role,
    });
    setSaving(false);
    if (!r.success) {
      setError(r.error ?? "Could not save");
      return;
    }
    await refreshProfile();
    nav.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Edit Profile" eyebrow="Profile" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140 }}>
          {showPhoneBanner && !hasVerifiedPhone ? (
            <View style={{
              marginBottom: spacing.xl,
              padding: spacing.lg,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.borderFocus,
              backgroundColor: colors.card,
            }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
                <Ionicons name="phone-portrait-outline" size={22} color={colors.foreground} />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: fonts.bodyMedium,
                    fontSize: 14,
                    color: colors.foreground,
                  }}>
                    Add your mobile number
                  </Text>
                  <Text style={{
                    marginTop: 6,
                    fontFamily: fonts.bodyLight,
                    fontSize: 12,
                    lineHeight: 18,
                    color: colors.textSecondary,
                  }}>
                    Verify with SMS or WhatsApp — used for rewards, security alerts, and concierge touchpoints.
                  </Text>
                  <Pressable
                    onPress={() => nav.navigate("PhoneEntry", { mode: "signup" })}
                    style={({ pressed }) => ({
                      alignSelf: "flex-start",
                      marginTop: spacing.md,
                      paddingVertical: 10,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.borderFocus,
                      backgroundColor: colors.background,
                      opacity: pressed ? 0.82 : 1,
                    })}
                  >
                    <Text style={{
                      fontFamily: fonts.bodyMedium,
                      fontSize: 11,
                      letterSpacing: 2,
                      color: colors.foreground,
                      textTransform: "uppercase",
                    }}>
                      Verify phone
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => void dismissPhoneBanner()} style={{ marginTop: spacing.md }}>
                    <Text style={{
                      fontFamily: fonts.body,
                      fontSize: 11,
                      color: colors.textTertiary,
                      textDecorationLine: "underline",
                    }}>
                      Not now
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={colors.textFaint}
            style={inputStyle}
          />

          {!hasVerifiedPhone && !showPhoneBanner ? (
            <>
              <View style={{ height: spacing.md }} />
              <Label>Mobile</Label>
              <Pressable
                onPress={() => nav.navigate("PhoneEntry", { mode: "signup" })}
                style={({
                  pressed,
                }) => ({
                  paddingVertical: 14,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.borderFocus,
                  backgroundColor: colors.card,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <Text style={{ fontFamily: fonts.bodyLight, fontSize: 13, color: colors.textSecondary }}>
                  Add & verify SMS or WhatsApp
                </Text>
                <Text style={{
                  fontFamily: fonts.bodyMedium, fontSize: 11,
                  letterSpacing: 1,
                  color: colors.foreground, textTransform: "uppercase",
                }}>
                  Add
                </Text>
              </Pressable>
            </>
          ) : null}

          {hasVerifiedPhone ? (
            <>
              <View style={{ height: spacing.md }} />
              <Label>Mobile</Label>
              <View style={{
                paddingVertical: 14,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.foreground }}>
                  {phoneDisplay}
                </Text>
              </View>
            </>
          ) : null}

          <View style={{ height: spacing.xl }} />
          <Label>Interests</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {INTERESTS.map((i) => {
              const on = interests.includes(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => toggleInterest(i)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8,
                    borderRadius: radius.pill, borderWidth: 1,
                    borderColor: on ? colors.borderFocus : colors.border,
                    backgroundColor: on ? "rgba(60,60,60,0.08)" : "transparent",
                  }}
                >
                  <Text style={{
                    fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1,
                    color: on ? colors.foreground : colors.textTertiary,
                    textTransform: "uppercase",
                  }}>
                    {i}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: spacing.xl }} />
          <Label>Role</Label>
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: spacing.lg,
              padding: spacing.lg,
              backgroundColor: colors.card,
              borderWidth: 1, borderColor: colors.border,
              borderRadius: radius.lg,
            }}
          >
            <View style={{
              width: 16, height: 16, borderRadius: 999,
              borderWidth: 1, borderColor: colors.foreground,
              alignItems: "center", justifyContent: "center",
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.foreground }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
                {rl.title}
              </Text>
              <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textTertiary }}>
                {rl.sub}
              </Text>
            </View>
          </View>
          <Text style={{
            marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 10,
            letterSpacing: 1, color: colors.textTertiary,
          }}>
            Your role on ATMAD is fixed.
          </Text>

          {error ? (
            <Text style={{
              marginTop: spacing.md, textAlign: "center",
              fontFamily: fonts.body, fontSize: 11, color: colors.destructiveSoft,
            }}>
              {error}
            </Text>
          ) : null}

          <Pressable
            disabled={saving || !name.trim()}
            onPress={save}
            style={{
              marginTop: spacing.xl, paddingVertical: 16,
              borderRadius: radius.md,
              backgroundColor: !name.trim() ? "rgba(10,10,10,0.06)" : colors.foreground,
              alignItems: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator color={colors.inverse} />
            ) : (
              <Text style={{
                fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
                color: !name.trim() ? colors.textTertiary : colors.inverse,
                textTransform: "uppercase",
              }}>
                Save changes
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <Text style={{
      fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
      color: colors.textTertiary, textTransform: "uppercase",
      marginBottom: spacing.sm,
    }}>
      {children}
    </Text>
  );
}

const inputStyle = {
  backgroundColor: colors.card,
  borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  paddingHorizontal: spacing.lg, paddingVertical: 14,
  fontFamily: fonts.body, fontSize: 14, color: colors.foreground,
} as const;
