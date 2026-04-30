import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { Feather } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { WalletStackParamList } from "../../navigation/types";
import { findDealByCode, redeemCode } from "../../data/codesService";
import type { Deal } from "../../data/types";
import { useAuth } from "../../auth/AuthProvider";
import { env } from "../../lib/env";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useSavedDealsStore } from "../../store/savedDealsStore";
import { useNotificationBannerStore } from "../../store/notificationBannerStore";

type RP = RouteProp<WalletStackParamList, "Deal">;

export function DealActivationScreen() {
  const route = useRoute<RP>();
  const auth = useAuth();
  const codeOrId = route.params?.id ?? "";

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [redeemPhase, setRedeemPhase] = useState<"idle" | "redeeming" | "success" | "error">("idle");
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [successMeta, setSuccessMeta] = useState<{ pointsAwarded: number; discount?: string } | null>(
    null,
  );
  const [shopReturnOpen, setShopReturnOpen] = useState(false);

  const expectingShopReturn = useRef(false);
  const saveCode = useSavedDealsStore((s) => s.saveCode);
  const savedCodes = useSavedDealsStore((s) => s.codes);
  const hasSaved = useMemo(() => {
    const c = (deal?.code ?? codeOrId).trim().toUpperCase();
    if (!c) return false;
    return savedCodes.includes(c);
  }, [savedCodes, deal?.code, codeOrId]);
  const removeSaved = useSavedDealsStore((s) => s.removeCode);
  const showBanner = useNotificationBannerStore((s) => s.show);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);
    setCodeRevealed(false);
    setRedeemPhase("idle");
    setRedeemError(null);
    setSuccessMeta(null);
    (async () => {
      const d = await findDealByCode(codeOrId);
      if (!mounted) return;
      if (!d) {
        setLoadError("Deal not found.");
        setDeal(null);
      } else {
        setDeal(d);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [codeOrId]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && expectingShopReturn.current) {
        expectingShopReturn.current = false;
        setShopReturnOpen(true);
      }
    });
    return () => sub.remove();
  }, []);

  const onReveal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCodeRevealed(true);
  }, []);

  const onCopy = useCallback(
    async (code: string) => {
      await Clipboard.setStringAsync(code);
      Haptics.selectionAsync();
      showBanner("Copied", "Code is on your clipboard.");
    },
    [showBanner],
  );

  const onOpenShop = useCallback(
    async (url: string) => {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
      try {
        expectingShopReturn.current = true;
        await Linking.openURL(normalized);
      } catch {
        expectingShopReturn.current = false;
        showBanner("Could not open link", "Check the partner URL in Studio / Supabase metadata.");
      }
    },
    [showBanner],
  );

  const onSaveForLater = useCallback(() => {
    if (!deal) return;
    saveCode(deal.code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showBanner("Saved for later", "Find it in Wallet — bookmark only, no points until you redeem.");
  }, [deal, saveCode, showBanner]);

  const onRemoveBookmark = useCallback(() => {
    if (!deal) return;
    removeSaved(deal.code);
    Haptics.selectionAsync();
  }, [deal, removeSaved]);

  async function onRedeemForPoints(code: string) {
    setRedeemError(null);
    if (!env.IS_CONFIGURED) {
      setRedeemPhase("error");
      setRedeemError("Backend not configured. Add Supabase keys to enable redemption.");
      return;
    }
    if (!auth.session) {
      setRedeemPhase("error");
      setRedeemError("Sign in to redeem and earn points.");
      return;
    }
    setRedeemPhase("redeeming");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await redeemCode({ code });
    if (r.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRedeemPhase("success");
      setSuccessMeta({
        pointsAwarded: r.points ?? 0,
        discount: r.discountPercent ? `${r.discountPercent}% off` : undefined,
      });
      auth.refreshProfile();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setRedeemPhase("error");
      setRedeemError(r.error);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
        <Text style={EYEBROW}>Member Offer</Text>
        <Text style={HINT}>
          Reveal the code when you are ready. <Text style={HINT_STRONG}>Redeem</Text> logs the offer with
          ATMAD and credits points. <Text style={HINT_STRONG}>Save</Text> bookmarks locally only.
        </Text>

        {loading && (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxxl }}>
            <ActivityIndicator color={colors.foreground} />
          </View>
        )}

        {!loading && loadError && (
          <View style={ERR_BOX}>
            <Text style={ERR_TITLE}>Could not load</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.foreground }}>{loadError}</Text>
          </View>
        )}

        {!loading && deal && (
          <>
            <DealBody deal={deal} codeRevealed={codeRevealed} />

            {!codeRevealed ? (
              <Pressable onPress={onReveal} style={PRIMARY_BTN}>
                <Text style={PRIMARY_LABEL}>Reveal member code</Text>
              </Pressable>
            ) : (
              <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  <Pressable onPress={() => onCopy(deal.code)} style={SECONDARY_BTN}>
                    <Feather name="copy" size={16} color={colors.foreground} />
                    <Text style={SECONDARY_LABEL}>Copy</Text>
                  </Pressable>
                  {deal.affiliateUrl ? (
                    <Pressable onPress={() => onOpenShop(deal.affiliateUrl!)} style={SECONDARY_BTN}>
                      <Feather name="external-link" size={16} color={colors.foreground} />
                      <Text style={SECONDARY_LABEL}>Shop partner site</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={hasSaved ? onRemoveBookmark : onSaveForLater}
                    style={SECONDARY_BTN}
                  >
                    <Feather name={hasSaved ? "x" : "bookmark"} size={16} color={colors.foreground} />
                    <Text style={SECONDARY_LABEL}>{hasSaved ? "Remove bookmark" : "Save for later"}</Text>
                  </Pressable>
                </View>

                {redeemPhase !== "success" && (
                  <Pressable
                    onPress={() => onRedeemForPoints(deal.code)}
                    disabled={redeemPhase === "redeeming"}
                    style={PRIMARY_BTN}
                  >
                    {redeemPhase === "redeeming" ? (
                      <ActivityIndicator color={colors.inverse} />
                    ) : (
                      <Text style={PRIMARY_LABEL}>Redeem for points</Text>
                    )}
                  </Pressable>
                )}
              </View>
            )}

            {redeemPhase === "error" && redeemError && (
              <View style={[ERR_BOX, { marginTop: spacing.md }]}>
                <Text style={ERR_TITLE}>Redeem failed</Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.foreground }}>
                  {redeemError}
                </Text>
              </View>
            )}

            {redeemPhase === "success" && successMeta && (
              <View style={SUCCESS_BOX}>
                <Text style={SUCCESS_TITLE}>Redeemed</Text>
                <Text style={SUCCESS_BODY}>
                  {successMeta.pointsAwarded > 0
                    ? `${successMeta.pointsAwarded} points credited.`
                    : "Redemption logged."}
                  {successMeta.discount ? ` ${successMeta.discount}` : ""}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal transparent visible={shopReturnOpen} animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            padding: spacing.xl,
          }}
          onPress={() => setShopReturnOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.background,
              borderRadius: radius.lg,
              padding: spacing.xl,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.foreground }}>
              Welcome back
            </Text>
            <Text
              style={{
                marginTop: spacing.sm,
                fontFamily: fonts.bodyLight,
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 20,
              }}
            >
              Still need your code? Tap Copy on this screen before you check out.
            </Text>
            {deal && codeRevealed ? (
              <Pressable
                onPress={() => {
                  setShopReturnOpen(false);
                  void onCopy(deal.code);
                }}
                style={({ pressed }) => ({
                  marginTop: spacing.lg,
                  backgroundColor: colors.foreground,
                  paddingVertical: 16,
                  borderRadius: radius.md,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={PRIMARY_LABEL}>Copy code now</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setShopReturnOpen(false)} style={{ marginTop: spacing.md }}>
              <Text
                style={{
                  fontFamily: fonts.bodyMedium,
                  fontSize: 11,
                  letterSpacing: 2,
                  color: colors.textTertiary,
                  textAlign: "center",
                  textTransform: "uppercase",
                }}
              >
                Dismiss
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DealBody({ deal, codeRevealed }: { deal: Deal; codeRevealed: boolean }) {
  const masked = "•".repeat(Math.min(Math.max(deal.code.length, 6), 12));
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.foreground }}>{deal.brand}</Text>
      <Text
        style={{
          marginTop: spacing.sm,
          fontFamily: fonts.bodyLight,
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 22,
        }}
      >
        {deal.description}
      </Text>

      <View
        style={{
          marginTop: spacing.lg,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={LABEL}>Code</Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: fonts.bodyMedium,
            fontSize: 18,
            color: colors.foreground,
            letterSpacing: codeRevealed ? 1 : 4,
          }}
        >
          {codeRevealed ? deal.code : masked}
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: spacing.lg,
          }}
        >
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

      <Text
        style={{
          marginTop: spacing.lg,
          fontFamily: fonts.bodyLight,
          fontSize: 11,
          color: colors.textTertiary,
          lineHeight: 16,
        }}
      >
        {deal.terms}
      </Text>
    </View>
  );
}

