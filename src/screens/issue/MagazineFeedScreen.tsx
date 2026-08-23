import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { DiscoverStackParamList, MainTabParamList } from "../../navigation/types";
import { fetchArticles } from "../../data/contentService";
import type { Article } from "../../data/types";
import { buildDiscoverFeed } from "../../data/discoverFeed";
import { env } from "../../lib/env";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { DiscoverStoryEngagementBar } from "../../components/DiscoverStoryEngagementBar";
import { DiscoverStoryCommentsSheet } from "../../components/DiscoverStoryCommentsSheet";
import { EditorialVideoPlayer } from "../../components/EditorialVideoPlayer";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<DiscoverStackParamList, "Feed">,
  BottomTabNavigationProp<MainTabParamList>
>;

const articleCardOutline = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.lg,
  backgroundColor: colors.card,
  overflow: "hidden" as const,
};

export function MagazineFeedScreen() {
  const nav = useNavigation<Nav>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentStory, setCommentStory] = useState<{ id: string; headline: string } | null>(null);

  async function load() {
    const rows = await fetchArticles();
    setArticles(rows);
    setLoading(false);
    setRefreshing(false);
  }

  const feedRows = useMemo(() => buildDiscoverFeed(articles), [articles]);

  const mustReadCardWidth = useMemo(() => {
    const w = Dimensions.get("window").width;
    return Math.min(200, (w - spacing.xl * 2 - spacing.md * 2) / 2.05);
  }, []);

  useEffect(() => {
    load();
  }, []);

  const openArticle = useCallback(
    (id: string) => {
      nav.navigate("Article", { id });
    },
    [nav],
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 9,
            letterSpacing: 3,
            color: colors.textTertiary,
            textTransform: "uppercase",
          }}
        >
          Discover
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: fonts.heading,
            fontSize: 28,
            color: colors.foreground,
          }}
        >
          Magazine
        </Text>
        <Text
          style={{
            marginTop: spacing.xs,
            fontFamily: fonts.bodyLight,
            fontSize: 12,
            lineHeight: 18,
            color: colors.textSecondary,
          }}
        >
          Stories, film, and editorial — curated only.
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : (
        <FlatList
          data={feedRows}
          keyExtractor={(r) => r.id}
          removeClippedSubviews={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: 120,
            paddingTop: spacing.sm,
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.foreground}
            />
          }
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.lg, gap: spacing.md }}>
              {!env.IS_CONFIGURED ? (
                <View
                  style={{
                    padding: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bodyLight,
                      fontSize: 11,
                      color: colors.textSecondary,
                      lineHeight: 16,
                    }}
                  >
                    Sample Discover magazine. Connect Sanity for live editorial.
                  </Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            if (item.kind === "section") {
              return (
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 9,
                    letterSpacing: 3,
                    color: colors.textTertiary,
                    textTransform: "uppercase",
                    marginTop: spacing.xs,
                  }}
                >
                  {item.title}
                </Text>
              );
            }
            if (item.kind === "mustReadRail") {
              return (
                <View style={{ marginHorizontal: -spacing.xl }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: spacing.xl,
                      gap: spacing.md,
                      paddingBottom: 2,
                    }}
                  >
                    {item.articles.map((article) => (
                      <View
                        key={article.id}
                        style={{ width: mustReadCardWidth, ...articleCardOutline }}
                      >
                        <Pressable
                          onPress={() => openArticle(article.id)}
                          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
                        >
                          {article.coverImage ? (
                            <Image
                              source={{ uri: article.coverImage }}
                              style={{
                                width: "100%",
                                aspectRatio: 3 / 4,
                                backgroundColor: colors.muted,
                              }}
                            />
                          ) : null}
                          <View style={{ padding: spacing.md }}>
                            <Text
                              numberOfLines={3}
                              style={{
                                fontFamily: fonts.heading,
                                fontSize: 15,
                                lineHeight: 19,
                                color: colors.foreground,
                              }}
                            >
                              {article.headline}
                            </Text>
                            <Text
                              style={{
                                marginTop: spacing.sm,
                                fontFamily: fonts.body,
                                fontSize: 9,
                                letterSpacing: 1.5,
                                color: colors.textTertiary,
                                textTransform: "uppercase",
                              }}
                              numberOfLines={1}
                            >
                              {article.author} · {article.readTime ?? ""}
                            </Text>
                          </View>
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              );
            }
            if (item.kind === "article") {
              const { article, layout } = item;
              if (layout === "hero") {
                return (
                  <View style={articleCardOutline}>
                    <Pressable
                      onPress={() => openArticle(article.id)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
                    >
                      {article.coverImage ? (
                        <Image
                          source={{ uri: article.coverImage }}
                          style={{
                            width: "100%",
                            aspectRatio: 1.12,
                            backgroundColor: colors.muted,
                          }}
                        />
                      ) : null}
                      <View style={{ padding: spacing.md }}>
                        <Text
                          style={{
                            fontFamily: fonts.body,
                            fontSize: 9,
                            letterSpacing: 3,
                            color: colors.textTertiary,
                            textTransform: "uppercase",
                          }}
                        >
                          {article.category}
                        </Text>
                        <Text
                          style={{
                            marginTop: spacing.xs,
                            fontFamily: fonts.heading,
                            fontSize: 26,
                            lineHeight: 32,
                            color: colors.foreground,
                          }}
                        >
                          {article.headline}
                        </Text>
                        {article.subheadline ? (
                          <Text
                            style={{
                              marginTop: spacing.sm,
                              fontFamily: fonts.bodyLight,
                              fontSize: 14,
                              lineHeight: 20,
                              color: colors.textSecondary,
                            }}
                          >
                            {article.subheadline}
                          </Text>
                        ) : null}
                        <Text
                          style={{
                            marginTop: spacing.md,
                            fontFamily: fonts.body,
                            fontSize: 10,
                            letterSpacing: 2,
                            color: colors.textTertiary,
                            textTransform: "uppercase",
                          }}
                        >
                          By {article.author}
                          {article.readTime ? ` · ${article.readTime}` : ""}
                        </Text>
                      </View>
                    </Pressable>
                    <DiscoverStoryEngagementBar
                      articleId={article.id}
                      onOpenComments={() =>
                        setCommentStory({ id: article.id, headline: article.headline })
                      }
                    />
                  </View>
                );
              }
              return (
                <View style={articleCardOutline}>
                  <Pressable
                    onPress={() => openArticle(article.id)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
                  >
                    {article.coverImage ? (
                      <Image
                        source={{ uri: article.coverImage }}
                        style={{
                          width: "100%",
                          aspectRatio: 1.25,
                          backgroundColor: colors.muted,
                        }}
                      />
                    ) : null}
                    <View style={{ padding: spacing.md }}>
                      <Text
                        style={{
                          fontFamily: fonts.body,
                          fontSize: 9,
                          letterSpacing: 3,
                          color: colors.textTertiary,
                          textTransform: "uppercase",
                        }}
                      >
                        {article.category}
                      </Text>
                      <Text
                        style={{
                          marginTop: 4,
                          fontFamily: fonts.heading,
                          fontSize: 22,
                          lineHeight: 28,
                          color: colors.foreground,
                        }}
                      >
                        {article.headline}
                      </Text>
                      {article.subheadline ? (
                        <Text
                          style={{
                            marginTop: 4,
                            fontFamily: fonts.bodyLight,
                            fontSize: 13,
                            lineHeight: 18,
                            color: colors.textSecondary,
                          }}
                        >
                          {article.subheadline}
                        </Text>
                      ) : null}
                      <Text
                        style={{
                          marginTop: spacing.sm,
                          fontFamily: fonts.body,
                          fontSize: 10,
                          letterSpacing: 2,
                          color: colors.textTertiary,
                          textTransform: "uppercase",
                        }}
                      >
                        {article.author} · {article.readTime ?? ""}
                      </Text>
                    </View>
                  </Pressable>
                  <DiscoverStoryEngagementBar
                    articleId={article.id}
                    onOpenComments={() =>
                      setCommentStory({ id: article.id, headline: article.headline })
                    }
                  />
                </View>
              );
            }
            if (item.kind === "video") {
              const { article } = item;
              const videoUri = article.videoUrl?.trim() ?? "";
              return (
                <View style={articleCardOutline}>
                  {videoUri ? (
                    <EditorialVideoPlayer
                      uri={videoUri}
                      posterUri={article.coverImage}
                      aspectRatio={16 / 9}
                      useNativeControls
                    />
                  ) : article.coverImage ? (
                    <Image
                      source={{ uri: article.coverImage }}
                      style={{
                        width: "100%",
                        aspectRatio: 16 / 9,
                        backgroundColor: colors.muted,
                      }}
                    />
                  ) : null}
                  <Pressable onPress={() => openArticle(article.id)}>
                    <View style={{ padding: spacing.md }}>
                      <Text
                        style={{
                          fontFamily: fonts.body,
                          fontSize: 9,
                          letterSpacing: 3,
                          color: colors.textTertiary,
                          textTransform: "uppercase",
                        }}
                      >
                        Video · {article.category}
                      </Text>
                      <Text
                        style={{
                          marginTop: 4,
                          fontFamily: fonts.heading,
                          fontSize: 22,
                          lineHeight: 28,
                          color: colors.foreground,
                        }}
                      >
                        {article.headline}
                      </Text>
                      <Text
                        style={{
                          marginTop: spacing.sm,
                          fontFamily: fonts.body,
                          fontSize: 10,
                          letterSpacing: 2,
                          color: colors.textTertiary,
                          textTransform: "uppercase",
                        }}
                      >
                        Watch in story · {article.readTime ?? ""}
                      </Text>
                    </View>
                  </Pressable>
                  <DiscoverStoryEngagementBar
                    articleId={article.id}
                    onOpenComments={() =>
                      setCommentStory({ id: article.id, headline: article.headline })
                    }
                  />
                </View>
              );
            }
            return null;
          }}
        />
      )}

      <DiscoverStoryCommentsSheet
        visible={commentStory !== null}
        storyId={commentStory?.id ?? ""}
        headline={commentStory?.headline ?? ""}
        onClose={() => setCommentStory(null)}
      />
    </SafeAreaView>
  );
}
