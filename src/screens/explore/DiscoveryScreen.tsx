import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
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
  type ExploreEntityAction,
} from "../../data/exploreDiscoveryData";
import { useNotificationBannerStore } from "../../store/notificationBannerStore";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

function exploreCardLayout(screenWidth: number) {
  const w = Math.min(328, Math.max(244, Math.round(screenWidth * 0.84)));
  const featuredHeight = Math.round((w * 9.2) / 16);
  const articleImageHeight = Math.round(w * 0.92);
  const articleFooterHeight = 152;
  return {
    cardWidth: w,
    featuredHeight,
    articleImageHeight,
    articleFooterHeight,
    articleCardHeight: articleImageHeight + articleFooterHeight,
  };
}

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList, "Discovery">,
  BottomTabNavigationProp<MainTabParamList>
>;

function ctaForExploreAction(action: ExploreEntityAction): { label: string; icon: keyof typeof Feather.glyphMap } {
  switch (action.kind) {
    case "copy_code":
      return { label: "Reveal code", icon: "copy" };
    case "activate":
      return { label: "Activate", icon: "external-link" };
    case "get_the_look":
      return { label: "Explore", icon: "chevron-right" };
  }
}

/** Filled primary control (e.g. copy, activate, hub). */
function ExploreFilledButton({
  label,
  onPress,
  icon,
  compact,
  noMarginTop,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  compact?: boolean;
  noMarginTop?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: noMarginTop ? 0 : compact ? spacing.xs : spacing.sm,
        marginBottom: compact ? spacing.sm : 0,
        paddingVertical: compact ? 11 : 13,
        paddingHorizontal: compact ? spacing.md : spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.foreground,
        opacity: pressed ? 0.9 : 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 9,
      })}
    >
      {icon ? <Feather name={icon} size={compact ? 15 : 16} color={colors.inverse} /> : null}
      <Text
        style={{
          fontFamily: fonts.bodyMedium,
          fontSize: compact ? 10 : 11,
          letterSpacing: 1.5,
          color: colors.inverse,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Bordered secondary control (e.g. reveal code). */
function ExploreOutlinedButton({
  label,
  onPress,
  icon,
  compact,
  noMarginTop,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  compact?: boolean;
  noMarginTop?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: noMarginTop ? 0 : compact ? spacing.xs : spacing.sm,
        marginBottom: compact ? spacing.sm : 0,
        paddingVertical: compact ? 11 : 13,
        paddingHorizontal: compact ? spacing.md : spacing.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderFocus,
        backgroundColor: colors.background,
        opacity: pressed ? 0.88 : 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 9,
      })}
    >
      {icon ? <Feather name={icon} size={compact ? 15 : 16} color={colors.foreground} /> : null}
      <Text
        style={{
          fontFamily: fonts.bodyMedium,
          fontSize: compact ? 10 : 11,
          letterSpacing: 1.5,
          color: colors.foreground,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Read-only code field — “vault” look; dimmed when code is still masked. */
function ExploreCodeField({
  value,
  compact,
  tight,
  multiline,
  dimmed,
}: {
  value: string;
  compact?: boolean;
  tight?: boolean;
  multiline?: boolean;
  /** Softer, editorial treatment while the pass is hidden */
  dimmed?: boolean;
}) {
  const fadeBorder = dimmed ? "rgba(10,10,10,0.07)" : "rgba(10,10,10,0.14)";
  const fadeBg = dimmed ? "rgba(248,248,250,0.97)" : "rgba(241,241,244,0.95)";
  const fadeText = dimmed ? "rgba(10,10,10,0.38)" : colors.foreground;
  const tracking = dimmed ? (tight ? 2.8 : 3.2) : tight ? 1.2 : 2;

  return (
    <View
      style={{
        marginTop: tight ? 0 : spacing.xs,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: fadeBorder,
        backgroundColor: fadeBg,
        paddingHorizontal: tight ? 10 : compact ? spacing.md : spacing.md + 2,
        paddingVertical: tight ? 10 : compact ? 11 : 12,
        minHeight: tight ? 40 : multiline ? 52 : 46,
      }}
    >
      {dimmed ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: 10,
            top: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            opacity: 0.35,
          }}
        >
          <Feather name="lock" size={tight ? 12 : 13} color={colors.foreground} />
        </View>
      ) : null}
      <TextInput
        value={value}
        editable={false}
        multiline={multiline}
        scrollEnabled={multiline}
        showSoftInputOnFocus={false}
        style={{
          fontFamily: dimmed ? fonts.bodyLight : fonts.bodyMedium,
          fontSize: tight ? 13 : compact ? 14 : 15,
          letterSpacing: tracking,
          color: fadeText,
          padding: 0,
          margin: 0,
          minHeight: multiline ? 30 : tight ? 20 : 22,
          paddingRight: dimmed ? (tight ? 22 : 26) : 0,
        }}
      />
    </View>
  );
}

