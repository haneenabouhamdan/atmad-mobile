import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useToast } from "../Toast";

export function ActionAppDownload({
  iosUrl,
  androidUrl,
  url,
  label,
}: {
  iosUrl?: string | null;
  androidUrl?: string | null;
  url?: string | null;
  label?: string | null;
}) {
  const toast = useToast();

  async function open(target?: string | null) {
    if (!target) return;
    try {
      const can = await Linking.canOpenURL(target);
      if (!can) throw new Error("Cannot open store");
      await Linking.openURL(target);
    } catch (e) {
      toast.show({ message: (e as Error).message ?? "Could not open store", tone: "error" });
    }
  }

  const primary = Platform.OS === "ios" ? iosUrl : androidUrl;
  const secondary = Platform.OS === "ios" ? androidUrl : iosUrl;
  const fallback = url;

  return (
    <View style={{ gap: spacing.sm }}>
      {primary || fallback ? (
        <Pressable
          onPress={() => open(primary ?? fallback)}
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { opacity: 0.85 }]}
        >
          <Feather
            name={Platform.OS === "ios" ? "smartphone" : "smartphone"}
            size={16}
            color={colors.inverse}
          />
          <Text style={[styles.label, styles.labelPrimary]}>
            {label || (Platform.OS === "ios" ? "Open in App Store" : "Open in Google Play")}
          </Text>
        </Pressable>
      ) : null}

      {secondary ? (
        <Pressable
          onPress={() => open(secondary)}
          style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && { opacity: 0.85 }]}
        >
          <Feather name="download" size={14} color={colors.foreground} />
          <Text style={[styles.label, styles.labelSecondary]}>
            {Platform.OS === "ios" ? "Also on Google Play" : "Also on App Store"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  btnPrimary:   { backgroundColor: colors.foreground },
  btnSecondary: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  label:          { fontFamily: fonts.bodyMedium, fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" },
  labelPrimary:   { color: colors.inverse },
  labelSecondary: { color: colors.foreground },
});
