import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { WalletStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthProvider";
import { fetchRecentLedger, listMyRedemptions } from "../../data/codesService";
import type { LedgerRow } from "../../data/codesService";
import { mockDeals, mockWallet } from "../../data/mock";
import { env } from "../../lib/env";
import {
  resolvePointsToNext,
  resolveProgressPct,
  resolveTier,
} from "../../intelligence/tierConfig";
import { useHomeIntelligenceStore } from "../../store/homeIntelligenceStore";
import { useSavedDealsStore } from "../../store/savedDealsStore";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<WalletStackParamList, "Wallet">;

interface OfferRow {
  id: string;
  title: string;
  subtitle: string;
  brand?: string;
  meta: string;
  code?: string;
}

export function WalletScreen() {
  const nav = useNavigation<Nav>();
  const auth = useAuth();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const streakDays = useHomeIntelligenceStore((s) => s.streakDays);
  const savedCodes = useSavedDealsStore((s) => s.codes);

  const points = auth.profile?.points ?? 0;
  const tierMeta = resolveTier(points);
  const progressPct = resolveProgressPct(points, tierMeta);
  const pointsToNext = resolvePointsToNext(points, tierMeta.id);
  const displayTierLabel =
    auth.profile?.tier ?? [tierMeta.label, tierMeta.roman].filter(Boolean).join(" ");

  const load = useCallback(async () => {
    if (!env.IS_CONFIGURED) {
      const fallback: OfferRow[] = [
        ...mockWallet.map((w) => ({
          id: w.id,
          title: w.title,
          subtitle: w.subtitle,
          brand: w.brand,
          meta: w.validUntil,
          code: w.code,
        })),
        ...mockDeals.slice(0, 2).map((d) => ({
          id: d.id,
          title: d.brand,
          subtitle: d.description,
          brand: d.brand,
          meta: d.expiry,
          code: d.code,
        })),
      ];
      setRows(fallback);
      setLedger([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const [reds, tx] = await Promise.all([listMyRedemptions(), fetchRecentLedger(24)]);
    setRows(
      reds.map((r: Record<string, unknown>) => {
        const raw = r.codes;
        const c = Array.isArray(raw) ? (raw[0] as Record<string, unknown> | undefined) : (raw as Record<string, unknown> | undefined);
        return {
          id: String(r.id ?? ""),
          title: String(c?.brand_id ?? "ATMAD"),
          subtitle: String(c?.deal_title ?? "Member offer"),
          meta: new Date(String(r.redeemed_at)).toLocaleDateString(),
          code: c?.code != null ? String(c.code) : undefined,
        };
      }),
    );
    setLedger(tx);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const streakDots = Math.min(Math.max(streakDays, 0), 7);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.foreground}
            />
          }
        >
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
            <Text style={LABEL}>Wallet</Text>

            <View
              style={{
                marginTop: spacing.md,
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 9,
                      letterSpacing: 3,
                      color: colors.textTertiary,
                      textTransform: "uppercase",
                    }}
                  >
                    Tier
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 22, color: colors.foreground }}>
                    {displayTierLabel}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
                    {tierMeta.sublabel}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 9,
                      letterSpacing: 3,
                      color: colors.textTertiary,
                      textTransform: "uppercase",
                    }}
                  >
                    Balance
                  </Text>
                  <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 20, color: colors.foreground }}>
                    {points.toLocaleString()} pts
                  </Text>
                </View>
              </View>
              {tierMeta.maxPoints !== Number.POSITIVE_INFINITY ? (
                <>
                  <View
                    style={{
                      marginTop: spacing.lg,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.muted,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${progressPct}%`,
                        height: "100%",
                        backgroundColor: colors.foreground,
                      }}
                    />
                  </View>
                  <Text style={{ marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 10, color: colors.textTertiary }}>
                    {pointsToNext > 0
                      ? `${pointsToNext.toLocaleString()} pts to next circle`
                      : "Top tier"}
                  </Text>
                </>
              ) : null}
            </View>

            <View style={{ marginTop: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Feather name="zap" size={14} color={colors.textSecondary} />
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.foreground }}>Visit streak</Text>
              <View style={{ flexDirection: "row", gap: 4, marginLeft: spacing.sm }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: i < streakDots ? colors.foreground : colors.border,
                    }}
                  />
                ))}
              </View>
              <Text style={{ marginLeft: "auto", fontFamily: fonts.bodyLight, fontSize: 10, color: colors.textTertiary }}>
                {streakDays}d
              </Text>
            </View>

            {savedCodes.length > 0 ? (
              <View style={{ marginTop: spacing.xl }}>
                <Text style={LABEL}>Saved for later</Text>
                <Text style={{ marginTop: 4, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textTertiary }}>
                  Bookmarks only — redeem on the deal screen to earn points.
                </Text>
                <View style={{ marginTop: spacing.sm, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {savedCodes.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => nav.navigate("Deal", { id: c })}
                      style={({ pressed }) => ({
                        paddingHorizontal: spacing.md,
                        paddingVertical: 10,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.bodyMedium,
                          fontSize: 11,
                          color: colors.foreground,
                          letterSpacing: 1,
                        }}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <View
              style={{
                marginTop: spacing.xl,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={LABEL}>Your offers</Text>
              <Pressable
                onPress={() => nav.navigate("Vault")}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.lg,
                  paddingVertical: 10,
                  backgroundColor: colors.foreground,
                  borderRadius: radius.md,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodyMedium,
                    fontSize: 10,
                    letterSpacing: 2,
                    color: colors.inverse,
                    textTransform: "uppercase",
                  }}
                >
                  Vault
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md, gap: spacing.md }}>
            {rows.length === 0 ? (
              <Text style={{ fontFamily: fonts.bodyLight, fontSize: 13, color: colors.textTertiary }}>
                No redeemed offers yet. Open Vault to browse the catalogue.
              </Text>
            ) : (
              rows.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => item.code && nav.navigate("Deal", { id: item.code })}
                  style={({ pressed }) => ({
                    padding: spacing.lg,
                    borderRadius: radius.lg,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={LABEL}>{item.brand ?? "ATMAD"}</Text>
                  <Text style={{ marginTop: 4, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.foreground }}>
                    {item.title}
                  </Text>
                  <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
                    {item.subtitle}
                  </Text>
                  <Text
                    style={{
                      marginTop: spacing.sm,
                      fontFamily: fonts.body,
                      fontSize: 10,
                      letterSpacing: 2,
                      color: colors.textTertiary,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.meta}
                  </Text>
                </Pressable>
              ))
            )}
          </View>

          {ledger.length > 0 ? (
            <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
              <Text style={LABEL}>Recent points</Text>
              <Text style={{ marginTop: 4, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textTertiary }}>
                From your Supabase ledger.
              </Text>
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {ledger.map((e) => (
                  <View
                    key={e.id}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: spacing.md }}>
                      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.foreground }}>
                        {e.reason}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 10, color: colors.textTertiary }}>
                        {new Date(e.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: fonts.bodyMedium,
                        fontSize: 13,
                        color: e.deltaPoints >= 0 ? colors.foreground : colors.destructiveSoft,
                      }}
                    >
                      {e.deltaPoints >= 0 ? "+" : ""}
                      {e.deltaPoints}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const LABEL = {
  fontFamily: fonts.body,
  fontSize: 9,
  letterSpacing: 3,
  color: colors.textTertiary,
  textTransform: "uppercase" as const,
};
