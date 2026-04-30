import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useToast } from "../Toast";

export function ActionPin({
  pin,
  label,
  successMessage,
}: {
  pin: string;
  label?: string | null;
  successMessage?: string | null;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function copy() {
    setBusy(true);
    try {
      await Clipboard.setStringAsync(pin);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      toast.show({ message: successMessage || "PIN copied", tone: "success" });
    } catch (e) {
      toast.show({ message: (e as Error).message ?? "Copy failed", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: spacing.md, alignItems: "center" }}>
      <Text style={styles.eyebrow}>PIN</Text>
      <View style={styles.pinWrap}>
        {pin.split("").map((ch, i) => (
          <View key={i} style={styles.pinSlot}>
            <Text style={styles.pinChar}>{ch}</Text>
          </View>
        ))}
      </View>
      <Pressable
        onPress={copy}
        disabled={busy}
        style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.85 }]}
      >
        {busy ? (
          <ActivityIndicator color={colors.inverse} />
        ) : (
          <>
            <Feather name="copy" size={14} color={colors.inverse} />
            <Text style={styles.copyLabel}>{label || "Copy PIN"}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 3,
    textTransform: "uppercase", color: colors.textTertiary,
  },
  pinWrap: { flexDirection: "row", gap: spacing.sm },
  pinSlot: {
    width: 44, height: 56, borderRadius: radius.md,
    backgroundColor: colors.card, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border,
  },
  pinChar: { fontFamily: fonts.bodySemi, fontSize: 24, color: colors.foreground },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.foreground, paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl, borderRadius: radius.pill,
  },
  copyLabel: {
    color: colors.inverse, fontFamily: fonts.bodyMedium,
    fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
  },
});
