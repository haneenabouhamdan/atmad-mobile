/**
 * Modal-based country / dial-code picker.
 *
 * Designed to feel native to the rest of ATMAD's auth flow: monochrome
 * surfaces, all-caps labels, and a search field that filters by name,
 * dial code, or ISO-2 country code (typing "uae", "971", or "ae" all
 * resolve to the United Arab Emirates).
 */
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  COUNTRIES,
  POPULAR_COUNTRY_CODES,
  type Country,
} from "../data/countries";
import { colors, fonts, radius, spacing } from "../theme/tokens";

interface Props {
  /** Currently selected country (controlled). */
  selected: Country;
  /** Fired when the user taps a country in the list. */
  onSelect: (c: Country) => void;
  /**
   * Trigger + list styling:
   * - dial: phone dialing (shows +971, rows show dial codes)
   * - name: full country name next to flag
   * - market: flag + ISO code for compact “deals region” selection (no dial in UI)
   */
  summary?: "dial" | "name" | "market";
  /** Top-right toolbar — align trigger to the end (with `market` summary). */
  placement?: "default" | "headerRight";
}

export function CountryCodePicker({
  selected,
  onSelect,
  summary = "dial",
  placement = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const isMarket = summary === "market";
  const isCompactHeaderMarket = placement === "headerRight" && isMarket;

  const a11yLabel =
    summary === "market"
      ? `Deals in ${selected.name}. Tap to change country.`
      : summary === "name"
        ? `Country ${selected.name}, tap to change`
        : `Country code ${selected.dial}, tap to change`;

  const briefLabel =
    summary === "market"
      ? selected.code.toUpperCase()
      : summary === "name"
        ? selected.name
        : selected.dial;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          borderRadius: isCompactHeaderMarket ? radius.sm : radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: isCompactHeaderMarket ? 6 : spacing.md,
          paddingVertical: isCompactHeaderMarket ? 5 : placement === "headerRight" && isMarket ? 10 : 14,
          gap: isCompactHeaderMarket ? 4 : summary === "market" ? 8 : 6,
          opacity: pressed ? 0.7 : 1,
          maxWidth: "100%",
          ...(summary === "name" || isMarket
            ? {
                alignSelf:
                  placement === "headerRight" && isMarket ? "flex-end" : "center",
              }
            : {}),
        })}
      >
        <Text style={{ fontSize: isCompactHeaderMarket ? 14 : isMarket ? 20 : 16 }}>{selected.flag}</Text>
        <Text
          numberOfLines={summary === "name" ? 2 : 1}
          style={{
            fontFamily: isMarket ? fonts.bodySemi : fonts.body,
            fontSize: isCompactHeaderMarket ? 9 : isMarket ? 11 : summary === "name" ? 14 : 13,
            letterSpacing: isCompactHeaderMarket ? 1 : isMarket ? 1.5 : 0,
            color: colors.foreground,
            flexShrink: 1,
            ...(summary === "name" ? { maxWidth: 280 } : {}),
          }}
        >
          {briefLabel}
        </Text>
        <Feather
          name="chevron-down"
          size={isCompactHeaderMarket ? 11 : 14}
          color={colors.textTertiary}
        />
      </Pressable>

      <CountryListModal
        visible={open}
        selectedCode={selected.code}
        variant={summary}
        onClose={() => setOpen(false)}
        onPick={(c) => {
          onSelect(c);
          setOpen(false);
        }}
      />
    </>
  );
}

