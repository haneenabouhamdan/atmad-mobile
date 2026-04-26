import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { WalletStackParamList } from "../../navigation/types";
import { listMyRedemptions, redeemCode } from "../../data/codesService";
import { mockDeals } from "../../data/mock";
import { env } from "../../lib/env";
import { useAuth } from "../../auth/AuthProvider";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<WalletStackParamList, "Vault">;

export function CouponVaultScreen() {
  const nav = useNavigation<Nav>();
  const auth = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!env.IS_CONFIGURED) {
      setItems(mockDeals.map((d) => ({
        id: d.id, code: d.code, title: d.brand, subtitle: d.description, meta: d.expiry,
      })));
      setLoading(false);
      return;
    }
    const reds = await listMyRedemptions();
    setItems(reds.map((r: any) => ({
      id: r.id, code: r.codes?.code ?? "—",
      title: r.codes?.brand_id ?? "ATMAD",
      subtitle: r.codes?.deal_title ?? "Member offer",
      meta: new Date(r.redeemed_at).toLocaleDateString(),
    })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
          <Text style={LABEL}>Coupon Vault</Text>
          <Text style={{
            marginTop: 4, fontFamily: fonts.heading, fontSize: 26,
            color: colors.foreground,
          }}>
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
                fontFamily: fonts.bodyMedium, fontSize: 14,
                color: colors.foreground, letterSpacing: 1,
              }}
            />
            <Pressable
              onPress={onApply}
              disabled={busy}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.lg, justifyContent: "center",
                backgroundColor: colors.foreground,
                borderRadius: radius.md,
                opacity: pressed || busy ? 0.7 : 1,
              })}
            >
              {busy ? (
                <ActivityIndicator color={colors.inverse} />
              ) : (
                <Text style={{
                  fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
                  color: colors.inverse, textTransform: "uppercase",
                }}>
                  Apply
                </Text>
              )}
            </Pressable>
          </View>
          {error   && <Text style={ERR_STYLE}>{error}</Text>}
          {success && <Text style={OK_STYLE}>{success}</Text>}
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <Text style={LABEL}>Recent redemptions</Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.foreground} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120, paddingTop: spacing.md }}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListEmptyComponent={
              <Text style={{
                marginTop: spacing.xl, textAlign: "center",
                fontFamily: fonts.bodyLight, fontSize: 13, color: colors.textTertiary,
              }}>
                No codes redeemed yet.
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => nav.navigate("Deal", { id: item.code })}
                style={({ pressed }) => ({
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.card,
                  borderWidth: 1, borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: "row", alignItems: "center", gap: spacing.md,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
                    {item.title}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
                    {item.subtitle}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 10, letterSpacing: 1, color: colors.textTertiary }}>
                  {item.code}
                </Text>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const LABEL = {
  fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
  color: colors.textTertiary, textTransform: "uppercase" as const,
};
const ERR_STYLE = {
  marginTop: spacing.sm,
  fontFamily: fonts.body, fontSize: 11,
  color: colors.destructiveSoft,
};
const OK_STYLE = {
  marginTop: spacing.sm,
  fontFamily: fonts.body, fontSize: 11,
  color: colors.foreground,
};
