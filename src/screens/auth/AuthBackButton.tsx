import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../theme/tokens";

/** Top-left chevron for auth sub-screens (matches Phone entry / onboarding). */
export function AuthBackButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
      <Pressable
        onPress={onPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.xs,
          marginLeft: -spacing.xs,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Ionicons name="chevron-back" size={28} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
