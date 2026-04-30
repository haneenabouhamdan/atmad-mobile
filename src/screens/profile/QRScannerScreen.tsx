import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { ScreenHeader } from "../../components/ScreenHeader";
import { redeemCode } from "../../auth/authActions";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Status =
  | { kind: "idle" }
  | { kind: "scanning"; code: string }
  | { kind: "success"; code: string; points: number; type: string }
  | { kind: "error"; message: string };

/**
 * QR Scanner — uses expo-camera to detect QR codes, then runs the scanned
 * code through the redeem-code Edge Function. Visual feedback uses haptics.
 * The scan is "armed" until a code is processed; tapping "Scan again"
 * re-arms it.
 */
export function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const lastScannedAt = useRef(0);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission?.granted]);

  async function onScan(data: string) {
    const now = Date.now();
    if (now - lastScannedAt.current < 1500) return;
    if (status.kind === "scanning" || status.kind === "success") return;
    lastScannedAt.current = now;

    setStatus({ kind: "scanning", code: data });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const r = await redeemCode({ code: data });
    if (r.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStatus({ kind: "success", code: data, points: r.points, type: r.type });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setStatus({ kind: "error", message: r.error });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.foreground }}>
      <ScreenHeader title="QR Scanner" eyebrow="Profile" />

      {permission?.granted ? (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={
              status.kind === "scanning" || status.kind === "success"
                ? undefined
                : ({ data }) => onScan(data)
            }
          />

          {/* Frame overlay */}
          <View pointerEvents="none" style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center", justifyContent: "center",
          }}>
            <View style={{
              width: 240, height: 240,
              borderColor: "rgba(255,255,255,0.7)", borderWidth: 1.5, borderRadius: radius.md,
            }}>
              <Corner top left />
              <Corner top right />
              <Corner bottom left />
              <Corner bottom right />
            </View>
            <Text style={{
              marginTop: spacing.lg,
              fontFamily: fonts.body, fontSize: 11, letterSpacing: 2,
              color: "rgba(255,255,255,0.7)", textTransform: "uppercase",
            }}>
              Point at any ATMAD code
            </Text>
          </View>

          {(status.kind === "scanning" || status.kind === "success" || status.kind === "error") ? (
            <View style={{
              position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.xxl,
              backgroundColor: colors.background,
              borderRadius: radius.lg, padding: spacing.lg,
            }}>
              {status.kind === "scanning" && (
                <View style={{ alignItems: "center", paddingVertical: spacing.sm }}>
                  <ActivityIndicator color={colors.foreground} />
                  <Text style={{ marginTop: spacing.sm, fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary }}>
                    Verifying {status.code}…
                  </Text>
                </View>
              )}
              {status.kind === "success" && (
                <View>
                  <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
                    Redeemed · {status.type}
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 22, color: colors.foreground }}>
                    +{status.points} points
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
                    Code: {status.code}
                  </Text>
                  <Pressable onPress={() => setStatus({ kind: "idle" })} style={ctaStyle}>
                    <Text style={ctaText}>Scan another</Text>
                  </Pressable>
                </View>
              )}
              {status.kind === "error" && (
                <View>
                  <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.destructiveSoft, textTransform: "uppercase" }}>
                    Couldn't redeem
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: colors.foreground }}>
                    {status.message}
                  </Text>
                  <Pressable onPress={() => setStatus({ kind: "idle" })} style={ctaStyle}>
                    <Text style={ctaText}>Try again</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.foreground, textAlign: "center" }}>
            Camera access needed
          </Text>
          <Text style={{ marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary, textAlign: "center" }}>
            ATMAD scans codes locally on your device. We never upload images.
          </Text>
          <Pressable
            onPress={() => permission?.canAskAgain ? requestPermission() : Linking.openSettings()}
            style={{
              marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: 14,
              borderRadius: radius.md, backgroundColor: colors.foreground,
            }}
          >
            <Text style={{
              fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
              color: colors.inverse, textTransform: "uppercase",
            }}>
              {permission?.canAskAgain ? "Allow camera" : "Open settings"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Corner({ top, bottom, left, right }: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean }) {
  return (
    <View style={{
      position: "absolute",
      top:    top    ? -1 : undefined,
      bottom: bottom ? -1 : undefined,
      left:   left   ? -1 : undefined,
      right:  right  ? -1 : undefined,
      width: 18, height: 18,
      borderColor: "#FFFFFF",
      borderTopWidth:    top    ? 2 : 0,
      borderBottomWidth: bottom ? 2 : 0,
      borderLeftWidth:   left   ? 2 : 0,
      borderRightWidth:  right  ? 2 : 0,
    }} />
  );
}

const ctaStyle = {
  marginTop: spacing.lg, paddingVertical: 12,
  borderRadius: radius.md, backgroundColor: colors.foreground,
  alignItems: "center" as const,
};
const ctaText = {
  fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
  color: colors.inverse, textTransform: "uppercase" as const,
};