/** First character visible; remaining characters shown as bullet masks (password-style). */
function maskPartnerCode(code: string): string {
  const c = code.trim();
  if (!c) return "• • • • • •";
  if (c.length === 1) return c;
  return `${c[0]}${"\u2022".repeat(c.length - 1)}`;
}

function ExploreMaskedCodeBlock({
  code,
  compact,
  tight,
  onReveal,
}: {
  code: string;
  compact?: boolean;
  /** Compact vertical rhythm for fixed-height carousel cards */
  tight?: boolean;
  onReveal?: () => void;
}) {
  const showBanner = useNotificationBannerStore((s) => s.show);
  const plain = code.trim();
  const needsRevealStep = plain.length > 1;
  const [revealed, setRevealed] = useState(!needsRevealStep);
  const sheetMultiline = !tight && !compact;

  useEffect(() => {
    if (!needsRevealStep || !revealed) return;
    const t = setTimeout(() => {
      setRevealed(false);
    }, 30_000);
    return () => clearTimeout(t);
  }, [needsRevealStep, revealed]);

  const onRevealPress = async () => {
    onReveal?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!plain) return;
    await Clipboard.setStringAsync(plain);
    Haptics.selectionAsync();
    showBanner(
      "Code copied",
      "Partner code is on your clipboard. It stays visible here for 30 seconds.",
    );
    setRevealed(true);
  };

  const onCopyPress = async () => {
    if (!plain) return;
    await Clipboard.setStringAsync(plain);
    Haptics.selectionAsync();
    showBanner("Code copied", "Partner code is on your clipboard.");
  };

  if (!plain) {
    return (
      <Text
        style={{
          marginTop: compact ? spacing.sm : spacing.sm,
          fontFamily: fonts.bodyLight,
          fontSize: 11,
          color: colors.textTertiary,
        }}
      >
        Code unavailable
      </Text>
    );
  }

  const display = revealed ? plain : maskPartnerCode(code);

  return (
    <View style={{ marginTop: tight ? 0 : spacing.xs }}>
      <ExploreCodeField
        value={display}
        compact={compact}
        tight={tight}
        multiline={sheetMultiline}
        dimmed={needsRevealStep && !revealed}
      />
      {!needsRevealStep ? (
        <ExploreFilledButton label="Copy code" onPress={onCopyPress} icon="copy" compact={Boolean(tight || compact)} />
      ) : !revealed ? (
        <ExploreOutlinedButton
          label="Reveal code"
          onPress={onRevealPress}
          icon="eye"
          compact={Boolean(tight || compact)}
        />
      ) : (
        <ExploreOutlinedButton
          label="Copy again"
          onPress={onCopyPress}
          icon="copy"
          compact={Boolean(tight || compact)}
        />
      )}
    </View>
  );
}

