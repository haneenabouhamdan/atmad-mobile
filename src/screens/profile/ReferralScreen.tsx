import { useMemo } from "react";
import { Alert, Pressable, Share, Text, View, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useAuth } from "../../auth/AuthProvider";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

/**
 * Derive a stable, human-friendly referral code from the user's id.
 * Same id always produces the same code; no collision-handling on-device.
 */
function buildReferralCode(seed: string | null | undefined, name?: string | null): string {
  const initials = (name ?? "").split(/\s+/).filter(Boolean).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const tail = (seed ?? "GUEST").replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${initials || "AT"}-${tail}`;
}

export function ReferralScreen() {
  const { user, profile } = useAuth();

  const code = useMemo(
    () => buildReferralCode(user?.id ?? null, profile?.full_name ?? null),
    [user?.id, profile?.full_name],
  );

  const referralUrl = `https://atmad.app/i/${code}`;

  async function copy() {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert("Copied", `${code} is on your clipboard.`);
  }

  async function share() {
    try {
      await Share.share({
        title: "ATMAD",
        message: `Join me on ATMAD — luxury, but useful. ${referralUrl}`,
      });
    } catch {}
  }

  const tier = profile?.tier ?? "Silver";
  const points = profile?.points ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Referral" eyebrow="Profile" />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ alignItems: "center", paddingTop: spacing.xl, paddingHorizontal: spacing.xl }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
            Your code
          </Text>
          <Text style={{
            marginTop: spacing.sm,
            fontFamily: fonts.heading, fontSize: 36, letterSpacing: 4,
            color: colors.foreground,
          }}>
            {code}
          </Text>
          <Text style={{
            marginTop: spacing.xs,
            fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary,
            textAlign: "center",
          }}>
            Earn 200 points when a friend joins. They get 100 to start.
          </Text>
        </View>

        <View style={{
          flexDirection: "row", gap: spacing.sm,
          paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
        }}>
          <Pressable
            onPress={copy}
            style={({ pressed }) => ({
              flex: 1, paddingVertical: 14, borderRadius: radius.md,
              backgroundColor: colors.card,
              borderWidth: 1, borderColor: colors.border,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Feather name="copy" size={14} color={colors.foreground} />
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2, color: colors.foreground, textTransform: "uppercase" }}>
              Copy
            </Text>
          </Pressable>
          <Pressable
            onPress={share}
            style={({ pressed }) => ({
              flex: 1, paddingVertical: 14, borderRadius: radius.md,
              backgroundColor: colors.foreground,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Feather name="share-2" size={14} color={colors.inverse} />
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2, color: colors.inverse, textTransform: "uppercase" }}>
              Share
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase", marginBottom: spacing.sm }}>
            Your referral status
          </Text>
          <View style={{
            padding: spacing.lg,
            backgroundColor: colors.surface, borderRadius: radius.lg,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={[CARD_LABEL, { color: "rgba(255,255,255,0.5)" }]}>Tier</Text>
                <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 22, color: "#FFFFFF" }}>{tier}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[CARD_LABEL, { color: "rgba(255,255,255,0.5)" }]}>Earned via referrals</Text>
                <Text style={{ marginTop: 4, fontFamily: fonts.bodyMedium, fontSize: 18, color: "#FFFFFF" }}>
                  {points.toLocaleString()} pts
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase", marginBottom: spacing.sm }}>
            How it works
          </Text>
          <Step n="01" title="Share your code"  body="Send the code or your link to anyone you'd happily welcome to Discover." />
          <Step n="02" title="They join ATMAD"   body="They enter your code at sign-up. Both of you get points the moment they verify." />
          <Step n="03" title="Earn each month"   body="When they unlock a monthly tier, you earn a milestone bonus on top." />
        </View>
      </ScrollView>
    </View>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg }}>
      <Text style={{
        fontFamily: fonts.heading, fontSize: 24, color: colors.textTertiary, width: 36,
      }}>
        {n}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.foreground }}>
          {title}
        </Text>
        <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
          {body}
        </Text>
      </View>
    </View>
  );
}

const CARD_LABEL = {
  fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
  textTransform: "uppercase" as const,
};
