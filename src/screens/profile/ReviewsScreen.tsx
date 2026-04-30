import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

interface Review {
  id: string;
  brand: string;
  product: string;
  category: string;
  rating: number;
  curator: string;
  curatorRole: string;
  excerpt: string;
  body: string;
  verdict: "Buy" | "Hold" | "Pass";
}

const REVIEWS: Review[] = [
  {
    id: "1",
    brand: "Maison Atelier",
    product: "Tonal Wool Coat",
    category: "Fashion",
    rating: 4.7,
    curator: "Layla Antar",
    curatorRole: "Editor-in-Chief",
    excerpt: "A near-perfect overcoat. The cut is the rare one that survives lazy posture.",
    body: "Atelier's tonal coat works because it commits — uniform colour, uniform fabric, uniform stitch. The result is a silhouette that flatters even when you're tired. The wool is dense without weight; expect to forget you're wearing it within an hour. The interior pocket is one centimetre too tight for a passport, which is the only thing that keeps this from a five.",
    verdict: "Buy",
  },
  {
    id: "2",
    brand: "House of Cipher",
    product: "Carbon Travel Trunk",
    category: "Travel",
    rating: 4.5,
    curator: "Kareem Halabi",
    curatorRole: "Travel Editor",
    excerpt: "Worth it if you fly weekly. Overkill if you don't.",
    body: "The trunk is engineered. Hinges glide, the lock is reassuring, and the carbon shell shrugs off airline handlers. But you pay for that engineering. Unless you put it through 40+ flights a year, the calculus is uncertain. For executives, yes; for occasional travellers, the previous-generation aluminium remains the smarter buy.",
    verdict: "Hold",
  },
  {
    id: "3",
    brand: "Volume",
    product: "Studio Headphones",
    category: "Tech",
    rating: 4.6,
    curator: "Sami Khoury",
    curatorRole: "Tech Editor",
    excerpt: "Reference-grade tuning, finally without the studio cable mess.",
    body: "Volume tuned these for mixers, but the surprise is how civilised they sound on streaming. Bass is honest, not flattering. Treble doesn't sting. The wireless implementation finally matches the wired flagship — no audible compression on lossless. Battery life is conservative at 28 hours; expect closer to 22 with ANC on.",
    verdict: "Buy",
  },
  {
    id: "4",
    brand: "Hever",
    product: "Smart Decanter",
    category: "Lifestyle",
    rating: 3.2,
    curator: "Nadine Saab",
    curatorRole: "Lifestyle Editor",
    excerpt: "An app for a decanter. We've reached the end of the road.",
    body: "The decanter is fine. The companion app is the problem — it pings notifications about your wine, asks for ratings, and at one point auto-played a tasting video. A decanter should be silent. Hever has built a beautiful object and bolted noise to it. Pass on the connected version; the analogue line is excellent.",
    verdict: "Pass",
  },
];

const CATEGORIES = ["All", "Fashion", "Travel", "Tech", "Lifestyle", "Beauty"] as const;

export function ReviewsScreen() {
  const [filter, setFilter] = useState<typeof CATEGORIES[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = REVIEWS.filter((r) => filter === "All" || r.category === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Reviews" eyebrow="Profile" />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
            Curator-vetted · Issue 01
          </Text>
          <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 24, color: colors.foreground }}>
            What we'd actually buy
          </Text>
          <Text style={{ marginTop: spacing.xs, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
            Honest opinions from the ATMAD desk. No sponsorships. No paid placements.
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
          {list.map((r) => {
            const open = openId === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setOpenId(open ? null : r.id)}
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
                      {r.brand} · {r.category}
                    </Text>
                    <Text style={{ marginTop: 2, fontFamily: fonts.heading, fontSize: 18, color: colors.foreground }}>
                      {r.product}
                    </Text>
                  </View>
                  <Verdict v={r.verdict} />
                </View>

                <View style={{ flexDirection: "row", marginTop: spacing.sm, alignItems: "center", gap: 6 }}>
                  <Stars value={r.rating} />
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.foreground }}>
                    {r.rating.toFixed(1)}
                  </Text>
                </View>

                <Text style={{
                  marginTop: spacing.md,
                  fontFamily: fonts.bodyLight, fontSize: 13, lineHeight: 20,
                  color: colors.foreground,
                }}>
                  {open ? r.body : r.excerpt}
                </Text>

                <View style={{
                  marginTop: spacing.md, paddingTop: spacing.sm,
                  borderTopWidth: 1, borderTopColor: colors.border,
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                }}>
                  <View>
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.foreground }}>
                      {r.curator}
                    </Text>
                    <Text style={{ marginTop: 1, fontFamily: fonts.body, fontSize: 9, letterSpacing: 1.5, color: colors.textTertiary, textTransform: "uppercase" }}>
                      {r.curatorRole}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textTertiary }}>
                    {open ? "Hide" : "Read more"}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {list.length === 0 ? (
            <Text style={{
              textAlign: "center", paddingVertical: spacing.xxl,
              fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textTertiary,
            }}>
              No reviews in this category yet.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Verdict({ v }: { v: Review["verdict"] }) {
  const map = {
    Buy:  { bg: "rgba(40,140,80,0.1)",  fg: "rgba(20,100,60,0.9)" },
    Hold: { bg: "rgba(60,60,60,0.08)",  fg: colors.textSecondary },
    Pass: { bg: "rgba(180,80,80,0.1)",  fg: colors.destructiveSoft },
  } as const;
  const s = map[v];
  return (
    <View style={{
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: radius.pill, backgroundColor: s.bg,
    }}>
      <Text style={{
        fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 2,
        color: s.fg, textTransform: "uppercase",
      }}>
        {v}
      </Text>
    </View>
  );
}

function Stars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Feather
          key={n}
          name="star"
          size={11}
          color={n <= filled ? colors.foreground : colors.textFaint}
        />
      ))}
    </View>
  );
}
