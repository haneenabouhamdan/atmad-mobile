import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
  useRoute,
  type CompositeNavigationProp,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type {
  DiscoverStackParamList,
  MainTabParamList,
} from "../../navigation/types";
import { useAuth } from "../../auth/AuthProvider";
import { useArticleEngagementTracking } from "../../hooks/useArticleEngagementTracking";
import { fetchArticles } from "../../data/contentService";
import type { Article } from "../../data/types";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useSavedArticlesStore } from "../../store/savedArticlesStore";
import { useNotificationBannerStore } from "../../store/notificationBannerStore";
import { DiscoverStoryCommentsSheet } from "../../components/DiscoverStoryCommentsSheet";
import { DiscoverStoryEngagementBar } from "../../components/DiscoverStoryEngagementBar";
import { EditorialVideoPlayer } from "../../components/EditorialVideoPlayer";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<DiscoverStackParamList, "Article">,
  BottomTabNavigationProp<MainTabParamList>
>;
type R = RouteProp<DiscoverStackParamList, "Article">;

function articleShowsGetTheLook(article: Article): boolean {
  const items = article.lookbookItems ?? [];
  const showDefault =
    items.length === 0 &&
    (Boolean(article.linkedListingId) ||
      article.getTheLook === true ||
      article.type === "spread");
  return items.length > 0 || showDefault;
}

function ArticleGetTheLookFooter({
  article,
  onOpenListing,
  onBrowseSimilar,
}: {
  article: Article;
  onOpenListing: (listingId: string) => void;
  onBrowseSimilar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);
  const items = article.lookbookItems ?? [];

  const onItemPress = (item: (typeof items)[number]) => {
    if (item.listingId) onOpenListing(item.listingId);
    else onBrowseSimilar();
    setPickerOpen(false);
  };

  const onDefaultPress = () => {
    if (article.linkedListingId) onOpenListing(article.linkedListingId);
    else onBrowseSimilar();
  };

  const onPrimaryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (items.length === 0) onDefaultPress();
    else if (items.length === 1) onItemPress(items[0]);
    else setPickerOpen(true);
  };

  if (!articleShowsGetTheLook(article)) return null;

  return (
    <>
      <View
        style={{
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xs + insets.bottom,
        }}
      >
        <Pressable
          onPress={onPrimaryPress}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            paddingVertical: spacing.sm + 2,
            borderRadius: radius.pill,
            backgroundColor: colors.foreground,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 11,
              letterSpacing: 2.4,
              color: colors.inverse,
              textTransform: "uppercase",
            }}
          >
            Get the look
          </Text>
          <Feather name="chevron-right" size={16} color={colors.inverse} />
        </Pressable>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: "rgba(0,0,0,0.45)", zIndex: 0 },
            ]}
            onPress={() => setPickerOpen(false)}
          />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xl + insets.bottom,
              paddingHorizontal: spacing.lg,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              zIndex: 1,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 10,
                letterSpacing: 2,
                color: colors.textTertiary,
                textTransform: "uppercase",
                marginBottom: spacing.md,
                textAlign: "center",
              }}
            >
              Shop the shoot
            </Text>
            {items.map((item, i) => (
              <Pressable
                key={`${item.label}-${i}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onItemPress(item);
                }}
                style={({ pressed }) => ({
                  paddingVertical: spacing.md,
                  borderTopWidth: i > 0 ? StyleSheet.hairlineWidth : 0,
                  borderTopColor: colors.border,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 15,
                    lineHeight: 20,
                    color: colors.foreground,
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={({ pressed }) => ({
                marginTop: spacing.md,
                paddingVertical: spacing.sm,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function ArticleScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const { session, refreshProfile } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const articleId = route.params.id;
  const fromExplore = route.params.fromExplore === true;
  const saved = useSavedArticlesStore((s) => s.hasArticle(articleId));
  const saveArticle = useSavedArticlesStore((s) => s.saveArticle);
  const removeArticle = useSavedArticlesStore((s) => s.removeArticle);
  const showBanner = useNotificationBannerStore((s) => s.show);

  const leaveArticle = useCallback(() => {
    if (fromExplore) {
      if (nav.canGoBack()) {
        nav.goBack();
      } else {
        nav.dispatch(
          CommonActions.navigate({
            name: "DiscoverTab",
            params: { screen: "Feed" },
          }),
        );
      }
      nav.navigate("ExploreTab", { screen: "Discovery" });
      return;
    }
    if (nav.canGoBack()) {
      nav.goBack();
      return;
    }
    const parent = nav.getParent();
    if (parent?.canGoBack?.()) {
      parent.goBack();
      return;
    }
    nav.dispatch(
      CommonActions.navigate({
        name: "DiscoverTab",
        params: { screen: "Feed" },
      }),
    );
  }, [fromExplore, nav]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        leaveArticle();
        return true;
      });
      return () => sub.remove();
    }, [leaveArticle]),
  );

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

  const articleCoverHeight = windowHeight * 0.4;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
      }}>
        <Pressable
          onPress={leaveArticle}
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
            {fromExplore ? "Explore" : "Discover"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (loading || notFound) return;
            if (saved) {
              removeArticle(articleId);
              showBanner("Removed", "Article removed from your saved list.");
            } else {
              saveArticle(articleId);
              showBanner("Saved", "Find this story anytime from your bookmark.");
            }
          }}
          hitSlop={12}
          disabled={loading || notFound}
          style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
        >
          <Feather name="bookmark" size={18} color={saved ? colors.foreground : colors.textTertiary} />
        </Pressable>
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
            This piece may have been retired from Discover.
          </Text>
          <Pressable
            onPress={leaveArticle}
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
        <View style={{ flex: 1 }}>
        <ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {article.videoUrl?.trim() ? (
            <EditorialVideoPlayer
              uri={article.videoUrl.trim()}
              posterUri={article.coverImage}
              aspectRatio={16 / 9}
              useNativeControls
            />
          ) : article.coverImage ? (
            <Image
              source={{ uri: article.coverImage }}
              style={{
                width: "100%",
                height: articleCoverHeight,
                backgroundColor: colors.card,
              }}
              resizeMode="cover"
            />
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
              paddingBottom: spacing.md,
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

            <DiscoverStoryEngagementBar
              articleId={article.id}
              onOpenComments={() => setCommentsOpen(true)}
            />
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
        </ScrollView>
        <ArticleGetTheLookFooter
          article={article}
          onOpenListing={(id) => nav.navigate("Listing", { id })}
          onBrowseSimilar={() =>
            showBanner("Curated edit", "Open Explore → Fashion to shop picks in this world.")
          }
        />
        </View>
      )}

      <DiscoverStoryCommentsSheet
        visible={commentsOpen && !notFound && Boolean(article)}
        storyId={articleId}
        headline={article?.headline ?? ""}
        onClose={() => setCommentsOpen(false)}
      />
    </SafeAreaView>
  );
}