const EYEBROW = {
  fontFamily: fonts.body,
  fontSize: 9,
  letterSpacing: 3,
  color: colors.textTertiary,
  textTransform: "uppercase" as const,
};
const HINT = {
  marginTop: spacing.sm,
  fontFamily: fonts.bodyLight,
  fontSize: 12,
  color: colors.textSecondary,
  lineHeight: 18,
};
const HINT_STRONG = { fontFamily: fonts.bodyMedium, color: colors.foreground };
const LABEL = {
  fontFamily: fonts.body,
  fontSize: 9,
  letterSpacing: 3,
  color: colors.textTertiary,
  textTransform: "uppercase" as const,
};
const VALUE = {
  marginTop: 2,
  fontFamily: fonts.bodyMedium,
  fontSize: 13,
  color: colors.foreground,
};
const PRIMARY_BTN = ({ pressed }: { pressed: boolean }) => ({
  marginTop: spacing.xl,
  backgroundColor: colors.foreground,
  paddingVertical: 16,
  borderRadius: radius.md,
  alignItems: "center" as const,
  opacity: pressed ? 0.85 : 1,
});
const PRIMARY_LABEL = {
  fontFamily: fonts.bodyMedium,
  fontSize: 11,
  letterSpacing: 3,
  color: colors.inverse,
  textTransform: "uppercase" as const,
};
const SECONDARY_BTN = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 8,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.card,
};
const SECONDARY_LABEL = {
  fontFamily: fonts.bodyMedium,
  fontSize: 10,
  letterSpacing: 1.5,
  color: colors.foreground,
  textTransform: "uppercase" as const,
};
const ERR_BOX = {
  marginTop: spacing.xl,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.destructive,
  borderRadius: radius.md,
};
const ERR_TITLE = {
  fontFamily: fonts.bodyMedium,
  fontSize: 11,
  letterSpacing: 2,
  color: colors.destructiveSoft,
  textTransform: "uppercase" as const,
  marginBottom: 4,
};
const SUCCESS_BOX = {
  marginTop: spacing.xxl,
  padding: spacing.lg,
  backgroundColor: colors.card,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
};
const SUCCESS_TITLE = {
  fontFamily: fonts.heading,
  fontSize: 22,
  color: colors.foreground,
};
const SUCCESS_BODY = {
  marginTop: spacing.sm,
  fontFamily: fonts.bodyLight,
  fontSize: 13,
  color: colors.textSecondary,
};
