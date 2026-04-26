import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { WalletStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthProvider";
import { listMyRedemptions } from "../../data/codesService";
import { mockDeals, mockWallet } from "../../data/mock";
import { env } from "../../lib/env";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<WalletStackParamList, "Wallet">;

interface Row {
  id: string;
  title: string;
  subtitle: string;
  brand?: string;
  meta: string;
  code?: string;
}

export function WalletScreen() {
  const nav    = useNavigation<Nav>();
  const auth   = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!env.IS_CONFIGURED) {
      const fallback: Row[] = [
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
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const reds = await listMyRedemptions();
    setRows(
      reds.map((r: any) => ({
        id: r.id,
        title: r.codes?.brand_id ?? "ATMAD",
        subtitle: r.codes?.deal_title ?? "Member offer",
        meta: new Date(r.redeemed_at).toLocaleDateString(),
        code: r.codes?.code,
      })),
    );
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View>
          <Text style={LABEL}>Wallet</Text>
          <Text style={{
            marginTop: 4, fontFamily: fonts.heading, fontSize: 28,
            color: colors.foreground,
          }}>
            {auth.profile?.points ?? 0} pts
          </Text>
          <Text style={{
            marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 12,
            color: colors.textSecondary,
          }}>
            {auth.profile?.tier ?? "Silver"} tier
          </Text>
        </View>
        <Pressable
          onPress={() => nav.navigate("Vault")}
          style={({ pressed }) => ({
            paddingHorizontal: spacing.lg, paddingVertical: 10,
            backgroundColor: colors.foreground, borderRadius: radius.md,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{
            fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 2,
            color: colors.inverse, textTransform: "uppercase",
          }}>
            Redeem code
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.foreground} />
          }
          ListEmptyComponent={
            <View style={{ paddingVertical: spacing.xxxl, alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.bodyLight, fontSize: 13, color: colors.textTertiary }}>
                No saved offers yet.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => item.code && nav.navigate("Deal", { id: item.code })}
              style={({ pressed }) => ({
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: colors.card,
                borderWidth: 1, borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={LABEL}>{item.brand ?? "ATMAD"}</Text>
              <Text style={{
                marginTop: 4, fontFamily: fonts.bodyMedium, fontSize: 14,
                color: colors.foreground,
              }}>
                {item.title}
              </Text>
              <Text style={{
                marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 12,
                color: colors.textSecondary,
              }}>
                {item.subtitle}
              </Text>
              <Text style={{
                marginTop: spacing.sm, fontFamily: fonts.body, fontSize: 10, letterSpacing: 2,
                color: colors.textTertiary, textTransform: "uppercase",
              }}>
                {item.meta}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const LABEL = {
  fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
  color: colors.textTertiary, textTransform: "uppercase" as const,
};
