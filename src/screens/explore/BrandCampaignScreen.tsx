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
import { fetchBrand } from "../../data/contentService";
import type { Brand as BrandType } from "../../data/types";
import { mockDeals } from "../../data/mock";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useHomeIntelligenceStore } from "../../store/homeIntelligenceStore";

type RP = RouteProp<ExploreStackParamList, "Brand">;
type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList, "Brand">,
  BottomTabNavigationProp<MainTabParamList>
>;

function pickDealForBrand(brand: BrandType): { code: string; label: string } | null {
  const name = brand.name.toUpperCase();
  const hit = mockDeals.find(
    (d) => d.brand.toUpperCase() === name || d.brand.toUpperCase().includes(name) || name.includes(d.brand.toUpperCase()),
  );
  if (hit) return { code: hit.code, label: hit.description };
  const byCat = mockDeals.find(
    (d) => String(d.category).toLowerCase() === String(brand.category).toLowerCase(),
  );
  if (byCat) return { code: byCat.code, label: byCat.description };
  return mockDeals[0] ? { code: mockDeals[0].code, label: mockDeals[0].description } : null;
}

export function BrandCampaignScreen() {
  const route = useRoute<RP>();
  const navigation = useNavigation<Nav>();
  const { slug } = route.params;
  const recordBrandVisit = useHomeIntelligenceStore((s) => s.recordBrandVisit);
  const [brand, setBrand] = useState<BrandType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchBrand(slug).then((b) => {
      if (!alive) return;
      setBrand(b);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (brand) recordBrandVisit(brand.id, String(brand.category));
  }, [brand, recordBrandVisit]);

  const deal = brand ? pickDealForBrand(brand) : null;
  const hero = brand?.campaignImages?.[0];

  function openDeal() {
    if (!deal) return;
    navigation.navigate("WalletTab", { screen: "Deal", params: { id: deal.code } });
  }

  function openListings() {
    navigation.navigate("CategoryListings", {
      category: "fashion",
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Brand" eyebrow="Campaign" />
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : !brand ? (
        <View style={{ padding: spacing.xl }}>
          <Text style={{ fontFamily: fonts.body, color: colors.textSecondary }}>
            Brand not found.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
          <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
            <Text style={{
              fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
              color: colors.textTertiary, textTransform: "uppercase",
            }}>
              {String(brand.category)} · Brand story
            </Text>
            <Text style={{
              marginTop: spacing.sm,
              fontFamily: fonts.heading, fontSize: 28, color: colors.foreground,
            }}>
              {brand.name}
            </Text>
          </View>

          {hero ? (
            <ImageBackground
              source={{ uri: hero }}
              style={{
                marginHorizontal: spacing.xl,
                height: 220,
                borderRadius: radius.lg,
                overflow: "hidden",
                justifyContent: "flex-end",
              }}
              imageStyle={{ borderRadius: radius.lg }}
            >
              <View style={{
                padding: spacing.lg,
                backgroundColor: "rgba(0,0,0,0.45)",
              }}>
                <Text style={{
                  fontFamily: fonts.bodyLight, fontSize: 12, color: "rgba(255,255,255,0.9)",
                }} numberOfLines={3}>
                  {brand.tagline}
                </Text>
              </View>
            </ImageBackground>
          ) : brand.logoUrl ? (
            <View style={{ paddingHorizontal: spacing.xl, alignItems: "center" }}>
              <Image source={{ uri: brand.logoUrl }} style={{ width: 120, height: 120, resizeMode: "contain" }} />
            </View>
          ) : null}

          <Text style={{
            marginTop: spacing.xl,
            paddingHorizontal: spacing.xl,
            fontFamily: fonts.bodyLight, fontSize: 14, lineHeight: 22,
            color: colors.textSecondary,
          }}>
            This is an editorial campaign feature — private benefits for ATMAD readers are unlocked
            through member offers.
          </Text>

          {deal ? (
            <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl }}>
              <Text style={{
                fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
                color: colors.textTertiary, textTransform: "uppercase",
                marginBottom: spacing.sm,
              }}>
                Private access
              </Text>
              <View style={{
                padding: spacing.lg,
                backgroundColor: colors.card,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{ fontFamily: fonts.bodyLight, fontSize: 13, color: colors.textSecondary }}>
                  {deal.label}
                </Text>
                <Pressable
                  onPress={openDeal}
                  style={({ pressed }) => ({
                    marginTop: spacing.md,
                    paddingVertical: spacing.md,
                    borderRadius: radius.md,
                    alignItems: "center",
                    backgroundColor: colors.foreground,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{
                    fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
                    color: "#FFFFFF", textTransform: "uppercase",
                  }}>
                    Activate benefit
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <Pressable
            onPress={openListings}
            style={({ pressed }) => ({
              marginTop: spacing.lg,
              marginHorizontal: spacing.xl,
              padding: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{
              textAlign: "center",
              fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2,
              color: colors.foreground, textTransform: "uppercase",
            }}>
              Browse listings
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
