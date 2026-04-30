import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList, MainTabParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthProvider";
import { useRegionalPreferences } from "../../regional/RegionalPreferencesContext";
import { trackJourney } from "../../analytics/journeyContracts";
import { fetchArticles } from "../../data/contentService";
import type { Article } from "../../data/types";
import { GlobalRegionBar } from "../../components/GlobalRegionBar";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { computeHomeRecommendations } from "../../intelligence/recommendations";
import {
  resolvePointsToNext,
  resolveProgressPct,
  resolveTier,
} from "../../intelligence/tierConfig";
import { useHomeIntelligenceStore } from "../../store/homeIntelligenceStore";
import { mockBrands } from "../../data/mock";
import { env } from "../../lib/env";
import { fetchDealSummariesForHome } from "../../data/codesService";
import type { DealSummary } from "../../intelligence/recommendations";
import { useNotificationBannerStore } from "../../store/notificationBannerStore";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "Home">,
  BottomTabNavigationProp<MainTabParamList>
>;

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const rp = useRegionalPreferences();
  const { profile, signOut, session } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealSummaries, setDealSummaries] = useState<DealSummary[]>([]);

  const touchStreak = useHomeIntelligenceStore((s) => s.touchStreak);
  const affinityCategory = useHomeIntelligenceStore((s) => s.affinityCategory);
  const streakDays = useHomeIntelligenceStore((s) => s.streakDays);
  const categoryClicks = useHomeIntelligenceStore((s) => s.categoryClicks);
  const brandVisits = useHomeIntelligenceStore((s) => s.brandVisits);
  const lastBrandId = useHomeIntelligenceStore((s) => s.lastBrandId);

  const banner = useNotificationBannerStore((s) => s.current);
  const dismissBanner = useNotificationBannerStore((s) => s.dismiss);
  const showBanner = useNotificationBannerStore((s) => s.show);
  const streakNudgeShown = useRef(false);

  useFocusEffect(
    useCallback(() => {
      touchStreak();
      const days = useHomeIntelligenceStore.getState().streakDays;
      if (days >= 2 && !streakNudgeShown.current) {
        streakNudgeShown.current = true;
        showBanner(
          "You're on a streak",
          `${days} days visiting ATMAD — open Wallet to see tier progress and points.`,
        );
      }
    }, [touchStreak, showBanner]),
  );

  const greetingName = profile?.full_name?.split(" ")[0] ?? "Reader";
  const points = profile?.points ?? 0;
  const tierMeta = resolveTier(points);
  const progressPct = resolveProgressPct(points, tierMeta);
  const pointsToNext = resolvePointsToNext(points, tierMeta.id);
  const displayTier = profile?.tier ?? `${tierMeta.label} ${tierMeta.roman}`.trim();

  useEffect(() => {
    trackJourney("home_feed_view", {
      countryIso: rp.countryIso,
      locale: rp.locale,
      userRole: profile?.user_role,
    });

    fetchArticles({
      countryIso: rp.countryIso,
      locale: rp.locale,
    }).then((rows) => {
      setArticles(rows);
      setLoading(false);
    });
  }, [rp.countryIso, rp.locale, profile?.user_role]);

  useEffect(() => {
    if (!env.IS_CONFIGURED || !session?.user) {
      setDealSummaries([]);
      return;
    }
    let cancelled = false;
    fetchDealSummariesForHome().then((rows) => {
      if (!cancelled) setDealSummaries(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, env.IS_CONFIGURED]);

  const rec = useMemo(
    () =>
      computeHomeRecommendations(
        categoryClicks,
        brandVisits,
        lastBrandId,
        points,
        tierMeta,
        articles,
        dealSummaries.length > 0 ? dealSummaries : undefined,
      ),
    [
      articles,
      brandVisits,
      categoryClicks,
      dealSummaries,
      lastBrandId,
      points,
      tierMeta,
    ],
  );

  const featured = articles.length > 0 ? articles[rec.featuredArticleIndex] ?? articles[0] : null;
  const suggestedBrand = mockBrands.find((b) => b.id === rec.suggestedBrandId) ?? mockBrands[0];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "Good night";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const affinityLabel = affinityCategory
    ? `Curated for your taste · ${affinityCategory}`
    : null;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <GlobalRegionBar />
      {banner ? (
        <Pressable
          onPress={dismissBanner}
          style={{
            marginHorizontal: spacing.xl,
            marginTop: spacing.sm,
            padding: spacing.md,
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.foreground }}>
            {banner.title}
          </Text>
          <Text style={{ marginTop: 4, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
            {banner.body}
          </Text>
          <Text style={{ marginTop: spacing.sm, fontFamily: fonts.body, fontSize: 9, color: colors.textTertiary }}>
            Tap to dismiss
          </Text>
        </Pressable>
      ) : null}
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
        {/* Top bar — v17 Home Intelligence */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: spacing.md,
        }}>
          <View>
            <Text style={{
              fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
              color: colors.textTertiary, textTransform: "uppercase",
            }}>
              ATMAD
            </Text>
            <Text style={{
              marginTop: 4, fontFamily: fonts.heading, fontSize: 15, color: colors.foreground,
            }}>
              {greeting}, {greetingName}.
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Pressable
              onPress={() => nav.navigate("Notifications")}
              hitSlop={12}
              style={{ padding: 8 }}
            >
              <Feather name="bell" size={19} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => nav.navigate("Identity")}
              hitSlop={12}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: colors.muted,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="user" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {affinityLabel ? (
          <Text style={{
            marginTop: spacing.md,
            fontFamily: fonts.bodyLight, fontSize: 11,
            color: colors.textSecondary,
            letterSpacing: 0.3,
          }}>
            {affinityLabel}
          </Text>
        ) : null}

        <View style={{ alignItems: "center", marginTop: spacing.lg }}>
          <Text style={{
            fontFamily: fonts.heading, fontSize: 20, letterSpacing: 6,
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

        {/* Membership + tier progress (Obsidian math from points) */}
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
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{
                fontFamily: fonts.heading, fontSize: 22, color: "#FFFFFF",
              }}>
                {displayTier}
              </Text>
              <Text style={{
                marginTop: 6, fontFamily: fonts.bodyLight, fontSize: 11,
                color: "rgba(255,255,255,0.55)",
              }}>
                {streakDays}-day access streak · Consistency unlocks deeper privileges
              </Text>
            </View>
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
          <View style={{ marginTop: spacing.md }}>
            <View style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.12)",
              overflow: "hidden",
            }}>
              <View style={{
                height: "100%",
                width: `${progressPct}%`,
                backgroundColor: "rgba(255,255,255,0.85)",
              }} />
            </View>
            {pointsToNext > 0 ? (
              <Text style={{
                marginTop: 6, fontFamily: fonts.body, fontSize: 10,
                color: "rgba(255,255,255,0.45)",
              }}>
                {pointsToNext.toLocaleString()} pts to next circle
              </Text>
            ) : null}
          </View>
        </View>

        {/* Today’s issue hero */}
        <Pressable
          onPress={() => nav.navigate("IssueTab", { screen: "Cover" })}
          style={{ marginTop: spacing.xl }}
        >
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.sm,
          }}>
            <Text style={{
              fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
              color: colors.textTertiary, textTransform: "uppercase",
            }}>
              Today’s issue
            </Text>
            <Text style={{
              fontFamily: fonts.body, fontSize: 8, letterSpacing: 2,
              color: colors.textTertiary, textTransform: "uppercase",
            }}>
              Updated today
            </Text>
          </View>
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

        <Pressable
          onPress={() => nav.navigate("IssueTab", { screen: "Feed" })}
          style={({ pressed }) => ({
            marginTop: spacing.md,
            paddingVertical: spacing.md,
            opacity: pressed ? 0.75 : 1,
            alignItems: "center",
          })}
        >
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2,
            color: colors.foreground, textTransform: "uppercase",
          }}>
            Continue reading →
          </Text>
        </Pressable>

        {/* Recommendation cards — v17 §3.1 */}
        <Text style={{
          marginTop: spacing.xl,
          fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
          color: colors.textTertiary, textTransform: "uppercase",
          marginBottom: spacing.sm,
        }}>
          Suggested for you · {rec.effectiveCategory}
        </Text>
        <View style={{ gap: spacing.md }}>
          <Pressable
            onPress={() => nav.navigate("ExploreTab", { screen: "Brand", params: { slug: rec.suggestedBrandId } })}
            style={REC_CARD}
          >
            <Text style={REC_LABEL}>Brand</Text>
            <Text style={REC_TITLE}>{suggestedBrand?.name ?? rec.suggestedBrandId}</Text>
            <Text style={REC_HINT}>{suggestedBrand?.tagline ?? ""}</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate("WalletTab", { screen: "Deal", params: { id: rec.suggestedDealCode } })}
            style={REC_CARD}
          >
            <Text style={REC_LABEL}>Member offer</Text>
            <Text style={REC_TITLE}>Unlock benefit</Text>
            <Text style={REC_HINT}>Code {rec.suggestedDealCode}</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              nav.navigate("ExploreTab", {
                screen: "Influencer",
                params: { slug: rec.suggestedInfluencerSlug },
              })
            }
            style={REC_CARD}
          >
            <Text style={REC_LABEL}>Voice</Text>
            <Text style={REC_TITLE}>Influencer feature</Text>
            <Text style={REC_HINT}>{rec.suggestedInfluencerSlug.replace(/-/g, " ")}</Text>
          </Pressable>
        </View>

        {/* Quick actions — vault, notifications, in-store */}
        <Text style={{
          marginTop: spacing.xl,
          fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
          color: colors.textTertiary, textTransform: "uppercase",
          marginBottom: spacing.sm,
        }}>
          Quick access
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          <Pressable
            onPress={() => nav.navigate("WalletTab", { screen: "Vault" })}
            style={[QUICK_ACTION_STYLE, { flex: 1, minWidth: "28%" }]}
          >
            <Text style={QUICK_LABEL}>Vault</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate("Notifications")}
            style={[QUICK_ACTION_STYLE, { flex: 1, minWidth: "28%" }]}
          >
            <Text style={QUICK_LABEL}>Alerts</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate("WalletTab", { screen: "InStore" })}
            style={[QUICK_ACTION_STYLE, { flex: 1, minWidth: "28%" }]}
          >
            <Text style={QUICK_LABEL}>In-store</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate("WalletTab", { screen: "Wallet" })}
            style={[QUICK_ACTION_STYLE, { flex: 1, minWidth: "28%" }]}
          >
            <Text style={QUICK_LABEL}>Wallet</Text>
          </Pressable>
          <Pressable
            onPress={() => nav.navigate("ProfileTab", { screen: "QR" })}
            style={[QUICK_ACTION_STYLE, { flex: 1, minWidth: "28%" }]}
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

const REC_CARD = {
  padding: spacing.lg,
  backgroundColor: colors.card,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
};

const REC_LABEL = {
  fontFamily: fonts.body,
  fontSize: 8,
  letterSpacing: 2,
  color: colors.textTertiary,
  textTransform: "uppercase" as const,
};

const REC_TITLE = {
  marginTop: 6,
  fontFamily: fonts.heading,
  fontSize: 17,
  color: colors.foreground,
};

const REC_HINT = {
  marginTop: 4,
  fontFamily: fonts.bodyLight,
  fontSize: 12,
  color: colors.textSecondary,
};
