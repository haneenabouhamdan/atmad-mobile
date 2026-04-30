import { Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList, ProfileStackParamList } from "../../navigation/types";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, "ToolsHub">,
  BottomTabNavigationProp<MainTabParamList>
>;

type Row = { label: string; hint?: string; onPress: () => void };

function Cluster({ title, description, rows }: { title: string; description: string; rows: Row[] }) {
  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Text style={{
        fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
        color: colors.textTertiary,
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        {title}
      </Text>
      <Text style={{
        fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary,
        marginBottom: spacing.md, lineHeight: 18,
      }}>
        {description}
      </Text>
      <View style={{
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}>
        {rows.map((r, i) => (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            style={({ pressed }) => ({
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.border,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.foreground }}>
              {r.label}
            </Text>
            {r.hint ? (
              <Text style={{
                marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary,
              }}>
                {r.hint}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ToolsHubScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Utilities" eyebrow="System" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl }}>
        <Text style={{
          marginTop: spacing.sm,
          fontFamily: fonts.heading,
          fontSize: 28,
          color: colors.foreground,
        }}>
          Tools Hub
        </Text>
        <Text style={{
          marginTop: spacing.sm,
          fontFamily: fonts.bodyLight, fontSize: 13,
          lineHeight: 20,
          color: colors.textSecondary,
        }}>
          Redemption, discovery, and growth — grouped like the v17 reference. Deep links stay inside
          ATMAD navigation.
        </Text>

        <Cluster
          title="Redemption"
          description="Present your benefit at any brand touchpoint."
          rows={[
            {
              label: "QR code",
              hint: "Show scannable access",
              onPress: () => navigation.navigate("QR"),
            },
            {
              label: "Barcode",
              hint: "Linear code at checkout",
              onPress: () => navigation.navigate("Barcode"),
            },
            {
              label: "PIN entry",
              hint: "Voice or keypad redemption",
              onPress: () => navigation.navigate("PIN"),
            },
          ]}
        />

        <Cluster
          title="Discovery"
          description="Evaluate before you commit."
          rows={[
            {
              label: "Compare offers",
              onPress: () => navigation.navigate("Compare"),
            },
            {
              label: "Reviews",
              onPress: () => navigation.navigate("Reviews"),
            },
            {
              label: "Curated discovery",
              hint: "Explore categories",
              onPress: () => navigation.navigate("ExploreTab", { screen: "Discovery" }),
            },
          ]}
        />

        <Cluster
          title="Growth"
          description="Expand your standing inside ATMAD."
          rows={[
            {
              label: "Refer & earn",
              onPress: () => navigation.navigate("Referral"),
            },
            {
              label: "Identity vault",
              onPress: () => navigation.navigate("Identity"),
            },
            {
              label: "Mind lounge",
              onPress: () => navigation.navigate("MindLounge"),
            },
          ]}
        />
      </ScrollView>
    </View>
  );
}
