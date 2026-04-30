import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenHeader } from "../../components/ScreenHeader";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../auth/AuthProvider";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

interface Lead {
  id: string;
  brand_id: string;
  form_id: string;
  listing_id: string | null;
  payload: Record<string, unknown>;
  age_verified: boolean;
  webhook_status: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  sent: "Forwarded",
  failed: "Webhook failed",
  sheets_fallback: "Sheets fallback",
  no_destination: "Stored only",
  pending: "Pending",
};

export function MyLeadsScreen() {
  const { profile } = useAuth();
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: e } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (e) setError(e.message);
    else setLeads((data ?? []) as Lead[]);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const isAdvertiser = profile?.user_role === "advertiser" || profile?.user_role === "admin";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="My Leads" eyebrow="Back" />

      {!isAdvertiser ? (
        <View style={styles.center}>
          <Feather name="lock" size={20} color={colors.textTertiary} />
          <Text style={styles.helper}>
            Lead inbox is available to advertiser accounts.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.foreground} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={20} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : leads.length === 0 ? (
        <View style={styles.center}>
          <Feather name="inbox" size={28} color={colors.textTertiary} />
          <Text style={styles.helper}>No leads yet — they'll show up here as members submit forms.</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => <LeadRow lead={item} />}
        />
      )}
    </View>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const date = new Date(lead.created_at);
  const entries = Object.entries(lead.payload).slice(0, 4);
  const status = lead.webhook_status ?? "pending";
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>
          {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <View style={[styles.badge, badgeTone(status)]}>
          <Text style={styles.badgeLabel}>{STATUS_LABEL[status] ?? status}</Text>
        </View>
      </View>

      {entries.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <Text style={styles.rowKey}>{k}</Text>
          <Text style={styles.rowValue} numberOfLines={2}>
            {Array.isArray(v) ? v.join(", ") : String(v)}
          </Text>
        </View>
      ))}

      {lead.age_verified ? (
        <View style={styles.ageBadge}>
          <Feather name="user-check" size={11} color={colors.foreground} />
          <Text style={styles.ageLabel}>Age verified</Text>
        </View>
      ) : null}
    </View>
  );
}

function badgeTone(status: string): { backgroundColor: string } {
  if (status === "sent") return { backgroundColor: "#E8F4EA" };
  if (status === "failed") return { backgroundColor: "#FAE0E0" };
  if (status === "sheets_fallback") return { backgroundColor: "#F2EBD7" };
  return { backgroundColor: colors.muted };
}

const styles = StyleSheet.create({
  center: {
    flex: 1, alignItems: "center", justifyContent: "center",
    gap: spacing.sm, paddingHorizontal: spacing.xl,
  },
  helper: {
    fontFamily: fonts.body, fontSize: 13, color: colors.textTertiary, textAlign: "center",
  },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.destructive },
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  cardDate: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textTertiary, letterSpacing: 0.6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1,
    textTransform: "uppercase", color: colors.foreground,
  },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  rowKey: {
    fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textTertiary,
    width: 96, textTransform: "uppercase", letterSpacing: 1,
  },
  rowValue: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.foreground },
  ageBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", marginTop: spacing.xs,
    backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill,
  },
  ageLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 0.8,
    textTransform: "uppercase", color: colors.foreground,
  },
});
