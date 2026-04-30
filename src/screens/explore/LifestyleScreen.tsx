import { Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { ExploreStackParamList, MainTabParamList } from "../../navigation/types";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList, "Lifestyle">,
  BottomTabNavigationProp<MainTabParamList>
>;

export function LifestyleScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Lifestyle" eyebrow="Daily ritual" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl }}>
        <Text style={{
          fontFamily: fonts.bodyLight, fontSize: 14, lineHeight: 22,
          color: colors.textSecondary,
        }}>
          A quieter layer of ATMAD — editorial wellness, games, and travel rhythm. Step into the Mind
          Lounge for puzzles and points, or browse curated listings by category.
        </Text>

        <Text style={{
          marginTop: spacing.xl,
          fontFamily: fonts.headingItalic, fontSize: 18, color: colors.foreground,
        }}>
          Horoscope
        </Text>
        <Text style={{
          marginTop: spacing.sm,
          fontFamily: fonts.bodyLight, fontSize: 13, lineHeight: 20,
          color: colors.textSecondary,
        }}>
          A daily reading in the ATMAD voice will appear here. For now, carry intention like a quiet
          accessory — visible only to you.
        </Text>

        <Pressable
          onPress={() => navigation.navigate("ProfileTab", { screen: "MindLounge" })}
          style={({ pressed }) => ({
            marginTop: spacing.xl,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.foreground,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
            color: "#FFFFFF", textTransform: "uppercase", textAlign: "center",
          }}>
            Enter Mind Lounge
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("CategoryListings", { category: "travel" })}
          style={({ pressed }) => ({
            marginTop: spacing.md,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
            color: colors.foreground, textTransform: "uppercase", textAlign: "center",
          }}>
            Future travel listings
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("CategoryListings", { category: "fnb" })}
          style={({ pressed }) => ({
            marginTop: spacing.md,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
            color: colors.foreground, textTransform: "uppercase", textAlign: "center",
          }}>
            F&B listings
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
