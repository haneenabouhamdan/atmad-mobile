import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const QR_SIZE = 240;

/**
 * QR code generator — uses the (free, public) qrserver.com endpoint so we
 * don't need to add `react-native-qrcode-svg` + `react-native-svg` as a
 * dependency. The payload is whatever the editor entered in Studio
 * (typically a URL or a redemption token).
 */
export function ActionQRCode({
  payload,
  label,
}: {
  payload: string;
  label?: string | null;
}) {
  const url =
    `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}` +
    `&margin=8&data=${encodeURIComponent(payload)}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.frame}>
        <Image
          source={{ uri: url }}
          style={{ width: QR_SIZE, height: QR_SIZE }}
          contentFit="contain"
          accessibilityLabel="QR code"
        />
      </View>
      <Text style={styles.helper}>
        {label || "Show this QR at the till to redeem"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.md,
  },
  frame: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  helper: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.textTertiary,
    textAlign: "center",
  },
});