function CountryListModal({
  visible,
  selectedCode,
  variant,
  onClose,
  onPick,
}: {
  visible: boolean;
  selectedCode: string;
  variant?: "dial" | "name" | "market";
  onClose: () => void;
  onPick: (c: Country) => void;
}) {
  const [query, setQuery] = useState("");
  const isMarket = variant === "market";

  const data = useMemo(() => buildList(query), [query]);

  const eyebrow = isMarket ? "Deals region" : "Country";
  const headline = isMarket ? "Discounts — market" : "Select your country";
  const subtitle = isMarket
    ? "Choose which country’s offers & perks appear in your feed."
    : undefined;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{
          paddingHorizontal: spacing.xl, paddingTop: spacing.md,
          paddingBottom: spacing.lg,
          borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{
              fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
              color: colors.textTertiary, textTransform: "uppercase",
            }}>
              {eyebrow}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={{
                fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2,
                color: colors.foreground, textTransform: "uppercase",
              }}>
                Close
              </Text>
            </Pressable>
          </View>
          <Text style={{
            marginTop: 4,
            fontFamily: fonts.heading, fontSize: 20, color: colors.foreground,
          }}>
            {headline}
          </Text>
          {subtitle ? (
            <Text style={{
              marginTop: spacing.xs,
              fontFamily: fonts.bodyLight,
              fontSize: 12,
              color: colors.textTertiary,
              lineHeight: 17,
            }}>
              {subtitle}
            </Text>
          ) : null}

          <View style={{
            marginTop: spacing.md,
            flexDirection: "row", alignItems: "center", gap: 8,
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1, borderColor: colors.border,
            paddingHorizontal: spacing.md,
          }}>
            <Feather name="search" size={14} color={colors.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={isMarket ? "Search country" : "Search country or code"}
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1, paddingVertical: 12,
                fontFamily: fonts.body, fontSize: 14, color: colors.foreground,
              }}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x" size={14} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) =>
            item.kind === "section" ? `section:${item.title}` : `country:${item.country.code}`
          }
          renderItem={({ item }) =>
            item.kind === "section" ? (
              <Text style={{
                paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xs,
                fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
                color: colors.textTertiary, textTransform: "uppercase",
              }}>
                {item.title}
              </Text>
            ) : (
              <CountryRow
                country={item.country}
                active={item.country.code === selectedCode}
                showDial={!isMarket}
                onPress={() => onPick(item.country)}
              />
            )
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: spacing.xxxl }}>
              <Text style={{
                fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textTertiary,
              }}>
                No countries match "{query}"
              </Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
        />
      </SafeAreaView>
    </Modal>
  );
}

function CountryRow({
  country, active, onPress, showDial = true,
}: {
  country: Country;
  active: boolean;
  onPress: () => void;
  showDial?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", gap: spacing.md,
        paddingHorizontal: spacing.xl, paddingVertical: 14,
        backgroundColor: pressed ? "rgba(60,60,60,0.06)" : "transparent",
      })}
    >
      <Text style={{ fontSize: 22 }}>{country.flag}</Text>
      <Text style={{
        flex: 1,
        fontFamily: active ? fonts.bodyMedium : fonts.body,
        fontSize: 14, color: colors.foreground,
      }}>
        {country.name}
      </Text>
      {showDial ? (
        <Text style={{
          fontFamily: fonts.body, fontSize: 13,
          color: active ? colors.foreground : colors.textTertiary,
        }}>
          {country.dial}
        </Text>
      ) : (
        <Text style={{
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
          letterSpacing: 1,
          color: active ? colors.foreground : colors.textTertiary,
        }}>
          {country.code}
        </Text>
      )}
      {active && (
        <Feather name="check" size={14} color={colors.foreground} style={{ marginLeft: 4 }} />
      )}
    </Pressable>
  );
}

type ListItem =
  | { kind: "section"; title: string }
  | { kind: "country"; country: Country };

function buildList(query: string): ListItem[] {
  const q = query.trim().toLowerCase();
  // Strip a leading "+" so "+971" and "971" both match dial codes.
  const dialQ = q.replace(/^\+/, "");

  const matches = (c: Country) => {
    if (!q) return true;
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.code.toLowerCase().includes(q)) return true;
    if (c.dial.replace(/^\+/, "").includes(dialQ)) return true;
    return false;
  };

  const sortedAll = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

  if (!q) {
    const popular = POPULAR_COUNTRY_CODES
      .map((code) => sortedAll.find((c) => c.code === code))
      .filter((c): c is Country => Boolean(c));
    const popularSet = new Set(popular.map((c) => c.code));
    const rest = sortedAll.filter((c) => !popularSet.has(c.code));

    return [
      { kind: "section", title: "Popular" },
      ...popular.map<ListItem>((country) => ({ kind: "country", country })),
      { kind: "section", title: "All countries" },
      ...rest.map<ListItem>((country) => ({ kind: "country", country })),
    ];
  }

  return sortedAll
    .filter(matches)
    .map<ListItem>((country) => ({ kind: "country", country }));
}
