import { ScrollView, Pressable, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthProvider";
import { APP_LOCALES, useRegionalPreferences } from "../../regional/RegionalPreferencesContext";
import { LanguagePreferenceModal } from "../../components/LanguagePreferenceModal";
import { env } from "../../lib/env";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

/** Menu rows only — not param-only flows like phone OTP */
type ProfileMenuScreen = Exclude<keyof ProfileStackParamList, "PhoneEntry" | "OtpVerify">;

interface Item {
  label: string;
  hint?: string;
  to: ProfileMenuScreen;
}

const TOOLS: Item[] = [
  { label: "Tools Hub",     hint: "QR, compare, referrals — one place", to: "ToolsHub" },
  { label: "QR Scanner",      hint: "Scan brand activations",     to: "QR" },
  { label: "Barcode Reader",  hint: "Look up products in-store",  to: "Barcode" },
  { label: "In-Store Mode",   hint: "Member offers when you walk in", to: "InStore" },
  { label: "Compare",         hint: "Side-by-side product compare",to: "Compare" },
  { label: "Reviews",         hint: "Curator-vetted opinions",     to: "Reviews" },
  { label: "Mind Lounge",     hint: "Daily editorial intelligence",to: "MindLounge" },
];

const ACCOUNT: Item[] = [
  { label: "Identity Vault",  hint: "Personal documents, on device", to: "Identity" },
  { label: "Notifications",   hint: "Drops, replies, points",        to: "Notifications" },
  { label: "Referral",        hint: "Invite, earn points",           to: "Referral" },
  { label: "PIN & Biometrics",hint: "Face ID, Touch ID, recovery PIN",to: "PIN" },
];

const ADVERTISER: Item[] = [
  { label: "My Leads", hint: "Form submissions for your brand", to: "MyLeads" },
];

const PUBLISHER: Item[] = [
  { label: "Referral & distribution", hint: "Share links, track rewards", to: "Referral" },
  { label: "QR activations", hint: "Campaign touchpoints", to: "QR" },
];

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { profile, user, signOut } = useAuth();
  const rp = useRegionalPreferences();
  const [langOpen, setLangOpen] = useState(false);

  const initial = (profile?.full_name?.trim()?.[0] ?? "A").toUpperCase();
  const displayName = profile?.full_name ?? "Anonymous";
  const phone = profile?.phone_e164 ?? user?.phone ?? "—";
  const tier = profile?.tier ?? "Silver";
  const points = profile?.points ?? 0;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* ── Header ───────────────────────────────────── */}
        <View style={{ alignItems: "center", paddingTop: spacing.lg, paddingHorizontal: spacing.xl }}>
          <Pressable
            onPress={() => nav.navigate("EditProfile")}
            hitSlop={8}
            style={({ pressed }) => ({ alignItems: "center", opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{
              width: 72, height: 72, borderRadius: 999,
              backgroundColor: colors.surface,
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{
                fontFamily: fonts.heading, fontSize: 28, color: "#FFFFFF",
              }}>{initial}</Text>
            </View>
            <Text style={{
              marginTop: spacing.md,
              fontFamily: fonts.heading, fontSize: 24, color: colors.foreground,
            }}>
              {displayName}
            </Text>
            <Text style={{
              marginTop: 2,
              fontFamily: fonts.body, fontSize: 11, letterSpacing: 1.5,
              color: colors.textTertiary, textTransform: "uppercase",
            }}>
              {phone}
            </Text>
            <View style={{
              marginTop: spacing.sm,
              flexDirection: "row", alignItems: "center", gap: 4,
              paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: radius.pill,
              borderWidth: 1, borderColor: colors.border,
            }}>
              <Feather name="edit-2" size={10} color={colors.textSecondary} />
              <Text style={{
                fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.5,
                color: colors.textSecondary, textTransform: "uppercase",
              }}>
                Edit profile
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── Membership card ─────────────────────────── */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <View style={{
            padding: spacing.lg,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={[CARD_LABEL, { color: "rgba(255,255,255,0.5)" }]}>Membership</Text>
                <Text style={{
                  marginTop: 4,
                  fontFamily: fonts.heading, fontSize: 22, color: "#FFFFFF",
                }}>{tier}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[CARD_LABEL, { color: "rgba(255,255,255,0.5)" }]}>Points</Text>
                <Text style={{
                  marginTop: 4,
                  fontFamily: fonts.bodyMedium, fontSize: 18, color: "#FFFFFF",
                }}>{points.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {!env.IS_CONFIGURED && (
            <Text style={{
              marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 11,
              color: colors.textTertiary,
            }}>
              UI preview mode. Configure Supabase to track real points.
            </Text>
          )}
        </View>

        {/* ── Preferences (language) ─────────────────── */}
        <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl }}>
          <Text style={{
            fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
            color: colors.textTertiary, textTransform: "uppercase",
            marginBottom: spacing.sm,
          }}>
            Preferences
          </Text>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            borderWidth: 1, borderColor: colors.border,
            overflow: "hidden",
          }}>
            <Pressable
              onPress={() => setLangOpen(true)}
              disabled={rp.busyField === "locale"}
              style={({ pressed }) => ({
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: pressed ? 0.6 : rp.busyField === "locale" ? 0.55 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
                <Feather name="globe" size={18} color={colors.foreground} />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: fonts.bodyMedium,
                    fontSize: 13,
                    color: colors.foreground,
                  }}>
                    Language
                  </Text>
                  <Text style={{
                    marginTop: 2,
                    fontFamily: fonts.bodyLight,
                    fontSize: 11,
                    color: colors.textSecondary,
                  }}>
                    App & newsletters ({APP_LOCALES.find((l) => l.tag === rp.locale)?.label ?? rp.locale})
                  </Text>
                </View>
              </View>
              {rp.busyField === "locale" ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Feather name="chevron-right" size={18} color={colors.textTertiary} />
              )}
            </Pressable>
          </View>
        </View>

        {/* ── Tools ───────────────────────────────────── */}
        <Section title="ATMAD Tools" items={TOOLS} onPress={(to) => nav.navigate(to)} />

        {/* ── Publisher tools (role-gated) ─────────────────────────────────── */}
        {(profile?.user_role === "content_creator" || profile?.user_role === "admin") && (
          <Section title="Publisher" items={PUBLISHER} onPress={(to) => nav.navigate(to)} />
        )}

        {/* ── Advertiser inbox (role-gated) ──────────── */}
        {(profile?.user_role === "advertiser" || profile?.user_role === "admin") && (
          <Section title="Advertiser" items={ADVERTISER} onPress={(to) => nav.navigate(to)} />
        )}

        {/* ── Account ─────────────────────────────────── */}
        <Section title="Account" items={ACCOUNT} onPress={(to) => nav.navigate(to)} />

        {/* ── Sign out ───────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <Pressable
            onPress={signOut}
            style={({ pressed }) => ({
              padding: spacing.md, alignItems: "center",
              borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{
              fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 3,
              color: colors.textSecondary, textTransform: "uppercase",
            }}>
              Sign out
            </Text>
          </Pressable>
          <Text style={{
            marginTop: spacing.lg, textAlign: "center",
            fontFamily: fonts.body, fontSize: 9, letterSpacing: 2,
            color: colors.textFaint, textTransform: "uppercase",
          }}>
            ATMAD · Issue 01 · v1.0.0
          </Text>
        </View>
      </ScrollView>
      <LanguagePreferenceModal
        visible={langOpen}
        locale={rp.locale}
        busy={rp.busyField === "locale"}
        onClose={() => setLangOpen(false)}
        onPick={(tag) => {
          void rp.setLocale(tag);
          setLangOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

function Section({
  title, items, onPress,
}: {
  title: string;
  items: Item[];
  onPress: (to: ProfileMenuScreen) => void;
}) {
  return (
    <View style={{ marginTop: spacing.xxl, paddingHorizontal: spacing.xl }}>
      <Text style={{
        fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
        color: colors.textTertiary, textTransform: "uppercase",
        marginBottom: spacing.sm,
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.border,
        overflow: "hidden",
      }}>
        {items.map((it, i) => (
          <Pressable
            key={it.label}
            onPress={() => onPress(it.to)}
            style={({ pressed }) => ({
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.border,
              opacity: pressed ? 0.6 : 1,
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            })}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{
                fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground,
              }}>{it.label}</Text>
              {it.hint && (
                <Text style={{
                  marginTop: 2,
                  fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary,
                }}>{it.hint}</Text>
              )}
            </View>
            <Text style={{
              fontFamily: fonts.body, fontSize: 18, color: colors.textTertiary,
            }}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const CARD_LABEL = {
  fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
  textTransform: "uppercase" as const,
};
