import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const STORAGE_KEY = "atmad.identity.vault.v1";

type DocKind = "passport" | "id" | "card" | "loyalty" | "key" | "other";

interface VaultDoc {
  id: string;
  kind: DocKind;
  label: string;
  detail: string;
  secret: string;
  createdAt: number;
}

const KIND_META: Record<DocKind, { icon: React.ComponentProps<typeof Feather>["name"]; label: string }> = {
  passport: { icon: "globe",       label: "Passport" },
  id:       { icon: "credit-card", label: "ID" },
  card:     { icon: "credit-card", label: "Card" },
  loyalty:  { icon: "star",        label: "Loyalty" },
  key:      { icon: "key",         label: "Key / Code" },
  other:    { icon: "file",        label: "Other" },
};

async function loadDocs(): Promise<VaultDoc[]> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VaultDoc[];
  } catch {
    return [];
  }
}
async function saveDocs(docs: VaultDoc[]) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(docs));
}

/**
 * Identity Vault — encrypted, on-device only. Uses expo-secure-store, which
 * is backed by Keychain (iOS) and Keystore-encrypted SharedPreferences
 * (Android). Nothing here ever leaves the device.
 */
export function IdentityVaultScreen() {
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadDocs().then(setDocs);
  }, []);

  async function add(doc: Omit<VaultDoc, "id" | "createdAt">) {
    const next = [
      ...docs,
      { ...doc, id: String(Date.now()), createdAt: Date.now() },
    ];
    setDocs(next);
    await saveDocs(next);
    setAdding(false);
  }

  function remove(id: string) {
    Alert.alert("Remove document", "This will delete it from your device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const next = docs.filter((d) => d.id !== id);
          setDocs(next);
          await saveDocs(next);
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Identity Vault"
        eyebrow="Profile"
        rightIcon="plus"
        onRightPress={() => setAdding(true)}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 8,
            paddingHorizontal: spacing.md, paddingVertical: 10,
            borderRadius: radius.md,
            backgroundColor: "rgba(60,60,60,0.06)",
          }}>
            <Feather name="lock" size={12} color={colors.textSecondary} />
            <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary }}>
              Encrypted on this device. Nothing syncs.
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.md }}>
          {docs.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: spacing.xxxl }}>
              <Feather name="shield" size={28} color={colors.textTertiary} />
              <Text style={{
                marginTop: spacing.md,
                fontFamily: fonts.heading, fontSize: 18, color: colors.foreground,
              }}>
                Your vault is empty
              </Text>
              <Text style={{
                marginTop: 4, paddingHorizontal: spacing.xl,
                fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textTertiary,
                textAlign: "center",
              }}>
                Add a passport number, loyalty code, or anything you'd rather not type from memory.
              </Text>
              <Pressable
                onPress={() => setAdding(true)}
                style={{
                  marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: 12,
                  borderRadius: radius.md, backgroundColor: colors.foreground,
                }}
              >
                <Text style={{
                  fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
                  color: colors.inverse, textTransform: "uppercase",
                }}>
                  Add first item
                </Text>
              </Pressable>
            </View>
          ) : (
            docs.map((d) => {
              const revealed = revealedId === d.id;
              const meta = KIND_META[d.kind];
              return (
                <View
                  key={d.id}
                  style={{
                    padding: spacing.lg,
                    backgroundColor: colors.card,
                    borderRadius: radius.lg,
                    borderWidth: 1, borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: radius.md,
                      backgroundColor: colors.background,
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <Feather name={meta.icon} size={16} color={colors.foreground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 2, color: colors.textTertiary, textTransform: "uppercase" }}>
                        {meta.label}
                      </Text>
                      <Text style={{ marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
                        {d.label}
                      </Text>
                    </View>
                    <Pressable onPress={() => remove(d.id)} hitSlop={8}>
                      <Feather name="trash-2" size={14} color={colors.textTertiary} />
                    </Pressable>
                  </View>

                  {d.detail ? (
                    <Text style={{
                      marginTop: spacing.sm,
                      fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary,
                    }}>
                      {d.detail}
                    </Text>
                  ) : null}

                  <View style={{
                    marginTop: spacing.md, padding: spacing.md,
                    backgroundColor: colors.background, borderRadius: radius.md,
                    flexDirection: "row", alignItems: "center", gap: spacing.sm,
                  }}>
                    <Text style={{
                      flex: 1,
                      fontFamily: revealed ? fonts.bodyMedium : fonts.body,
                      fontSize: revealed ? 14 : 13,
                      letterSpacing: revealed ? 2 : 4,
                      color: colors.foreground,
                    }}>
                      {revealed ? d.secret : "•".repeat(Math.min(d.secret.length, 16))}
                    </Text>
                    <Pressable
                      onPress={() => setRevealedId(revealed ? null : d.id)}
                      hitSlop={8}
                    >
                      <Feather name={revealed ? "eye-off" : "eye"} size={14} color={colors.foreground} />
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <AddDocModal
        visible={adding}
        onCancel={() => setAdding(false)}
        onSave={add}
      />
    </View>
  );
}

function AddDocModal({
  visible, onCancel, onSave,
}: {
  visible: boolean;
  onCancel: () => void;
  onSave: (doc: Omit<VaultDoc, "id" | "createdAt">) => void;
}) {
  const [kind, setKind] = useState<DocKind>("passport");
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    if (visible) { setKind("passport"); setLabel(""); setDetail(""); setSecret(""); }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View style={{
          flexDirection: "row", justifyContent: "space-between", alignItems: "center",
          padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <Pressable onPress={onCancel}>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.foreground }}>Add to vault</Text>
          <Pressable
            disabled={!label.trim() || !secret.trim()}
            onPress={() => onSave({ kind, label: label.trim(), detail: detail.trim(), secret: secret.trim() })}
          >
            <Text style={{
              fontFamily: fonts.bodyMedium, fontSize: 12,
              color: !label.trim() || !secret.trim() ? colors.textTertiary : colors.foreground,
            }}>
              Save
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <Label>Type</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {(Object.keys(KIND_META) as DocKind[]).map((k) => {
              const on = kind === k;
              const meta = KIND_META[k];
              return (
                <Pressable
                  key={k}
                  onPress={() => setKind(k)}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 6,
                    paddingHorizontal: 12, paddingVertical: 8,
                    borderRadius: radius.pill, borderWidth: 1,
                    borderColor: on ? colors.borderFocus : colors.border,
                    backgroundColor: on ? "rgba(60,60,60,0.08)" : "transparent",
                  }}
                >
                  <Feather name={meta.icon} size={12} color={on ? colors.foreground : colors.textTertiary} />
                  <Text style={{
                    fontFamily: fonts.bodyMedium, fontSize: 11,
                    color: on ? colors.foreground : colors.textTertiary,
                  }}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: spacing.xl }} />
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Label · e.g. UK Passport"
            placeholderTextColor={colors.textFaint}
            style={inputStyle}
          />

          <View style={{ height: spacing.lg }} />
          <TextInput
            value={detail}
            onChangeText={setDetail}
            placeholder="Detail (optional) · e.g. expires Mar 2031"
            placeholderTextColor={colors.textFaint}
            style={inputStyle}
          />

          <View style={{ height: spacing.lg }} />
          <TextInput
            value={secret}
            onChangeText={setSecret}
            placeholder="Secret value · number, code, key"
            placeholderTextColor={colors.textFaint}
            secureTextEntry
            style={inputStyle}
          />
          <Text style={{
            marginTop: spacing.sm, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textTertiary,
          }}>
            Stored in the device's secure enclave. Not synced to the cloud.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{
      fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
      color: colors.textTertiary, textTransform: "uppercase",
      marginBottom: spacing.sm,
    }}>
      {children}
    </Text>
  );
}

const inputStyle = {
  backgroundColor: colors.card,
  borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
  paddingHorizontal: spacing.lg, paddingVertical: 14,
  fontFamily: fonts.body, fontSize: 14, color: colors.foreground,
} as const;
