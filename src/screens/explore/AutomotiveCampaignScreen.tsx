import { Pressable, ScrollView, Text, View, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { ExploreStackParamList, MainTabParamList } from "../../navigation/types";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const HERO =
  "https://images.unsplash.com/photo-1701519664307-a402295fc7c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList, "Automotive">,
  BottomTabNavigationProp<MainTabParamList>
>;

export function AutomotiveCampaignScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Automotive" eyebrow="Campaign" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <ImageBackground
          source={{ uri: HERO }}
          style={{
            marginHorizontal: spacing.xl,
            height: 260,
            borderRadius: radius.lg,
            overflow: "hidden",
            justifyContent: "flex-end",
          }}
          imageStyle={{ borderRadius: radius.lg }}
        >
            <View style={{ padding: spacing.lg, backgroundColor: "rgba(0,0,0,0.55)" }}>
            <Text style={{
              fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
              color: "rgba(255,255,255,0.75)", textTransform: "uppercase",
            }}>
              Automotive culture
            </Text>
            <Text style={{
              marginTop: 6,
              fontFamily: fonts.heading, fontSize: 24, color: "#FFFFFF",
            }}>
              Machines as philosophical objects
            </Text>
          </View>
        </ImageBackground>

        <Text style={{
          marginTop: spacing.xl,
          paddingHorizontal: spacing.xl,
          fontFamily: fonts.bodyLight, fontSize: 14, lineHeight: 22,
          color: colors.textSecondary,
        }}>
          A cinematic campaign surface — sparse copy, high contrast, and the car as an object of desire
          inside the ATMAD world. Browse automotive listings and member offers from Explore.
        </Text>

        <Pressable
          onPress={() => navigation.navigate("CategoryListings", { category: "automotive" })}
          style={({ pressed }) => ({
            marginTop: spacing.xl,
            marginHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: colors.foreground,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
            color: "#FFFFFF", textTransform: "uppercase", textAlign: "center",
          }}>
            Browse automotive
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Brand", { slug: "maison-noir" })}
          style={({ pressed }) => ({
            marginTop: spacing.md,
            marginHorizontal: spacing.xl,
            paddingVertical: spacing.md,
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
            Featured maison
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
