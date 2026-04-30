import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenHeader } from "../../components/ScreenHeader";
import { fetchListingsByCategory, type Listing, type ListingCategory } from "../../lib/listings";
import { urlFor } from "../../lib/sanity";
import type { ExploreStackParamList } from "../../navigation/types";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<ExploreStackParamList, "CategoryListings">;

const CATEGORY_TITLES: Record<ListingCategory, string> = {
  fashion:    "Fashion",
  tech:       "Tech",
  travel:     "Travel",
  automotive: "Automotive",
  finance:    "Finance",
  fnb:        "F&B",
  beauty:     "Beauty",
  realestate: "Real Estate",
};

const ACTION_LABELS: Record<string, string> = {
  redirect_link: "Get the look",
  copy_code:     "Copy code",
  qr_code:       "QR code",
  pin_code:      "PIN",
  app_download:  "Download",
  software_code: "Software",
  form:          "Apply",
};

export function CategoryListingsScreen({
  route,
}: {
  route: { params: { category: ListingCategory } };
}) {
  const nav = useNavigation<Nav>();
  const { category } = route.params;
  const [items, setItems]   = useState<Listing[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoad(true);
    setError(null);
    fetchListingsByCategory(category)
      .then((l) => { if (active) setItems(l); })
      .catch((e: Error) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoad(false); });
    return () => { active = false; };
  }, [category]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={CATEGORY_TITLES[category]} eyebrow="Back" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.foreground} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={20} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Feather name="inbox" size={28} color={colors.textTertiary} />
          <Text style={styles.helper}>No listings published in this category yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(l) => l._id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => nav.navigate("Listing", { id: item._id })}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            >
              {item.coverImage ? (
                <Image
                  source={{ uri: urlFor(item.coverImage).width(800).url() }}
                  style={styles.cover}
                  contentFit="cover"
                />
              ) : null}
              <View style={styles.cardBody}>
                <Text style={styles.brand}>{item.brand?.name ?? "—"}</Text>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                {item.shortDescription ? (
                  <Text style={styles.desc} numberOfLines={2}>{item.shortDescription}</Text>
                ) : null}
                <View style={styles.cta}>
                  <Text style={styles.ctaLabel}>
                    {item.action.label || ACTION_LABELS[item.action.type] || "Open"}
                  </Text>
                  <Feather name="arrow-right" size={14} color={colors.foreground} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, alignItems: "center", justifyContent: "center",
    gap: spacing.sm, paddingHorizontal: spacing.xl,
  },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.destructive },
  helper:    { fontFamily: fonts.body, fontSize: 13, color: colors.textTertiary, textAlign: "center" },
  card: {
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
    overflow: "hidden",
  },
  cover: { width: "100%", height: 180, backgroundColor: colors.muted },
  cardBody: { padding: spacing.md, gap: 4 },
  brand: {
    fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1.6,
    textTransform: "uppercase", color: colors.textTertiary,
  },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.foreground, lineHeight: 22 },
  desc:  { fontFamily: fonts.body,    fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginTop: 2 },
  cta: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm,
  },
  ctaLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.4,
    textTransform: "uppercase", color: colors.foreground,
  },
});
