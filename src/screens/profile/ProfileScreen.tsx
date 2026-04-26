import { ScrollView, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthProvider";
import { env } from "../../lib/env";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

interface Item {
  label: string;
  hint?: string;
  to: keyof ProfileStackParamList;
}

const TOOLS: Item[] = [
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

export function ProfileScreen() {
  const nav = useNavigation<Nav>();
  const { profile, user, signOut } = useAuth();

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

        {/* ── Tools ───────────────────────────────────── */}
        <Section title="ATMAD Tools" items={TOOLS} onPress={(to) => nav.navigate(to)} />

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
    </SafeAreaView>
  );
}

function Section({
  title, items, onPress,
}: {
  title: string;
  items: Item[];
  onPress: (to: keyof ProfileStackParamList) => void;
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
