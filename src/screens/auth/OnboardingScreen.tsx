import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  Text, TextInput, View,
} from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import { updateProfile } from "../../auth/authActions";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const INTERESTS = ["Fashion","Luxury","Tech","Travel","Automotive","Finance","F&B"];

const ROLES = [
  { id: "consumer",   label: "Reader",        sub: "Discover editorial content, deals & lifestyle." },
  { id: "influencer", label: "Creator",        sub: "Access campaigns, coupon codes & revenue tools." },
  { id: "affiliate",  label: "Affiliate",      sub: "Track links, conversions & commission payouts." },
  { id: "advertiser", label: "Brand Partner",  sub: "Launch campaigns, assign codes & view analytics." },
] as const;

type Step = "form" | "interests" | "role" | "saving";

export function OnboardingScreen() {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [role, setRole] = useState<typeof ROLES[number]["id"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(i: string) {
    setSelected((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }

  async function finish() {
    setError(null);
    if (!role) return;
    setStep("saving");
    const r = await updateProfile({
      fullName: name.trim(),
      interests: selected,
      userRole: role,
    });
    if (!r.success) {
      setError(r.error ?? "Could not save");
      setStep("role");
      return;
    }
    await refreshProfile();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.xxxl }}>
        <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
          <Text style={{
            fontFamily: fonts.heading, fontSize: 28, color: colors.foreground,
            letterSpacing: 8,
          }}>
            ATMAD
          </Text>
        </View>

        {step === "form" && (
          <View>
            <Text style={{
              fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
              color: colors.textTertiary, textTransform: "uppercase",
              marginBottom: spacing.sm,
            }}>
              Full Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textFaint}
              style={{
                backgroundColor: colors.card,
                borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
                paddingHorizontal: spacing.lg, paddingVertical: 14,
                fontFamily: fonts.body, fontSize: 14, color: colors.foreground,
              }}
            />
            <Pressable
              disabled={!name.trim()}
              onPress={() => setStep("interests")}
              style={{
                marginTop: spacing.xl, paddingVertical: 16,
                borderRadius: radius.md, borderWidth: 1,
                borderColor: name.trim() ? colors.borderFocus : colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{
                fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
                color: name.trim() ? colors.foreground : colors.textTertiary,
                textTransform: "uppercase",
              }}>
                Continue
              </Text>
            </Pressable>
          </View>
        )}

        {step === "interests" && (
          <View>
            <Text style={{
              fontFamily: fonts.heading, fontSize: 20, color: colors.foreground,
              textAlign: "center", marginBottom: 4,
            }}>
              Curate Your World
            </Text>
            <Text style={{
              fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textTertiary,
              textAlign: "center", marginBottom: spacing.xl,
            }}>
              Select your editorial interests.
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" }}>
              {INTERESTS.map((i) => {
                const on = selected.includes(i);
                return (
                  <Pressable
                    key={i}
                    onPress={() => toggleInterest(i)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10,
                      borderRadius: radius.pill, borderWidth: 1,
                      borderColor: on ? colors.borderFocus : colors.border,
                      backgroundColor: on ? "rgba(60,60,60,0.1)" : "transparent",
                    }}
                  >
                    <Text style={{
                      fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1,
                      color: on ? colors.foreground : colors.textTertiary,
                      textTransform: "uppercase",
                    }}>
                      {i}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              disabled={selected.length === 0}
              onPress={() => setStep("role")}
              style={{
                marginTop: spacing.xl, paddingVertical: 16,
                borderRadius: radius.md, borderWidth: 1,
                borderColor: selected.length ? colors.borderFocus : colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{
                fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
                color: selected.length ? colors.foreground : colors.textTertiary,
                textTransform: "uppercase",
              }}>
                Next
              </Text>
            </Pressable>
          </View>
        )}

        {step === "role" && (
          <View>
            <Text style={{
              fontFamily: fonts.heading, fontSize: 20, color: colors.foreground,
              textAlign: "center", marginBottom: spacing.xl,
            }}>
              I am joining as…
            </Text>
            {ROLES.map((r) => {
              const on = role === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setRole(r.id)}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: spacing.lg,
                    padding: spacing.lg, marginBottom: spacing.md,
                    backgroundColor: colors.card,
                    borderWidth: 1, borderColor: on ? colors.borderFocus : colors.border,
                    borderRadius: radius.lg,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
                      {r.label}
                    </Text>
                    <Text style={{ marginTop: 2, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textTertiary }}>
                      {r.sub}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            {error && (
              <Text style={{
                fontFamily: fonts.body, fontSize: 11, color: colors.destructiveSoft,
                textAlign: "center", marginTop: spacing.sm,
              }}>
                {error}
              </Text>
            )}
            <Pressable
              disabled={!role}
              onPress={finish}
              style={{
                marginTop: spacing.lg, paddingVertical: 16,
                borderRadius: radius.md,
                backgroundColor: role ? colors.foreground : "rgba(10,10,10,0.06)",
                alignItems: "center",
              }}
            >
              <Text style={{
                fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
                color: role ? colors.inverse : colors.textTertiary,
                textTransform: "uppercase",
              }}>
                Enter ATMAD
              </Text>
            </Pressable>
          </View>
        )}

        {step === "saving" && (
          <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
            <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.foreground }}>
              Welcome, {name.split(" ")[0] || "Reader"}.
            </Text>
            <Text style={{
              marginTop: spacing.sm, fontFamily: fonts.body, fontSize: 11,
              color: colors.textTertiary,
            }}>
              Your issue is being prepared.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
