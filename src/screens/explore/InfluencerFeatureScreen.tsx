import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { ExploreStackParamList, MainTabParamList } from "../../navigation/types";
import { ScreenHeader } from "../../components/ScreenHeader";
import { fetchInfluencer } from "../../data/contentService";
import type { Influencer } from "../../data/types";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useHomeIntelligenceStore } from "../../store/homeIntelligenceStore";

type RP = RouteProp<ExploreStackParamList, "Influencer">;
type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList, "Influencer">,
  BottomTabNavigationProp<MainTabParamList>
>;

export function InfluencerFeatureScreen() {
  const route = useRoute<RP>();
  const navigation = useNavigation<Nav>();
  const { slug } = route.params;
  const [row, setRow] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const followInfluencer = useHomeIntelligenceStore((s) => s.followInfluencer);
  const unfollowInfluencer = useHomeIntelligenceStore((s) => s.unfollowInfluencer);
  const followedSlugs = useHomeIntelligenceStore((s) => s.followedInfluencerSlugs);

  useEffect(() => {
    let alive = true;
    fetchInfluencer(slug).then((inf) => {
      if (!alive) return;
      setRow(inf);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  function openBrand(bs?: string) {
    if (!bs) return;
    navigation.navigate("Brand", { slug: bs });
  }

  function openDeal(code?: string) {
    if (!code) return;
    navigation.navigate("WalletTab", { screen: "Deal", params: { id: code } });
  }

  const following = followedSlugs.includes(slug);

  const toggleFollow = () => {
    if (following) unfollowInfluencer(slug);
    else followInfluencer(slug);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Cover feature" eyebrow="Voice" />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : !row ? (
        <View style={{ padding: spacing.xl }}>
          <Text style={{ fontFamily: fonts.body, color: colors.textSecondary }}>Profile not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
          <ImageBackground
            source={{ uri: row.imageUrl }}
            style={{
              marginHorizontal: spacing.xl,
              height: 280,
              borderRadius: radius.lg,
              overflow: "hidden",
              justifyContent: "flex-end",
            }}
            imageStyle={{ borderRadius: radius.lg }}
          >
            <View style={{ padding: spacing.lg, backgroundColor: "rgba(0,0,0,0.5)" }}>
              <Text style={{
                fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
                color: "rgba(255,255,255,0.75)", textTransform: "uppercase",
              }}>
                {row.role}
              </Text>
              <Text style={{
                marginTop: 4,
                fontFamily: fonts.heading, fontSize: 26, color: "#FFFFFF",
              }}>
                {row.name}
              </Text>
            </View>
          </ImageBackground>

          <Pressable
            onPress={toggleFollow}
            style={({ pressed }) => ({
              marginTop: spacing.lg,
              marginHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: radius.md,
              alignItems: "center",
              backgroundColor: following ? "rgba(30,92,66,0.25)" : colors.muted,
              borderWidth: 1,
              borderColor: following ? "rgba(30,92,66,0.45)" : colors.border,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{
              fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
              color: colors.foreground, textTransform: "uppercase",
            }}>
              {following ? "Following" : "Follow"}
            </Text>
          </Pressable>

          <Text style={{
            marginTop: spacing.xl,
            paddingHorizontal: spacing.xl,
            fontFamily: fonts.headingItalic, fontSize: 18, lineHeight: 26,
            color: colors.foreground,
          }}>
            “{row.quote}”
          </Text>
          {row.subQuote ? (
            <Text style={{
              marginTop: spacing.md,
              paddingHorizontal: spacing.xl,
              fontFamily: fonts.bodyLight, fontSize: 13, lineHeight: 20,
              color: colors.textSecondary,
            }}>
              {row.subQuote}
            </Text>
          ) : null}

          <Text style={{
            marginTop: spacing.xl,
            paddingHorizontal: spacing.xl,
            fontFamily: fonts.heading, fontSize: 20, color: colors.foreground,
          }}>
            {row.featureHeadline}
          </Text>
          <Text style={{
            marginTop: spacing.sm,
            paddingHorizontal: spacing.xl,
            fontFamily: fonts.bodyLight, fontSize: 13, lineHeight: 20,
            color: colors.textSecondary,
          }}>
            {row.featurePreview}
          </Text>

          {row.collabs.length > 0 ? (
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl }}>
              <Text style={SECTION_LABEL}>Collaborations</Text>
              {row.collabs.map((c, i) => (
                <Pressable
                  key={`${c.brand}-${i}`}
                  onPress={() => openBrand(c.brandSlug)}
                  style={({ pressed }) => ({
                    paddingVertical: spacing.md,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.foreground }}>
                    {c.brand}
                  </Text>
                  <Text style={{ fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
                    {c.note}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {row.videos.length > 0 ? (
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl }}>
              <Text style={SECTION_LABEL}>Videos</Text>
              {row.videos.map((v, i) => (
                <View
                  key={`${v.title}-${i}`}
                  style={{
                    marginTop: spacing.md,
                    flexDirection: "row",
                    gap: spacing.md,
                    padding: spacing.md,
                    backgroundColor: colors.card,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {v.thumbnailUrl ? (
                    <Image source={{ uri: v.thumbnailUrl }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
                      {v.title}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textTertiary, marginTop: 4 }}>
                      {v.type.toUpperCase()}
                      {v.duration ? ` · ${v.duration}` : ""}
                    </Text>
                    {v.linkedCouponCode ? (
                      <Pressable onPress={() => openDeal(v.linkedCouponCode)} style={{ marginTop: spacing.sm }}>
                        <Text style={{
                          fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.foreground, letterSpacing: 1,
                        }}>
                          Private benefit →
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const SECTION_LABEL = {
  fontFamily: fonts.body,
  fontSize: 9,
  letterSpacing: 3,
  color: colors.textTertiary,
  textTransform: "uppercase" as const,
  marginBottom: spacing.sm,
};
