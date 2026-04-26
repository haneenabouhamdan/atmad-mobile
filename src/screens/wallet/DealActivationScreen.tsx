import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { WalletStackParamList } from "../../navigation/types";
import { findDealByCode, redeemCode } from "../../data/codesService";
import type { Deal } from "../../data/types";
import { useAuth } from "../../auth/AuthProvider";
import { env } from "../../lib/env";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type RP = RouteProp<WalletStackParamList, "Deal">;

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; deal: Deal }
  | { kind: "redeeming" }
  | { kind: "success"; pointsAwarded: number; discount?: string }
  | { kind: "error"; message: string };

export function DealActivationScreen() {
  const route = useRoute<RP>();
  const auth  = useAuth();
  const codeOrId = route.params?.id ?? "";
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    (async () => {
      const deal = await findDealByCode(codeOrId);
      if (!deal) {
        setStatus({ kind: "error", message: "Deal not found." });
      } else {
        setStatus({ kind: "ready", deal });
      }
    })();
  }, [codeOrId]);

  async function onActivate(code: string) {
    if (!env.IS_CONFIGURED) {
      setStatus({ kind: "error", message: "Backend not configured. Add Supabase keys to enable redemption." });
      return;
    }
    if (!auth.session) {
      setStatus({ kind: "error", message: "You need to sign in first." });
      return;
    }
    setStatus({ kind: "redeeming" });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await redeemCode({ code });
    if (r.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus({
        kind: "success",
        pointsAwarded: r.points ?? 0,
        discount: r.discountPercent ? `${r.discountPercent}% off` : undefined,
      });
      auth.refreshProfile();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus({ kind: "error", message: r.error });
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
        <Text style={{
          fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
          color: colors.textTertiary, textTransform: "uppercase",
        }}>
          Member Offer
        </Text>

        {status.kind === "loading" && (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxxl }}>
            <ActivityIndicator color={colors.foreground} />
          </View>
        )}

        {(status.kind === "ready" || status.kind === "redeeming") && (
          <DealView
            deal={status.kind === "ready" ? status.deal : (status as any).deal}
          />
        )}

        {status.kind === "ready" && (
          <Pressable
            onPress={() => onActivate(status.deal.code)}
            style={({ pressed }) => ({
              marginTop: spacing.xl,
              backgroundColor: colors.foreground,
              paddingVertical: 18,
              borderRadius: radius.md,
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{
              fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
              color: colors.inverse, textTransform: "uppercase",
            }}>
              Activate Offer
            </Text>
          </Pressable>
        )}

        {status.kind === "redeeming" && (
          <View style={{ marginTop: spacing.xl, alignItems: "center" }}>
            <ActivityIndicator color={colors.foreground} />
            <Text style={{
              marginTop: spacing.sm,
              fontFamily: fonts.body, fontSize: 11, letterSpacing: 2,
              color: colors.textTertiary, textTransform: "uppercase",
            }}>
              Verifying with server…
            </Text>
          </View>
        )}

        {status.kind === "success" && (
          <View style={{
            marginTop: spacing.xxl, padding: spacing.lg,
            backgroundColor: colors.card, borderRadius: radius.lg,
            borderWidth: 1, borderColor: colors.border,
            alignItems: "center",
          }}>
            <Text style={{
              fontFamily: fonts.heading, fontSize: 22, color: colors.foreground,
            }}>
              Offer activated.
            </Text>
            <Text style={{
              marginTop: spacing.sm,
              fontFamily: fonts.bodyLight, fontSize: 13, color: colors.textSecondary,
              textAlign: "center",
            }}>
              {status.pointsAwarded > 0
                ? `${status.pointsAwarded} points credited to your account.`
                : "Redemption logged."}
              {status.discount ? ` Discount: ${status.discount}.` : ""}
            </Text>
          </View>
        )}

        {status.kind === "error" && (
          <View style={{
            marginTop: spacing.xl, padding: spacing.lg,
            borderWidth: 1, borderColor: colors.destructive,
            borderRadius: radius.md,
          }}>
            <Text style={{
              fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
              color: colors.destructiveSoft, textTransform: "uppercase", marginBottom: 4,
            }}>
              Could not activate
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.foreground }}>
              {status.message}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DealView({ deal }: { deal: Deal }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={{
        fontFamily: fonts.heading, fontSize: 28, color: colors.foreground,
      }}>
        {deal.brand}
      </Text>
      <Text style={{
        marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 14,
        color: colors.textSecondary, lineHeight: 22,
      }}>
        {deal.description}
      </Text>

      <View style={{
        marginTop: spacing.lg, padding: spacing.lg,
        borderRadius: radius.lg, backgroundColor: colors.card,
        borderWidth: 1, borderColor: colors.border,
      }}>
        <Text style={{
          fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
          color: colors.textTertiary, textTransform: "uppercase",
        }}>
          Code
        </Text>
        <Text style={{
          marginTop: 4, fontFamily: fonts.bodyMedium, fontSize: 18,
          color: colors.foreground, letterSpacing: 1,
        }}>
          {deal.code}
        </Text>

        <View style={{
          flexDirection: "row", justifyContent: "space-between",
          marginTop: spacing.lg,
        }}>
          <View>
            <Text style={LABEL}>Reward</Text>
            <Text style={VALUE}>{deal.discount}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={LABEL}>Points</Text>
            <Text style={VALUE}>{deal.points}</Text>
          </View>
        </View>

        <Text style={{ marginTop: spacing.md, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textTertiary }}>
          {deal.expiry}
        </Text>
      </View>

      <Text style={{
        marginTop: spacing.lg, fontFamily: fonts.bodyLight, fontSize: 11,
        color: colors.textTertiary, lineHeight: 16,
      }}>
        {deal.terms}
      </Text>
    </View>
  );
}

const LABEL = {
  fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
  color: colors.textTertiary, textTransform: "uppercase" as const,
};
const VALUE = {
  marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground,
};
