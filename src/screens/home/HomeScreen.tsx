import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList, MainTabParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthProvider";
import { fetchArticles } from "../../data/contentService";
import type { Article } from "../../data/types";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "Home">,
  BottomTabNavigationProp<MainTabParamList>
>;

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { profile, signOut } = useAuth();
  const [featured, setFeatured] = useState<Article | null>(null);
  const [loading, setLoading]   = useState(true);
  const greetingName = profile?.full_name?.split(" ")[0] ?? "Reader";
  const tier   = profile?.tier   ?? "Silver";
  const points = profile?.points ?? 0;

  useEffect(() => {
    fetchArticles().then((rows) => {
      setFeatured(rows[0] ?? null);
      setLoading(false);
    });
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5)  return "Good night";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
        <View style={{ alignItems: "center", marginTop: spacing.lg }}>
          <Text style={{
            fontFamily: fonts.heading, fontSize: 24, letterSpacing: 8,
            color: colors.foreground,
          }}>
            ATMAD
          </Text>
          <Text style={{
            marginTop: 4, fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
            color: colors.textTertiary, textTransform: "uppercase",
          }}>
            Your daily luxury intelligence
          </Text>
        </View>

        <View style={{ marginTop: spacing.xxl }}>
          <Text style={{
            fontFamily: fonts.headingItalic, fontSize: 28, color: colors.foreground,
          }}>
            {greeting}, {greetingName}.
          </Text>
          <Text style={{
            marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 13,
            color: colors.textSecondary, lineHeight: 20,
          }}>
            Today’s issue is curated for you. Featured cover, member rewards,
            and a fresh wave of brand drops.
          </Text>
        </View>

        {/* Membership card */}
        <View style={{
          marginTop: spacing.xl, padding: spacing.lg,
          backgroundColor: colors.surface, borderRadius: radius.lg,
        }}>
          <Text style={{
            fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
            color: "rgba(255,255,255,0.5)", textTransform: "uppercase",
            marginBottom: 4,
          }}>
            Membership
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <Text style={{
              fontFamily: fonts.heading, fontSize: 24, color: "#FFFFFF",
            }}>
              {tier}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{
                fontFamily: fonts.body, fontSize: 9, letterSpacing: 2,
                color: "rgba(255,255,255,0.5)", textTransform: "uppercase",
              }}>
                Points
              </Text>
              <Text style={{
                marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 18,
                color: "#FFFFFF",
              }}>
                {points.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Featured cover */}
        <Pressable
          onPress={() => nav.navigate("IssueTab", { screen: "Feed" })}
          style={{ marginTop: spacing.xl }}
        >
          <Text style={{
            fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
            color: colors.textTertiary, textTransform: "uppercase",
            marginBottom: spacing.sm,
          }}>
            Featured · This Issue
          </Text>
          {loading ? (
            <View style={{
              height: 220, borderRadius: radius.lg,
              backgroundColor: colors.card,
              alignItems: "center", justifyContent: "center",
            }}>
              <ActivityIndicator color={colors.foreground} />
            </View>
          ) : featured ? (
            <View style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.card }}>
              {featured.coverImage ? (
                <Image
                  source={{ uri: featured.coverImage }}
                  style={{ width: "100%", aspectRatio: 1.4 }}
                />
              ) : null}
              <View style={{ padding: spacing.md }}>
                <Text style={{
                  fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
                  color: colors.textTertiary, textTransform: "uppercase",
                }}>
                  {featured.category}
                </Text>
                <Text style={{
                  marginTop: 4, fontFamily: fonts.heading, fontSize: 20,
                  color: colors.foreground,
                }}>
                  {featured.headline}
                </Text>
              </View>
            </View>
          ) : null}
        </Pressable>

        {/* Quick actions */}
        <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xl }}>
          <Pressable
            onPress={() => nav.navigate("WalletTab", { screen: "Wallet" })}
            style={[QUICK_ACTION_STYLE, { flex: 1 }]}
          >
            <Text style={QUICK_LABEL}>Wallet</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate("WalletTab", { screen: "Vault" })}
            style={[QUICK_ACTION_STYLE, { flex: 1 }]}
          >
            <Text style={QUICK_LABEL}>Redeem</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate("ProfileTab", { screen: "QR" })}
            style={[QUICK_ACTION_STYLE, { flex: 1 }]}
          >
            <Text style={QUICK_LABEL}>Scan</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={signOut}
          style={{
            marginTop: spacing.xxxl, padding: spacing.md,
            alignItems: "center",
            borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
          }}
        >
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 3,
            color: colors.textSecondary, textTransform: "uppercase",
          }}>
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const QUICK_ACTION_STYLE = {
  paddingVertical: spacing.lg,
  alignItems: "center" as const,
  backgroundColor: colors.card,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
};

const QUICK_LABEL = {
  fontFamily: fonts.bodyMedium,
  fontSize: 10,
  letterSpacing: 2,
  color: colors.foreground,
  textTransform: "uppercase" as const,
};
