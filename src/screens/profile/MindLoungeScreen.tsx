import { ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

interface Brief {
  id: string;
  category: string;
  title: string;
  body: string;
  source: string;
  readTime: string;
}

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const BRIEFS: Brief[] = [
  {
    id: "m1",
    category: "Markets",
    title: "Luxury soft-spend rebounds in the Gulf as Europe cools.",
    body: "Q1 invoice data from three Levant houses shows GCC clienteling up 14% YoY, while Western European tourism corridors are flat or down. Read this as a buy signal for any house with Dubai retail in the next 18 months — and a warning to those still over-indexed on Paris foot traffic.",
    source: "Volume Markets Desk",
    readTime: "3 min",
  },
  {
    id: "m2",
    category: "Design",
    title: "The new mature: how Tonal Wool replaced print as the editor's coat.",
    body: "Print is loud. Tonal is the new whisper. Across four runways this season, the editorial uniform was monochrome wool — colour-matched lining, colour-matched buttons. The look reads expensive without performing it. Expect the trickle-down to hit the high street in 12–14 months.",
    source: "ATMAD Style",
    readTime: "4 min",
  },
  {
    id: "m3",
    category: "Mobility",
    title: "Why every collector is suddenly asking about EV provenance.",
    body: "Three private auctions in 90 days have featured battery-original EVs. The thesis: as battery tech moves on, factory-original packs become provenance, the way matching-numbers became a thing for combustion classics. If you own one and have replaced the pack, the story matters.",
    source: "ATMAD Mobility",
    readTime: "5 min",
  },
  {
    id: "m4",
    category: "Tech",
    title: "Quietly: Apple's M5 timing leaks suggest a winter Pro launch.",
    body: "Inventory rotation in two Asian distributors plus a manufacturing-line pause hint at an unusual mid-cycle Pro update. If you've been holding for a workstation refresh, the question is whether to wait six weeks. Our take: yes, but only if you're spec-locked at >32GB RAM.",
    source: "Volume Tech",
    readTime: "2 min",
  },
];

export function MindLoungeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Mind Lounge" eyebrow="Profile" />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
            Daily brief · {TODAY}
          </Text>
          <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 26, color: colors.foreground, lineHeight: 30 }}>
            Four things worth your morning.
          </Text>
          <Text style={{ marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
            Hand-curated by editors. Average read time: 3 minutes.
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg }}>
          {BRIEFS.map((b, i) => (
            <View
              key={b.id}
              style={{
                paddingBottom: spacing.lg,
                borderBottomWidth: i === BRIEFS.length - 1 ? 0 : 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
                  {b.category}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 1.5, color: colors.textFaint, textTransform: "uppercase" }}>
                  {b.readTime}
                </Text>
              </View>
              <Text style={{ marginTop: spacing.xs, fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, color: colors.foreground }}>
                {b.title}
              </Text>
              <Text style={{ marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 13, lineHeight: 20, color: colors.textSecondary }}>
                {b.body}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md }}>
                <Feather name="bookmark" size={12} color={colors.textTertiary} />
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textTertiary }}>
                  {b.source}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{
          margin: spacing.xl, padding: spacing.lg,
          backgroundColor: colors.card, borderRadius: radius.lg,
          borderWidth: 1, borderColor: colors.border,
          alignItems: "center",
        }}>
          <Feather name="moon" size={18} color={colors.textTertiary} />
          <Text style={{ marginTop: spacing.sm, fontFamily: fonts.heading, fontSize: 16, color: colors.foreground, textAlign: "center" }}>
            Tomorrow's brief drops at 06:30 GST
          </Text>
          <Text style={{ marginTop: 4, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textTertiary, textAlign: "center" }}>
            We'll send a quiet notification — never a chime.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
