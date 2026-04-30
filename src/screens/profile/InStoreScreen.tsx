import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

interface Activation {
  brand: string;
  location: string;
  distance: string;
  category: string;
  offer: string;
  points: number;
  open: boolean;
}

const ACTIVATIONS: Activation[] = [
  { brand: "Maison Atelier",     location: "Dubai Mall · Fashion Avenue",    distance: "0.4 km", category: "Fashion",   offer: "20% off SS26 capsule",         points: 120, open: true  },
  { brand: "House of Cipher",    location: "Mall of the Emirates",            distance: "1.7 km", category: "Travel",    offer: "Complimentary monogramming",   points: 80,  open: true  },
  { brand: "Norden",             location: "City Walk · Boulevard 3",         distance: "2.2 km", category: "Lifestyle", offer: "Tasting flight at the bar",    points: 50,  open: true  },
  { brand: "Volume",             location: "Alserkal Avenue",                 distance: "5.1 km", category: "Culture",   offer: "Editor's tour, Saturdays",     points: 100, open: false },
  { brand: "Kura Atelier",       location: "DIFC · Gate Village 1",           distance: "6.8 km", category: "Beauty",    offer: "30-min skin reading",          points: 60,  open: true  },
];

const CATEGORIES = ["All", "Fashion", "Travel", "Lifestyle", "Culture", "Beauty"] as const;

export function InStoreScreen() {
  const [filter, setFilter] = useState<typeof CATEGORIES[number]>("All");

  const list = useMemo(() => {
    return ACTIVATIONS.filter((a) => filter === "All" || a.category === filter);
  }, [filter]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="In-Store Mode" eyebrow="Profile" rightIcon="map-pin" />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
            Near you · Dubai
          </Text>
          <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 24, color: colors.foreground }}>
            {list.length} activations live
          </Text>
          <Text style={{ marginTop: spacing.xs, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
            Member-only offers when you walk in. Open ATMAD at the till to redeem.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.sm }}
        >
          {CATEGORIES.map((c) => {
            const on = filter === c;
            return (
              <Pressable
                key={c}
                onPress={() => setFilter(c)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8,
                  borderRadius: radius.pill,
                  borderWidth: 1, borderColor: on ? colors.borderFocus : colors.border,
                  backgroundColor: on ? "rgba(60,60,60,0.08)" : "transparent",
                }}
              >
                <Text style={{
                  fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1,
                  color: on ? colors.foreground : colors.textTertiary,
                  textTransform: "uppercase",
                }}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {list.map((a) => (
            <View
              key={a.brand}
              style={{
                padding: spacing.lg,
                backgroundColor: colors.card,
                borderRadius: radius.lg,
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
                    {a.category} · {a.distance}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: fonts.heading, fontSize: 18, color: colors.foreground }}>
                    {a.brand}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
                    {a.location}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 4,
                  borderRadius: radius.pill,
                  backgroundColor: a.open ? "rgba(40,140,80,0.1)" : "rgba(60,60,60,0.08)",
                }}>
                  <Text style={{
                    fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1,
                    color: a.open ? "rgba(20,100,60,0.9)" : colors.textTertiary,
                    textTransform: "uppercase",
                  }}>
                    {a.open ? "Open now" : "Closed"}
                  </Text>
                </View>
              </View>

              <View style={{
                marginTop: spacing.md, padding: spacing.md,
                backgroundColor: colors.background, borderRadius: radius.md,
                flexDirection: "row", alignItems: "center", gap: spacing.sm,
              }}>
                <Feather name="gift" size={14} color={colors.foreground} />
                <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.foreground }}>
                  {a.offer}
                </Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.foreground }}>
                  +{a.points} pts
                </Text>
              </View>
            </View>
          ))}

          {list.length === 0 ? (
            <Text style={{
              textAlign: "center", paddingVertical: spacing.xxl,
              fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textTertiary,
            }}>
              No activations in this category right now.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