export function DiscoveryScreen() {
  const nav = useNavigation<Nav>();
  const { session } = useAuth();
  const recordCategoryClick = useHomeIntelligenceStore((s) => s.recordCategoryClick);
  const showBanner = useNotificationBannerStore((s) => s.show);
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

  const { width: screenWidth } = useWindowDimensions();
  const { cardWidth, featuredHeight, articleImageHeight, articleFooterHeight, articleCardHeight } = useMemo(
    () => exploreCardLayout(screenWidth),
    [screenWidth],
  );

  const onExploreEntity = useCallback(
    async (card: ExploreArticleCard, tag: string) => {
      recordCategoryClick(tag);
      const { action } = card;
      if (action.kind === "get_the_look") {
        nav.navigate("DiscoverTab", { screen: "Article", params: { id: card.id, fromExplore: true } });
        return;
      }
      if (action.kind === "copy_code") {
        return;
      }
      const raw = action.url.trim();
      const url = raw.startsWith("http") ? raw : `https://${raw}`;
      try {
        await Linking.openURL(url);
      } catch {
        showBanner("Could not open link", "Check the URL configured for this story.");
      }
    },
    [nav, recordCategoryClick, showBanner],
  );

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
      nav.navigate("DiscoverTab", { screen: "Feed" });
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
            Stories by world — swipe each row. Each cover is a code, a partner link, or an editorial to open.
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
                width: cardWidth,
                height: featuredHeight,
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
                  width={cardWidth}
                  imageHeight={articleImageHeight}
                  footerHeight={articleFooterHeight}
                  cardHeight={articleCardHeight}
                  onPress={() => onExploreEntity(article, cat.tag)}
                  onRevealCode={() => recordCategoryClick(cat.tag)}
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
                  {selected.editorialNote}
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
                {selected.articles.map((article, i, arr) => {
                  const cta = ctaForExploreAction(article.action);
                  const isCopy = article.action.kind === "copy_code";
                  const rowStyle = {
                    flexDirection: "row" as const,
                    alignItems: "center" as const,
                    paddingVertical: spacing.md,
                    gap: spacing.md,
                    borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                  };
                  const inner = (
                    <>
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
                        {article.action.kind === "copy_code" ? (
                          <ExploreMaskedCodeBlock
                            code={article.action.code}
                            onReveal={() => recordCategoryClick(selected.tag)}
                          />
                        ) : (
                          <View style={{ marginTop: spacing.sm, alignSelf: "stretch" }}>
                            {article.action.kind === "activate" ? (
                              <View
                                style={{
                                  paddingVertical: 11,
                                  paddingHorizontal: spacing.md,
                                  borderRadius: radius.md,
                                  backgroundColor: colors.foreground,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 9,
                                }}
                              >
                                <Feather name={cta.icon} size={15} color={colors.inverse} />
                                <Text
                                  style={{
                                    fontFamily: fonts.bodyMedium,
                                    fontSize: 11,
                                    letterSpacing: 1.5,
                                    color: colors.inverse,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {cta.label}
                                </Text>
                              </View>
                            ) : (
                              <View
                                style={{
                                  paddingVertical: 11,
                                  paddingHorizontal: spacing.md,
                                  borderRadius: radius.md,
                                  borderWidth: 1,
                                  borderColor: colors.borderFocus,
                                  backgroundColor: colors.background,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 9,
                                }}
                              >
                                <Feather name={cta.icon} size={15} color={colors.foreground} />
                                <Text
                                  style={{
                                    fontFamily: fonts.bodyMedium,
                                    fontSize: 11,
                                    letterSpacing: 1.5,
                                    color: colors.foreground,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {cta.label}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </>
                  );
                  if (isCopy) {
                    return (
                      <View key={article.id} style={rowStyle}>
                        {inner}
                      </View>
                    );
                  }
                  return (
                    <Pressable
                      key={article.id}
                      onPress={() => {
                        const tag = selected.tag;
                        setSelected(null);
                        onExploreEntity(article, tag);
                      }}
                      style={({ pressed }) => ({
                        ...rowStyle,
                        opacity: pressed ? 0.76 : 1,
                      })}
                    >
                      {inner}
                    </Pressable>
                  );
                })}

                <View style={{ marginTop: spacing.lg }}>
                  <ExploreFilledButton
                    label="Enter this hub"
                    onPress={followHubLink}
                    icon="chevron-right"
                    noMarginTop
                  />
                </View>
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
  imageHeight,
  footerHeight,
  cardHeight,
  onPress,
  onRevealCode,
}: {
  article: ExploreArticleCard;
  width: number;
  imageHeight: number;
  footerHeight: number;
  cardHeight: number;
  onPress: () => void;
  onRevealCode?: () => void;
}) {
  const cta = ctaForExploreAction(article.action);
  const isCopy = article.action.kind === "copy_code";

  const inner = (
    <View
      style={{
        width,
        height: cardHeight,
        borderRadius: radius.lg,
        overflow: "hidden",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Image
        source={{ uri: article.imageUrl }}
        style={{ width, height: imageHeight }}
        contentFit="cover"
        transition={200}
      />
      <View
        style={{
          height: footerHeight,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fonts.heading,
              fontSize: 14,
              lineHeight: 18,
              color: colors.foreground,
            }}
          >
            {article.headline}
          </Text>
          <Text
            style={{
              marginTop: spacing.xs,
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
        {article.action.kind === "copy_code" ? (
          <View style={{ alignSelf: "stretch", flexShrink: 0 }}>
            <ExploreMaskedCodeBlock code={article.action.code} compact tight onReveal={onRevealCode} />
          </View>
        ) : (
          <View style={{ alignSelf: "stretch", flexShrink: 0, marginBottom: spacing.sm }} pointerEvents="none">
            {article.action.kind === "activate" ? (
              <View
                style={{
                  paddingVertical: 11,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.foreground,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                }}
              >
                <Feather name={cta.icon} size={15} color={colors.inverse} />
                <Text
                  style={{
                    fontFamily: fonts.bodyMedium,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: colors.inverse,
                    textTransform: "uppercase",
                  }}
                >
                  {cta.label}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  paddingVertical: 11,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.borderFocus,
                  backgroundColor: colors.background,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                }}
              >
                <Feather name={cta.icon} size={15} color={colors.foreground} />
                <Text
                  style={{
                    fontFamily: fonts.bodyMedium,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: colors.foreground,
                    textTransform: "uppercase",
                  }}
                >
                  {cta.label}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  if (isCopy) {
    return <View style={{ width }}>{inner}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {inner}
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
