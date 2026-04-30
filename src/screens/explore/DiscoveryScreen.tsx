import { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type {
  ExploreStackParamList,
  MainTabParamList,
} from "../../navigation/types";
import { env } from "../../lib/env";
import { previewBrowseNavigationRef } from "../../navigation/previewBrowseNavigation";
import { useAuth } from "../../auth/AuthProvider";
import { useHomeIntelligenceStore } from "../../store/homeIntelligenceStore";
import {
  DISCOVERY_CATEGORIES,
  type DiscoveryCategory,
  type ExploreArticleCard,
} from "../../data/exploreDiscoveryData";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList, "Discovery">,
  BottomTabNavigationProp<MainTabParamList>
>;

export function DiscoveryScreen() {
  const nav = useNavigation<Nav>();
  const { session } = useAuth();
  const recordCategoryClick = useHomeIntelligenceStore((s) => s.recordCategoryClick);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selected, setSelected] = useState<DiscoveryCategory | null>(null);

  const tags = useMemo(() => {
    const seen: string[] = [];
    DISCOVERY_CATEGORIES.forEach((c) => {
      if (!seen.includes(c.tag)) seen.push(c.tag);
    });
    return seen;
  }, []);

  const visible = useMemo(
    () => (activeTag ? DISCOVERY_CATEGORIES.filter((c) => c.tag === activeTag) : DISCOVERY_CATEGORIES),
    [activeTag],
  );

  const screenWidth = Dimensions.get("window").width;
  const cardW = Math.min(176, (screenWidth - spacing.xl * 2 - spacing.md * 2) / 2.05);

  function openArticle(articleId: string, tag: string) {
    recordCategoryClick(tag);
    nav.navigate("IssueTab", { screen: "Article", params: { id: articleId } });
  }

  function openCategorySheet(cat: DiscoveryCategory) {
    setSelected(cat);
  }

  function followHubLink() {
    if (!selected) return;
    const cat = selected;

    if (env.PREVIEW_MODE && !session) {
      setSelected(null);
      if (previewBrowseNavigationRef.isReady()) {
        previewBrowseNavigationRef.navigate("Welcome");
      }
      return;
    }

    recordCategoryClick(cat.tag);
    setSelected(null);

    if (cat.listingCategory) {
      nav.navigate("CategoryListings", { category: cat.listingCategory });
    } else if (cat.route === "Brand" && cat.routeParam) {
      nav.navigate("Brand", { slug: cat.routeParam });
    } else if (cat.route === "Influencer" && cat.routeParam) {
      nav.navigate("Influencer", { slug: cat.routeParam });
    } else if (cat.route === "Lifestyle") {
      nav.navigate("Lifestyle");
    } else if (cat.route === "Automotive") {
      nav.navigate("Automotive");
    } else {
      nav.navigate("IssueTab", { screen: "Feed" });
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 9,
              letterSpacing: 3,
              color: colors.textTertiary,
              textTransform: "uppercase",
            }}
          >
            Explore
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontFamily: fonts.heading,
              fontSize: 30,
              lineHeight: 34,
              color: colors.foreground,
            }}
          >
            Curated{"\n"}Discovery
          </Text>
          <Text
            style={{
              marginTop: spacing.sm,
              fontFamily: fonts.bodyLight,
              fontSize: 13,
              lineHeight: 20,
              color: colors.textSecondary,
            }}
          >
            Stories by world — swipe each row, tap a cover to read, or open the full hub.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Pill label="All" active={activeTag === null} onPress={() => setActiveTag(null)} />
          {tags.map((tag) => (
            <Pill
              key={tag}
              label={tag}
              active={activeTag === tag}
              onPress={() => setActiveTag(tag === activeTag ? null : tag)}
            />
          ))}
        </ScrollView>

        <Text
          style={{
            paddingHorizontal: spacing.xl,
            marginBottom: spacing.sm,
            fontFamily: fonts.body,
            fontSize: 9,
            letterSpacing: 3,
            color: colors.textTertiary,
            textTransform: "uppercase",
          }}
        >
          Featured worlds
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.md,
            gap: spacing.md,
          }}
        >
          {visible.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => openCategorySheet(cat)}
              style={({ pressed }) => ({
                width: screenWidth * 0.72,
                aspectRatio: 16 / 10,
                borderRadius: radius.lg,
                overflow: "hidden",
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Image
                source={{ uri: cat.heroImage }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  top: 0,
                  backgroundColor: "rgba(8,8,10,0.35)",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: spacing.md,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 9,
                    letterSpacing: 2,
                    color: "rgba(255,255,255,0.85)",
                    textTransform: "uppercase",
                  }}
                >
                  {cat.tag} · {cat.articlesCount} stories
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontFamily: fonts.heading,
                    fontSize: 20,
                    lineHeight: 24,
                    color: "#FFFFFF",
                  }}
                >
                  {cat.label}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontFamily: fonts.bodyLight,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {cat.sublabel}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {visible.map((cat) => (
          <View key={cat.id} style={{ marginTop: spacing.xl }}>
            <Pressable
              onPress={() => openCategorySheet(cat)}
              style={{
                paddingHorizontal: spacing.xl,
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 9,
                    letterSpacing: 3,
                    color: colors.textTertiary,
                    textTransform: "uppercase",
                  }}
                >
                  {cat.tag}
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontFamily: fonts.heading,
                    fontSize: 22,
                    lineHeight: 26,
                    color: colors.foreground,
                  }}
                >
                  {cat.label}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontFamily: fonts.bodyLight,
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  {cat.sublabel}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text
                  style={{
                    fontFamily: fonts.bodyMedium,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: colors.textTertiary,
                    textTransform: "uppercase",
                  }}
                >
                  Hub
                </Text>
                <Feather name="chevron-right" size={16} color={colors.textTertiary} />
              </View>
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: spacing.xl,
                gap: spacing.md,
                paddingBottom: spacing.xs,
              }}
            >
              {cat.articles.map((article) => (
                <ArticleCarouselCard
                  key={`${cat.id}-${article.id}`}
                  article={article}
                  width={cardW}
                  onPress={() => openArticle(article.id, cat.tag)}
                />
              ))}
            </ScrollView>
          </View>
        ))}

        {visible.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, alignItems: "center" }}>
            <Text
              style={{
                fontFamily: fonts.bodyLight,
                fontSize: 12,
                color: colors.textTertiary,
                textAlign: "center",
              }}
            >
              No categories under this tag yet.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={selected !== null} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(10,10,10,0.45)" }}
          onPress={() => setSelected(null)}
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xxl,
            maxHeight: "82%",
          }}
        >
          <View style={{ alignItems: "center", paddingVertical: spacing.xs }}>
            <View style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          {selected ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingHorizontal: spacing.xl,
                  paddingTop: spacing.sm,
                }}
              >
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 9,
                      letterSpacing: 2.5,
                      color: colors.textTertiary,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {selected.tag}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.heading,
                      fontSize: 24,
                      lineHeight: 28,
                      color: colors.foreground,
                    }}
                  >
                    {selected.label}
                  </Text>
                </View>
                <Pressable hitSlop={12} onPress={() => setSelected(null)}>
                  <Feather name="x" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View
                style={{
                  marginTop: spacing.md,
                  marginHorizontal: spacing.xl,
                  borderRadius: radius.md,
                  overflow: "hidden",
                  height: 140,
                }}
              >
                <Image
                  source={{ uri: selected.heroImage }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  transition={200}
                />
              </View>

              <View
                style={{
                  marginTop: spacing.md,
                  marginHorizontal: spacing.xl,
                  paddingLeft: spacing.md,
                  borderLeftWidth: 2,
                  borderLeftColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.headingItalic,
                    fontSize: 13,
                    lineHeight: 19,
                    color: colors.textSecondary,
                  }}
                >
                  {selected.issueNote}
                </Text>
              </View>

              <Text
                style={{
                  marginTop: spacing.lg,
                  marginHorizontal: spacing.xl,
                  fontFamily: fonts.bodyMedium,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: colors.textTertiary,
                  textTransform: "uppercase",
                }}
              >
                In this world
              </Text>

              <ScrollView
                style={{ marginTop: spacing.sm }}
                contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl }}
              >
                {selected.articles.map((article, i, arr) => (
                  <Pressable
                    key={article.id}
                    onPress={() => {
                      const tag = selected.tag;
                      setSelected(null);
                      openArticle(article.id, tag);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: spacing.md,
                      gap: spacing.md,
                      borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                      borderBottomColor: colors.border,
                      opacity: pressed ? 0.76 : 1,
                    })}
                  >
                    <Image
                      source={{ uri: article.imageUrl }}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: radius.md,
                        backgroundColor: colors.muted,
                      }}
                      contentFit="cover"
                      transition={150}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: fonts.heading,
                          fontSize: 15,
                          lineHeight: 20,
                          color: colors.foreground,
                          marginBottom: 4,
                        }}
                      >
                        {article.headline}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Text
                          style={{
                            fontFamily: fonts.body,
                            fontSize: 10,
                            letterSpacing: 1.5,
                            color: colors.textTertiary,
                            textTransform: "uppercase",
                          }}
                        >
                          {article.author}
                        </Text>
                        <Text style={{ color: colors.textFaint, fontSize: 10 }}>·</Text>
                        <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textTertiary }}>
                          {article.readTime}
                        </Text>
                      </View>
                    </View>
                    <Feather name="arrow-right" size={14} color={colors.textTertiary} />
                  </Pressable>
                ))}

                <Pressable
                  onPress={followHubLink}
                  style={{
                    marginTop: spacing.lg,
                    paddingVertical: spacing.md,
                    alignItems: "center",
                    borderRadius: radius.md,
                    backgroundColor: colors.foreground,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bodyMedium,
                      fontSize: 10,
                      letterSpacing: 3,
                      color: colors.inverse,
                      textTransform: "uppercase",
                    }}
                  >
                    Enter this hub →
                  </Text>
                </Pressable>
              </ScrollView>
            </>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ArticleCarouselCard({
  article,
  width,
  onPress,
}: {
  article: ExploreArticleCard;
  width: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View
        style={{
          borderRadius: radius.lg,
          overflow: "hidden",
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Image
          source={{ uri: article.imageUrl }}
          style={{ width: "100%", aspectRatio: 3 / 4 }}
          contentFit="cover"
          transition={200}
        />
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
            {article.author} · {article.readTime}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active ? "rgba(10,10,10,0.35)" : colors.border,
        backgroundColor: active ? "rgba(10,10,10,0.06)" : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: active ? fonts.bodyMedium : fonts.body,
          fontSize: 10,
          letterSpacing: 1.5,
          color: active ? colors.foreground : colors.textTertiary,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
