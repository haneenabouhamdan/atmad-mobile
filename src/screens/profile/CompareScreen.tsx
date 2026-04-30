import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

interface Spec {
  label: string;
  values: [string, string];
  winner?: 0 | 1;
}

interface Item {
  id: string;
  brand: string;
  product: string;
  category: string;
  price: string;
  rating: number;
  image: string;
  highlight: string;
}

const CATALOGUE: Item[] = [
  { id: "a", brand: "Maison Atelier",  product: "Tonal Wool Coat",      category: "Fashion",    price: "AED 4,200",  rating: 4.7, image: "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=600",   highlight: "Hand-finished in Florence." },
  { id: "b", brand: "House of Cipher", product: "Carbon Travel Trunk",  category: "Travel",     price: "AED 9,800",  rating: 4.5, image: "https://images.unsplash.com/photo-1605379399843-5870eea9b74e?w=600",   highlight: "Aerospace-grade carbon." },
  { id: "c", brand: "Volume",          product: "Studio Headphones",    category: "Tech",       price: "AED 1,650",  rating: 4.6, image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600",   highlight: "Reference-grade studio sound." },
  { id: "d", brand: "Norden",          product: "Hifi Ceramic Cup",     category: "Lifestyle",  price: "AED   220",  rating: 4.6, image: "https://images.unsplash.com/photo-1517705008128-361805f42e86?w=600",   highlight: "Daily ritual." },
  { id: "e", brand: "Kura Atelier",    product: "Skin Reading Serum",   category: "Beauty",     price: "AED   620",  rating: 4.4, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",     highlight: "Adaptive ingredient blend." },
];

function buildSpecs(a: Item, b: Item): Spec[] {
  const ratingWinner: 0 | 1 = a.rating >= b.rating ? 0 : 1;
  return [
    { label: "Brand",     values: [a.brand,    b.brand] },
    { label: "Category",  values: [a.category, b.category] },
    { label: "Price",     values: [a.price,    b.price] },
    { label: "Rating",    values: [`${a.rating.toFixed(1)} / 5`, `${b.rating.toFixed(1)} / 5`], winner: ratingWinner },
    { label: "Highlight", values: [a.highlight, b.highlight] },
  ];
}

export function CompareScreen() {
  const [picks, setPicks] = useState<[string | null, string | null]>(["a", "b"]);
  const [openSlot, setOpenSlot] = useState<0 | 1 | null>(null);

  const left  = picks[0] ? CATALOGUE.find((i) => i.id === picks[0]) ?? null : null;
  const right = picks[1] ? CATALOGUE.find((i) => i.id === picks[1]) ?? null : null;
  const specs = left && right ? buildSpecs(left, right) : [];

  function pick(slot: 0 | 1, id: string) {
    const next: [string | null, string | null] = [picks[0], picks[1]];
    next[slot] = id;
    setPicks(next);
    setOpenSlot(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Compare" eyebrow="Profile" />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ flexDirection: "row", gap: spacing.md, padding: spacing.lg }}>
          <SlotCard slot={0} item={left}  onPick={() => setOpenSlot(0)} />
          <SlotCard slot={1} item={right} onPick={() => setOpenSlot(1)} />
        </View>

        {openSlot !== null && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase", marginBottom: spacing.sm }}>
              Choose for slot {openSlot + 1}
            </Text>
            <View style={{ gap: spacing.sm }}>
              {CATALOGUE.map((it) => (
                <Pressable
                  key={it.id}
                  onPress={() => pick(openSlot, it.id)}
                  style={{
                    padding: spacing.md, borderRadius: radius.md,
                    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>{it.product}</Text>
                    <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
                      {it.brand} · {it.category}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textTertiary }}>{it.price}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {specs.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase", marginBottom: spacing.sm }}>
              Side by side
            </Text>
            <View style={{
              borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
              backgroundColor: colors.card, overflow: "hidden",
            }}>
              {specs.map((s, i) => (
                <View
                  key={s.label}
                  style={{
                    padding: spacing.md,
                    borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border,
                  }}
                >
                  <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 2, color: colors.textTertiary, textTransform: "uppercase" }}>
                    {s.label}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 6, gap: spacing.lg }}>
                    {[0, 1].map((idx) => (
                      <View key={idx} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{
                          flex: 1,
                          fontFamily: fonts.body, fontSize: 12,
                          color: s.winner === idx ? colors.foreground : colors.textSecondary,
                        }}>
                          {s.values[idx]}
                        </Text>
                        {s.winner === idx ? (
                          <Feather name="award" size={12} color={colors.foreground} />
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SlotCard({ slot, item, onPick }: { slot: 0 | 1; item: Item | null; onPick: () => void }) {
  return (
    <Pressable
      onPress={onPick}
      style={{
        flex: 1, padding: spacing.md,
        backgroundColor: colors.card, borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.border,
        minHeight: 200,
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 2, color: colors.textTertiary, textTransform: "uppercase" }}>
        Slot {slot + 1}
      </Text>
      {item ? (
        <View style={{ marginTop: spacing.sm, flex: 1 }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.foreground }} numberOfLines={2}>
            {item.product}
          </Text>
          <Text style={{ marginTop: 4, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
            {item.brand}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.foreground }}>
            {item.price}
          </Text>
          <Text style={{ marginTop: 6, fontFamily: fonts.body, fontSize: 10, letterSpacing: 1.5, color: colors.textTertiary, textTransform: "uppercase" }}>
            Tap to change
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Feather name="plus" size={24} color={colors.textTertiary} />
          <Text style={{ marginTop: 6, fontFamily: fonts.body, fontSize: 11, color: colors.textTertiary }}>
            Pick item
          </Text>
        </View>
      )}
    </Pressable>
  );
}
