import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ImageBackground, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DiscoverStackParamList } from "../../navigation/types";
import { COVER } from "../../data/mock";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<DiscoverStackParamList, "Cover">;

export function CoverScreen() {
  const nav = useNavigation<Nav>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.obsidian }}>
      <ImageBackground
        source={{ uri: COVER.image }}
        style={{ flex: 1 }}
        imageStyle={{ opacity: 0.55 }}
      >
        <View style={{
          ...StyleSheetAbsoluteFill,
          backgroundColor: "rgba(0,0,0,0.35)",
        }} />
        <SafeAreaView edges={["top","bottom"]} style={{ flex: 1, justifyContent: "space-between" }}>
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            <Text style={{
              fontFamily: fonts.body, fontSize: 9, letterSpacing: 4,
              color: "rgba(255,255,255,0.7)", textTransform: "uppercase",
            }}>
              ATMAD · {COVER.discoverLabel}
            </Text>
          </View>

          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl }}>
            <Text style={{
              fontFamily: fonts.heading, fontSize: 38, lineHeight: 44,
              color: "#FFFFFF",
            }}>
              {COVER.headline}
            </Text>
            <Text style={{
              marginTop: spacing.md, fontFamily: fonts.bodyLight, fontSize: 14,
              lineHeight: 20, color: "rgba(255,255,255,0.85)",
            }}>
              {COVER.subheadline}
            </Text>

            <Pressable
              onPress={() => nav.navigate("Feed")}
              style={({ pressed }) => ({
                marginTop: spacing.xl,
                paddingVertical: 14, paddingHorizontal: spacing.lg,
                borderRadius: radius.md,
                borderWidth: 1, borderColor: "rgba(255,255,255,0.5)",
                alignSelf: "flex-start",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{
                fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
                color: "#FFFFFF", textTransform: "uppercase",
              }}>
                Open Discover →
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0, left: 0, right: 0, bottom: 0,
};
