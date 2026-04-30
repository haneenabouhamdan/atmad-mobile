import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useToast } from "../Toast";
import { fetchCodePreview, type CodePreview } from "../../lib/listings";

export function ActionCopyCode({
  codeId,
  label,
  successMessage,
}: {
  codeId: string;
  label?: string | null;
  successMessage?: string | null;
}) {
  const toast = useToast();
  const [code, setCode]   = useState<CodePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy]   = useState(false);

  useEffect(() => {
    let active = true;
    setError(null);
    fetchCodePreview(codeId)
      .then((c) => { if (active) setCode(c); })
      .catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [codeId]);

  async function copy() {
    if (!code) return;
    setBusy(true);
    try {
      await Clipboard.setStringAsync(code.code);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      toast.show({ message: successMessage || "Code copied", tone: "success" });
    } catch (e) {
      toast.show({ message: (e as Error).message ?? "Copy failed", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <View style={styles.errorBox}>
        <Feather name="alert-triangle" size={14} color={colors.destructive} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!code) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      {(code.dealTitle || code.description) ? (
        <View style={styles.meta}>
          {code.dealTitle ? <Text style={styles.metaTitle}>{code.dealTitle}</Text> : null}
          {code.description ? <Text style={styles.metaDesc}>{code.description}</Text> : null}
          {code.discountPercent ? (
            <Text style={styles.metaBadge}>{code.discountPercent}% OFF</Text>
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={copy}
        disabled={busy}
        style={({ pressed }) => [styles.codePill, pressed && styles.codePillPressed]}
      >
        <Text style={styles.codeText}>{code.code}</Text>
        <View style={styles.copyBadge}>
          {busy ? (
            <ActivityIndicator color={colors.inverse} />
          ) : (
            <>
              <Feather name="copy" size={14} color={colors.inverse} />
              <Text style={styles.copyLabel}>{label || "Copy"}</Text>
            </>
          )}
        </View>
      </Pressable>

      {code.validUntil ? (
        <Text style={styles.expiry}>
          Valid until {new Date(code.validUntil).toLocaleDateString()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: spacing.xl, alignItems: "center" },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.muted, padding: spacing.md, borderRadius: radius.md,
  },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.destructive, flex: 1 },
  meta: { gap: spacing.xs },
  metaTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.foreground },
  metaDesc:  { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  metaBadge: {
    alignSelf: "flex-start",
    fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 1.4,
    textTransform: "uppercase", color: colors.foreground,
    backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: radius.pill, marginTop: spacing.xs,
  },
  codePill: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: colors.border, borderStyle: "dashed",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    borderRadius: radius.md, backgroundColor: colors.card,
  },
  codePillPressed: { opacity: 0.85 },
  codeText: {
    fontFamily: fonts.bodySemi, fontSize: 22, color: colors.foreground,
    letterSpacing: 2,
  },
  copyBadge: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    backgroundColor: colors.foreground, paddingVertical: 8,
    paddingHorizontal: spacing.md, borderRadius: radius.pill,
  },
  copyLabel: {
    color: colors.inverse, fontFamily: fonts.bodyMedium,
    fontSize: 11, letterSpacing: 1, textTransform: "uppercase",
  },
  expiry: {
    fontFamily: fonts.body, fontSize: 11, color: colors.textTertiary,
    textTransform: "uppercase", letterSpacing: 1.4, textAlign: "center",
  },
});
