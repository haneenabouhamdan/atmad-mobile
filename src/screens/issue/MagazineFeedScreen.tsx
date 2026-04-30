import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { IssueStackParamList } from "../../navigation/types";
import { fetchArticles } from "../../data/contentService";
import type { Article } from "../../data/types";
import { env } from "../../lib/env";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useHomeIntelligenceStore } from "../../store/homeIntelligenceStore";

type Nav = NativeStackNavigationProp<IssueStackParamList, "Feed">;

export function MagazineFeedScreen() {
  const nav = useNavigation<Nav>();
  const followedSlugs = useHomeIntelligenceStore((s) => s.followedInfluencerSlugs);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const rows = await fetchArticles();
    setArticles(rows);
    setLoading(false);
    setRefreshing(false);
  }

  const sortedArticles = useMemo(() => {
    if (followedSlugs.length === 0) return articles;
    const followed = new Set(followedSlugs);
    return [...articles].sort((a, b) => {
      const pa = a.influencerSlug && followed.has(a.influencerSlug) ? 0 : 1;
      const pb = b.influencerSlug && followed.has(b.influencerSlug) ? 0 : 1;
      return pa - pb;
    });
  }, [articles, followedSlugs]);

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg }}>
        <Text style={{
          fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
          color: colors.textTertiary, textTransform: "uppercase",
        }}>
          The Issue · This Week
        </Text>
        <Text style={{
          marginTop: 4, fontFamily: fonts.heading, fontSize: 28, color: colors.foreground,
        }}>
          Magazine Feed
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : (
        <FlatList
          data={sortedArticles}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: spacing.xl, paddingTop: 0, paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.xl }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.foreground}
            />
          }
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.lg, gap: spacing.md }}>
              {followedSlugs.length > 0 ? (
                <View style={{
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.pill,
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(10,10,10,0.06)",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                  <Text style={{
                    fontFamily: fonts.body, fontSize: 9, letterSpacing: 2,
                    color: colors.textSecondary, textTransform: "uppercase",
                  }}>
                    From voices you follow
                  </Text>
                  <Text style={{
                    marginTop: 4,
                    fontFamily: fonts.bodyLight, fontSize: 10,
                    color: colors.textTertiary, lineHeight: 15,
                  }}>
                    Linked stories from those creators are shown first.
                  </Text>
                </View>
              ) : null}
              {!env.IS_CONFIGURED ? (
                <View style={{
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.card,
                  borderWidth: 1, borderColor: colors.border,
                }}>
                  <Text style={{
                    fontFamily: fonts.bodyLight, fontSize: 11,
                    color: colors.textSecondary, lineHeight: 16,
                  }}>
                    Showing sample issue. Connect Sanity to publish live content.
                  </Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => nav.navigate("Article", { id: item.id })}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              {item.coverImage ? (
                <Image
                  source={{ uri: item.coverImage }}
                  style={{
                    width: "100%", aspectRatio: 1.2,
                    borderRadius: radius.md, backgroundColor: colors.card,
                  }}
                />
              ) : null}
              <Text style={{
                marginTop: spacing.md,
                fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
                color: colors.textTertiary, textTransform: "uppercase",
              }}>
                {item.category}
              </Text>
              <Text style={{
                marginTop: 4, fontFamily: fonts.heading, fontSize: 22, lineHeight: 28,
                color: colors.foreground,
              }}>
                {item.headline}
              </Text>
              {item.subheadline && (
                <Text style={{
                  marginTop: 4,
                  fontFamily: fonts.bodyLight, fontSize: 13, lineHeight: 18,
                  color: colors.textSecondary,
                }}>
                  {item.subheadline}
                </Text>
              )}
              <Text style={{
                marginTop: spacing.sm,
                fontFamily: fonts.body, fontSize: 10, letterSpacing: 2,
                color: colors.textTertiary, textTransform: "uppercase",
              }}>
                {item.author} · {item.readTime ?? ""}
              </Text>
              {item.deal && (
                <View style={{
                  marginTop: spacing.md, padding: spacing.md,
                  backgroundColor: colors.card,
                  borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
                }}>
                  <Text style={{
                    fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2,
                    color: colors.foreground, textTransform: "uppercase",
                  }}>
                    {item.deal.brand} — Member Offer
                  </Text>
                  <Text style={{
                    marginTop: 2,
                    fontFamily: fonts.bodyLight, fontSize: 11,
                    color: colors.textSecondary,
                  }}>
                    {item.deal.discount} · {item.deal.points} pts
                  </Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
