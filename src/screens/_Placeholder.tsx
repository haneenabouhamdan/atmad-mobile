import { Text, View } from "react-native";
import { colors, fonts, spacing } from "../theme/tokens";

/**
 * Placeholder screen used during the migration. Replaces a web page until
 * its full RN implementation lands. Keeps the navigation skeleton runnable.
 */
export function makePlaceholder(title: string, subtitle?: string) {
  return function PlaceholderScreen() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.xl,
      }}>
        <Text style={{
          fontFamily: fonts.heading,
          fontSize: 28,
          color: colors.foreground,
          marginBottom: spacing.sm,
          textAlign: "center",
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.textTertiary,
            textTransform: "uppercase",
            letterSpacing: 2,
            textAlign: "center",
          }}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  };
}
