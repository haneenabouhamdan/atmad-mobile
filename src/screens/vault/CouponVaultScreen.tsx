import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { WalletStackParamList } from "../../navigation/types";
import {
  fetchVaultCatalog,
  listMyRedemptions,
  redeemCode,
} from "../../data/codesService";
import type { VaultCatalogRow } from "../../data/codesService";
import { mockDeals } from "../../data/mock";
import { env } from "../../lib/env";
import { useAuth } from "../../auth/AuthProvider";
import { useNotificationBannerStore } from "../../store/notificationBannerStore";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<WalletStackParamList, "Vault">;

const CATALOG_PREVIEW = 6;

type RedemptionRow = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  meta: string;
};

export function CouponVaultScreen() {
  const nav = useNavigation<Nav>();
  const auth = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [catalog, setCatalog] = useState<VaultCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollGate, setScrollGate] = useState(false);
  const showBanner = useNotificationBannerStore((s) => s.show);

  const load = useCallback(async () => {
    if (!env.IS_CONFIGURED) {
      setCatalog(
        mockDeals.map((d) => ({
          code: d.code,
          brand: d.brand,
          title: d.description,
          discountLine: d.discount,
          points: d.points ?? 0,
        })),
      );
      setRedemptions([]);
      setLoading(false);
      return;
    }
    const [cat, reds] = await Promise.all([fetchVaultCatalog(28), listMyRedemptions()]);
    setCatalog(cat);
    setRedemptions(
      reds.map((r: Record<string, unknown>) => {
        const raw = r.codes;
        const c = Array.isArray(raw) ? (raw[0] as Record<string, unknown> | undefined) : (raw as Record<string, unknown> | undefined);
        return {
          id: String(r.id ?? ""),
          code: c?.code != null ? String(c.code) : "—",
          title: String(c?.brand_id ?? "ATMAD"),
          subtitle: String(c?.deal_title ?? "Member offer"),
          meta: new Date(String(r.redeemed_at)).toLocaleDateString(),
        };
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (e.nativeEvent.contentOffset.y > 72 && !scrollGate) {
      setScrollGate(true);
    }
  }

  async function onApply() {
    setError(null);
    setSuccess(null);
    if (code.trim().length < 4) {
      setError("Enter a valid code.");
      return;
    }
    if (!env.IS_CONFIGURED) {
      const found = mockDeals.find((d) => d.code.toUpperCase() === code.toUpperCase());
      if (found) {
        nav.navigate("Deal", { id: found.code });
      } else {
        setError("Code not recognised. Try ATMAD-NOIR-2026 in preview mode.");
      }
      return;
    }
    if (!auth.session) {
      setError("Sign in to redeem codes.");
      return;
    }
    setBusy(true);
    Haptics.selectionAsync();
    const r = await redeemCode({ code: code.trim() });
    setBusy(false);
    if (r.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(r.points ? `${r.points} points credited.` : "Code redeemed.");
      setCode("");
      auth.refreshProfile();
      load();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(r.error);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.foreground} />
          </View>
        ) : (
          <ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
              <Text style={LABEL}>Coupon Vault</Text>
              <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 26, color: colors.foreground }}>
                Redeem a code
              </Text>
            </View>

            <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(v.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="WELCOME50"
                  placeholderTextColor={colors.textFaint}
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: error ? colors.destructive : colors.border,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: 14,
                    fontFamily: fonts.bodyMedium,
                    fontSize: 14,
                    color: colors.foreground,
                    letterSpacing: 1,
                  }}
                />
                <Pressable
                  onPress={onApply}
                  disabled={busy}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.lg,
                    justifyContent: "center",
                    backgroundColor: colors.foreground,
                    borderRadius: radius.md,
                    opacity: pressed || busy ? 0.7 : 1,
                  })}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.inverse} />
                  ) : (
                    <Text
                      style={{
                        fontFamily: fonts.bodyMedium,
                        fontSize: 11,
                        letterSpacing: 2,
                        color: colors.inverse,
                        textTransform: "uppercase",
                      }}
                    >
                      Apply
                    </Text>
                  )}
                </Pressable>
              </View>
              {error ? <Text style={ERR_STYLE}>{error}</Text> : null}
              {success ? <Text style={OK_STYLE}>{success}</Text> : null}
            </View>

            <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl }}>
              <Text style={LABEL}>Member catalogue</Text>
              <Text style={{ marginTop: 4, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textTertiary }}>
                Codes stay hidden until you open a deal. Scroll to unlock the full partner list.
              </Text>
            </View>

            <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md, gap: spacing.sm }}>
              {catalog.map((row, index) => {
                const locked = index >= CATALOG_PREVIEW && !scrollGate;
                return (
                  <Pressable
                    key={`${row.code}-${index}`}
                    onPress={() => {
                      if (locked) {
                        showBanner("Keep scrolling", "Move down to reveal more partner offers.");
                        return;
                      }
                      nav.navigate("Deal", { id: row.code });
                    }}
                    style={({ pressed }) => ({
                      padding: spacing.md,
                      borderRadius: radius.md,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.72 : locked ? 0.4 : 1,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.muted,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather name={locked ? "lock" : "gift"} size={16} color={colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
                        {row.brand}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
                        {row.title}
                      </Text>
                      <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 10, color: colors.textTertiary }}>
                        {row.discountLine} · +{row.points} pts · code protected
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                  </Pressable>
                );
              })}
              {catalog.length === 0 ? (
                <Text style={{ fontFamily: fonts.bodyLight, fontSize: 13, color: colors.textTertiary }}>
                  No catalogue rows yet. Add active codes in Supabase.
                </Text>
              ) : null}
            </View>

            <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl }}>
              <Text style={LABEL}>Recent redemptions</Text>
            </View>
            <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md, gap: spacing.sm }}>
              {redemptions.length === 0 ? (
                <Text style={{ fontFamily: fonts.bodyLight, fontSize: 13, color: colors.textTertiary }}>
                  No codes redeemed yet.
                </Text>
              ) : (
                redemptions.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => nav.navigate("Deal", { id: item.code })}
                    style={({ pressed }) => ({
                      padding: spacing.md,
                      borderRadius: radius.md,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
                      {item.title}
                    </Text>
                    <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
                      {item.subtitle}
                    </Text>
                    <Text
                      style={{
                        marginTop: spacing.sm,
                        fontFamily: fonts.body,
                        fontSize: 10,
                        letterSpacing: 1,
                        color: colors.textTertiary,
                      }}
                    >
                      {item.code}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const LABEL = {
  fontFamily: fonts.body,
  fontSize: 9,
  letterSpacing: 3,
  color: colors.textTertiary,
  textTransform: "uppercase" as const,
};
const ERR_STYLE = {
  marginTop: spacing.sm,
  fontFamily: fonts.body,
  fontSize: 11,
  color: colors.destructiveSoft,
};
const OK_STYLE = {
  marginTop: spacing.sm,
  fontFamily: fonts.body,
  fontSize: 11,
  color: colors.foreground,
};
