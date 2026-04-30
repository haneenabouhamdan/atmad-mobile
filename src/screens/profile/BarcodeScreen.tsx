import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

interface ProductLookup {
  brand: string;
  product: string;
  category: string;
  rrp: string;
  rating: number;
  note: string;
}

/**
 * Mock product catalogue keyed by partial barcode prefix. Real impl would
 * call an editorial product service or a third-party retail data feed.
 */
const PRODUCT_TABLE: Record<string, ProductLookup> = {
  "5012345": { brand: "Maison Atelier", product: "Tonal Wool Coat",     category: "Fashion",    rrp: "AED 4,200", rating: 4.7, note: "Editorial pick — Issue 01." },
  "0012345": { brand: "House of Cipher", product: "Carbon Travel Trunk", category: "Travel",     rrp: "AED 9,800", rating: 4.5, note: "Limited release · 320 units." },
  "8901234": { brand: "Norden",          product: "Hifi Ceramic Cup",    category: "Lifestyle",  rrp: "AED   220", rating: 4.6, note: "Daily essential." },
};

function lookup(code: string): ProductLookup {
  const prefix = code.slice(0, 7);
  return (
    PRODUCT_TABLE[prefix] ?? {
      brand: "Unverified",
      product: `Item ${code.slice(-4)}`,
      category: "Unknown",
      rrp: "—",
      rating: 0,
      note: "We don't have editorial intel on this product yet.",
    }
  );
}

type Status =
  | { kind: "idle" }
  | { kind: "looking";  code: string }
  | { kind: "found";    code: string; data: ProductLookup };

export function BarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const lastScannedAt = useRef(0);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission?.granted]);

  function onScan(data: string) {
    const now = Date.now();
    if (now - lastScannedAt.current < 1500) return;
    if (status.kind !== "idle") return;
    lastScannedAt.current = now;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStatus({ kind: "looking", code: data });

    setTimeout(() => {
      const result = lookup(data);
      Haptics.selectionAsync().catch(() => {});
      setStatus({ kind: "found", code: data, data: result });
    }, 600);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.foreground }}>
      <ScreenHeader title="Barcode Reader" eyebrow="Profile" />

      {permission?.granted ? (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
            }}
            onBarcodeScanned={status.kind === "idle" ? ({ data }) => onScan(data) : undefined}
          />

          <View pointerEvents="none" style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            alignItems: "center", justifyContent: "center",
          }}>
            <View style={{
              width: 280, height: 120,
              borderColor: "rgba(255,255,255,0.6)", borderWidth: 1,
              borderRadius: radius.sm,
            }} />
            <Text style={{
              marginTop: spacing.lg,
              fontFamily: fonts.body, fontSize: 11, letterSpacing: 2,
              color: "rgba(255,255,255,0.7)", textTransform: "uppercase",
            }}>
              Align barcode within the frame
            </Text>
          </View>

          {status.kind !== "idle" && (
            <View style={{
              position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.xxl,
              backgroundColor: colors.background,
              borderRadius: radius.lg, padding: spacing.lg,
            }}>
              {status.kind === "looking" && (
                <View style={{ alignItems: "center", paddingVertical: spacing.sm }}>
                  <ActivityIndicator color={colors.foreground} />
                  <Text style={{ marginTop: spacing.sm, fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary }}>
                    Looking up {status.code}…
                  </Text>
                </View>
              )}
              {status.kind === "found" && (
                <View>
                  <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
                    {status.data.category}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: fonts.heading, fontSize: 20, color: colors.foreground }}>
                    {status.data.product}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
                    {status.data.brand}
                  </Text>

                  <View style={{ flexDirection: "row", marginTop: spacing.md, gap: spacing.lg }}>
                    <Stat label="RRP" value={status.data.rrp} />
                    <Stat label="Rating" value={status.data.rating ? `${status.data.rating.toFixed(1)} / 5` : "—"} />
                  </View>

                  <Text style={{ marginTop: spacing.md, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
                    {status.data.note}
                  </Text>

                  <Pressable
                    onPress={() => setStatus({ kind: "idle" })}
                    style={{
                      marginTop: spacing.lg, paddingVertical: 12,
                      borderRadius: radius.md, backgroundColor: colors.foreground,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{
                      fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
                      color: colors.inverse, textTransform: "uppercase",
                    }}>
                      Scan next
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.foreground, textAlign: "center" }}>
            Camera access needed
          </Text>
          <Text style={{ marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary, textAlign: "center" }}>
            ATMAD reads barcodes locally on your device.
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 2, color: colors.textTertiary, textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
        {value}
      </Text>
    </View>
  );
}
