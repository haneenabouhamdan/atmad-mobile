import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ActionCopyCode } from "./ActionCopyCode";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useToast } from "../Toast";

export function ActionSoftwareCode({
  codeId,
  url,
  label,
  successMessage,
}: {
  codeId: string;
  url?: string | null;
  label?: string | null;
  successMessage?: string | null;
}) {
  const toast = useToast();

  async function open() {
    if (!url) return;
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) throw new Error("Cannot open link");
      await Linking.openURL(url);
    } catch (e) {
      toast.show({ message: (e as Error).message ?? "Could not open", tone: "error" });
    }
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <ActionCopyCode codeId={codeId} label={label} successMessage={successMessage} />
      {url ? (
        <Pressable
          onPress={open}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
        >
          <Feather name="external-link" size={14} color={colors.foreground} />
          <Text style={styles.btnLabel}>Open software</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  btnLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 1.2,
    textTransform: "uppercase", color: colors.foreground,
  },
});
