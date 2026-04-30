import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useToast } from "../Toast";

export function ActionRedirectLink({
  url,
  label,
  category,
}: {
  url: string;
  label?: string | null;
  category?: string;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const fallback = category === "fashion" ? "Get the Look" : "Visit Site";

  async function open() {
    setBusy(true);
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) throw new Error("Cannot open link");
      await Linking.openURL(url);
    } catch (e) {
      toast.show({ message: (e as Error).message ?? "Could not open link", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable onPress={open} disabled={busy} style={({ pressed }) => [
      styles.btn, pressed && styles.btnPressed,
    ]}>
      {busy ? (
        <ActivityIndicator color={colors.inverse} />
      ) : (
        <>
          <Text style={styles.label}>{label || fallback}</Text>
          <Feather name="external-link" size={16} color={colors.inverse} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.foreground,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  btnPressed: { opacity: 0.85 },
  label: {
    color: colors.inverse,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
