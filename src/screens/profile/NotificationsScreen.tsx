import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const PREFS_KEY = "atmad.notifications.prefs.v1";

interface Prefs {
  dailyBrief: boolean;
  drops: boolean;
  pointsAndRewards: boolean;
  replies: boolean;
  marketingPartners: boolean;
}

const DEFAULT_PREFS: Prefs = {
  dailyBrief: true,
  drops: true,
  pointsAndRewards: true,
  replies: true,
  marketingPartners: false,
};

interface NotificationItem {
  id: string;
  category: "Drop" | "Points" | "Editorial" | "Reply";
  title: string;
  body: string;
  when: string;
  read: boolean;
}

const HISTORY: NotificationItem[] = [
  { id: "n1", category: "Drop",      title: "House of Cipher · Carbon Trunk",      body: "Members-first window opens at 18:00 GST. 320 units globally.", when: "2h ago",   read: false },
  { id: "n2", category: "Points",    title: "+120 points",                          body: "Maison Atelier in-store activation, Dubai Mall.",              when: "Yesterday", read: false },
  { id: "n3", category: "Editorial", title: "Mind Lounge · Daily brief",            body: "Four things worth your morning.",                              when: "Yesterday", read: true  },
  { id: "n4", category: "Reply",     title: "Layla replied to your wishlist",       body: "Added two alternatives in your size.",                         when: "2 days ago", read: true  },
  { id: "n5", category: "Points",    title: "Tier review",                          body: "You're 480 points from Gold. Earn faster with referrals.",     when: "4 days ago", read: true  },
];

const PREF_ROWS: { key: keyof Prefs; label: string; sub: string; icon: React.ComponentProps<typeof Feather>["name"] }[] = [
  { key: "dailyBrief",        icon: "sun",        label: "Daily brief",         sub: "06:30 GST · quietly" },
  { key: "drops",             icon: "package",    label: "Member drops",        sub: "First-access windows" },
  { key: "pointsAndRewards",  icon: "star",       label: "Points & rewards",    sub: "Earnings, expiries, tier" },
  { key: "replies",           icon: "message-circle", label: "Replies",         sub: "When an editor responds" },
  { key: "marketingPartners", icon: "tag",        label: "Partner offers",      sub: "Curated, never spammy" },
];

export function NotificationsScreen() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [items, setItems] = useState<NotificationItem[]>(HISTORY);

  useEffect(() => {
    SecureStore.getItemAsync(PREFS_KEY).then((raw) => {
      if (raw) {
        try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); } catch {}
      }
    });
  }, []);

  function setPref(key: keyof Prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next)).catch(() => {});
  }

  function markRead(id: string) {
    setItems((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  function markAllRead() {
    setItems((p) => p.map((n) => ({ ...n, read: true })));
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Notifications" eyebrow="Profile" />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
            <View>
              <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
                Inbox
              </Text>
              <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 24, color: colors.foreground }}>
                {unread > 0 ? `${unread} new` : "All caught up"}
              </Text>
            </View>
            {unread > 0 ? (
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text style={{
                  fontFamily: fonts.body, fontSize: 11, letterSpacing: 1.5,
                  color: colors.textSecondary, textTransform: "uppercase",
                }}>
                  Mark all read
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm }}>
          {items.map((n) => (
            <Pressable
              key={n.id}
              onPress={() => markRead(n.id)}
              style={{
                padding: spacing.lg,
                backgroundColor: n.read ? colors.background : colors.card,
                borderRadius: radius.lg,
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {!n.read ? (
                    <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: colors.foreground }} />
                  ) : null}
                  <Text style={{
                    fontFamily: fonts.body, fontSize: 9, letterSpacing: 2,
                    color: colors.textTertiary, textTransform: "uppercase",
                  }}>
                    {n.category}
                  </Text>
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textTertiary }}>{n.when}</Text>
              </View>
              <Text style={{
                marginTop: 6,
                fontFamily: n.read ? fonts.body : fonts.bodyMedium,
                fontSize: 14, color: colors.foreground,
              }}>
                {n.title}
              </Text>
              <Text style={{
                marginTop: 2,
                fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary,
              }}>
                {n.body}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{
          marginTop: spacing.xxl, marginBottom: spacing.sm,
          paddingHorizontal: spacing.xl,
          fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
          color: colors.textTertiary, textTransform: "uppercase",
        }}>
          What you hear from us
        </Text>
        <View style={{
          marginHorizontal: spacing.xl,
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderWidth: 1, borderColor: colors.border,
          overflow: "hidden",
        }}>
          {PREF_ROWS.map((row, i) => (
            <View
              key={row.key}
              style={{
                flexDirection: "row", alignItems: "center", gap: spacing.md,
                paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border,
              }}
            >
              <View style={{
                width: 28, height: 28, borderRadius: radius.md,
                backgroundColor: colors.background,
                alignItems: "center", justifyContent: "center",
              }}>
                <Feather name={row.icon} size={13} color={colors.foreground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
                  {row.label}
                </Text>
                <Text style={{ marginTop: 1, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
                  {row.sub}
                </Text>
              </View>
              <Switch
                value={prefs[row.key]}
                onValueChange={(v) => setPref(row.key, v)}
                trackColor={{ true: colors.foreground, false: "rgba(60,60,60,0.18)" }}
                thumbColor={colors.background}
                ios_backgroundColor="rgba(60,60,60,0.18)"
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
