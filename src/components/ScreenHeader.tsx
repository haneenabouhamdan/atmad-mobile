import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors, fonts, spacing } from "../theme/tokens";

/**
 * Standard top bar for any sub-screen reached from a tab root.
 * Renders a back chevron on the left, an optional eyebrow on the right,
 * and the screen title in the centre. Sticks below the safe-area inset.
 */
export function ScreenHeader({
  title,
  eyebrow,
  rightIcon,
  onRightPress,
}: {
  title: string;
  eyebrow?: string;
  rightIcon?: React.ComponentProps<typeof Feather>["name"];
  onRightPress?: () => void;
}) {
  const nav = useNavigation();
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
      }}>
        <Pressable
          onPress={() => nav.goBack()}
          hitSlop={12}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: 64 }}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
          {eyebrow ? (
            <Text style={{
              fontFamily: fonts.body, fontSize: 10, letterSpacing: 2,
              color: colors.textTertiary, textTransform: "uppercase",
            }}>
              {eyebrow}
            </Text>
          ) : null}
        </Pressable>

        <Text
          numberOfLines={1}
          style={{
            flex: 1, textAlign: "center",
            fontFamily: fonts.heading, fontSize: 16, color: colors.foreground,
          }}
        >
          {title}
        </Text>

        <View style={{ minWidth: 64, alignItems: "flex-end" }}>
          {rightIcon ? (
            <Pressable onPress={onRightPress} hitSlop={12}>
              <Feather name={rightIcon} size={18} color={colors.foreground} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: colors.border }} />
    </SafeAreaView>
  );
}
