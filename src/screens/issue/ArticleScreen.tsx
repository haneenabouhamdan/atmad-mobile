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
import { Feather } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type {
  IssueStackParamList,
  MainTabParamList,
  WalletStackParamList,
} from "../../navigation/types";
import { useAuth } from "../../auth/AuthProvider";
import { useArticleEngagementTracking } from "../../hooks/useArticleEngagementTracking";
import { fetchArticles } from "../../data/contentService";
import type { Article } from "../../data/types";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<IssueStackParamList, "Article">,
  BottomTabNavigationProp<MainTabParamList>
>;
type R = RouteProp<IssueStackParamList, "Article">;

export function ArticleScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const { session, refreshProfile } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { onScroll } = useArticleEngagementTracking(
    notFound || loading ? null : article,
    Boolean(session),
    refreshProfile,
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const all = await fetchArticles();
      if (!mounted) return;
      const found = all.find((a) => a.id === route.params.id) ?? null;
      setArticle(found);
      setNotFound(!found);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [route.params.id]);

  function goToDeal(dealId: string) {
    const walletParams: NavigatorScreenParams<WalletStackParamList> = {
      screen: "Deal",
      params: { id: dealId },
    };
    nav.navigate("WalletTab", walletParams);
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
      }}>
        <Pressable
          onPress={() => nav.goBack()}
          hitSlop={12}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
          <Text style={{
            marginLeft: 4,
            fontFamily: fonts.body, fontSize: 10, letterSpacing: 2,
            color: colors.textSecondary, textTransform: "uppercase",
          }}>
            Issue
          </Text>
        </Pressable>
        <Feather name="bookmark" size={18} color={colors.textTertiary} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : notFound || !article ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{
            fontFamily: fonts.heading, fontSize: 22, color: colors.foreground,
            textAlign: "center", marginBottom: spacing.sm,
          }}>
            Article not found
          </Text>
          <Text style={{
            fontFamily: fonts.bodyLight, fontSize: 13, color: colors.textSecondary,
            textAlign: "center",
          }}>
            This piece may have been retired from the issue.
          </Text>
          <Pressable
            onPress={() => nav.goBack()}
            style={({ pressed }) => ({
              marginTop: spacing.lg,
              paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
              borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{
              fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2,
              color: colors.foreground, textTransform: "uppercase",
            }}>
              Back to feed
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {article.coverImage ? (
            article.linkedListingId ? (
              <Pressable
                onPress={() => nav.navigate("Listing", { id: article.linkedListingId! })}
                style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
              >
                <Image
                  source={{ uri: article.coverImage }}
                  style={{
                    width: "100%",
                    aspectRatio: 1.05,
                    backgroundColor: colors.card,
                  }}
                />
                <View style={{
                  position: "absolute", right: spacing.md, bottom: spacing.md,
                  flexDirection: "row", alignItems: "center", gap: 6,
                  backgroundColor: "rgba(255,255,255,0.92)",
                  paddingHorizontal: 12, paddingVertical: 7,
                  borderRadius: radius.pill,
                }}>
                  <Feather name="shopping-bag" size={11} color={colors.foreground} />
                  <Text style={{
                    fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1.5,
                    color: colors.foreground, textTransform: "uppercase",
                  }}>
                    Get the Look
                  </Text>
                </View>
              </Pressable>
            ) : (
              <Image
                source={{ uri: article.coverImage }}
                style={{
                  width: "100%",
                  aspectRatio: 1.05,
                  backgroundColor: colors.card,
                }}
              />
            )
          ) : null}

          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
            <Text style={{
              fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
              color: colors.textTertiary, textTransform: "uppercase",
            }}>
              {article.category}
            </Text>
            <Text style={{
              marginTop: spacing.xs,
              fontFamily: fonts.heading, fontSize: 32, lineHeight: 38,
              color: colors.foreground,
            }}>
              {article.headline}
            </Text>
            {article.subheadline ? (
              <Text style={{
                marginTop: spacing.sm,
                fontFamily: fonts.headingItalic, fontSize: 16, lineHeight: 22,
                color: colors.textSecondary,
              }}>
                {article.subheadline}
              </Text>
            ) : null}

            <View style={{
              flexDirection: "row", alignItems: "center",
              marginTop: spacing.lg, paddingTop: spacing.md,
              borderTopWidth: 1, borderTopColor: colors.border,
            }}>
              <View style={{
                width: 28, height: 28, borderRadius: 999,
                backgroundColor: colors.muted,
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{
                  fontFamily: fonts.bodySemi, fontSize: 11,
                  color: colors.foreground,
                }}>
                  {article.author?.[0] ?? "A"}
                </Text>
              </View>
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={{
                  fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2,
                  color: colors.foreground, textTransform: "uppercase",
                }}>
                  {article.author}
                </Text>
                {article.readTime ? (
                  <Text style={{
                    marginTop: 1,
                    fontFamily: fonts.body, fontSize: 9, letterSpacing: 1.5,
                    color: colors.textTertiary, textTransform: "uppercase",
                  }}>
                    {article.readTime}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
            {(article.body || "")
              .split(/\n\s*\n/)
              .filter((p) => p.trim().length > 0)
              .map((para, i) => (
                <Text
                  key={i}
                  style={{
                    fontFamily: fonts.bodyLight,
                    fontSize: 16,
                    lineHeight: 26,
                    color: colors.foreground,
                    marginBottom: spacing.lg,
                  }}
                >
                  {i === 0 ? (
                    <Text style={{
                      fontFamily: fonts.heading, fontSize: 28, lineHeight: 28,
                    }}>
                      {para.trim()[0]}
                    </Text>
                  ) : null}
                  {i === 0 ? para.trim().slice(1) : para.trim()}
                </Text>
              ))}
          </View>

          {article.deal ? (
            <View style={{
              marginHorizontal: spacing.xl, marginTop: spacing.md,
              padding: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
            }}>
              <Text style={{
                fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
                color: colors.silverDim, textTransform: "uppercase",
              }}>
                Member Offer
              </Text>
              <Text style={{
                marginTop: spacing.xs,
                fontFamily: fonts.heading, fontSize: 22,
                color: colors.inverse,
              }}>
                {article.deal.brand}
              </Text>
              <Text style={{
                marginTop: spacing.xs,
                fontFamily: fonts.bodyLight, fontSize: 14, lineHeight: 20,
                color: colors.silver,
              }}>
                {article.deal.description}
              </Text>

              <View style={{
                marginTop: spacing.md, paddingTop: spacing.md,
                borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
              }}>
                <Text style={{
                  fontFamily: fonts.bodyMedium, fontSize: 12,
                  color: colors.inverse,
                }}>
                  {article.deal.discount}
                </Text>
                <Text style={{
                  marginTop: 2,
                  fontFamily: fonts.body, fontSize: 10, letterSpacing: 2,
                  color: colors.silverDim, textTransform: "uppercase",
                }}>
                  +{article.deal.points} pts · {article.deal.expiry}
                </Text>
              </View>

              <Pressable
                onPress={() => goToDeal(article.deal!.id)}
                style={({ pressed }) => ({
                  marginTop: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radius.pill,
                  backgroundColor: colors.inverse,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{
                  fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2.5,
                  color: colors.foreground, textTransform: "uppercase",
                }}>
                  Activate Offer
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
