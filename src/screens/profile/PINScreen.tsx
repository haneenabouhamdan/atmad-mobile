import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { ScreenHeader } from "../../components/ScreenHeader";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

const PIN_KEY            = "atmad.pin.v1";
const BIOMETRIC_KEY      = "atmad.biometric.enabled.v1";
const PIN_LENGTH         = 6;

type Mode = "lockedOut" | "needsPin" | "hasPin";

/**
 * Hashes the PIN with a per-install salt before storage. We never persist
 * the plaintext PIN; verification re-hashes the candidate and compares.
 * Backed by expo-crypto so it works on Hermes / iOS / Android uniformly.
 */
async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}|${pin}`,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
}

async function getOrCreateSalt(): Promise<string> {
  const KEY = "atmad.pin.salt.v1";
  let salt = await SecureStore.getItemAsync(KEY);
  if (!salt) {
    const bytes = await Crypto.getRandomBytesAsync(16);
    salt = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    await SecureStore.setItemAsync(KEY, salt);
  }
  return salt;
}

export function PINScreen() {
  const [mode, setMode] = useState<Mode>("lockedOut");
  const [biometricSupport, setBiometricSupport] = useState({ supported: false, enrolled: false, kind: "" });
  const [biometricOn, setBiometricOn] = useState(false);

  useEffect(() => {
    (async () => {
      const has = await SecureStore.getItemAsync(PIN_KEY);
      setMode(has ? "hasPin" : "needsPin");

      const supported = await LocalAuthentication.hasHardwareAsync();
      const enrolled  = await LocalAuthentication.isEnrolledAsync();
      const types     = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const kind = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
        ? "Face ID"
        : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ? "Touch ID"
        : "Biometrics";

      setBiometricSupport({ supported, enrolled, kind });

      // Biometric is on by default for every ATMAD member as long as
      // the device has the hardware enrolled. We only treat the flag
      // as "off" if the user has explicitly opted out (flag === "0").
      const flag = await SecureStore.getItemAsync(BIOMETRIC_KEY);
      const enabled = flag !== "0" && supported && enrolled;
      setBiometricOn(enabled);
      if (enabled && flag !== "1") {
        // Persist the implicit default so the splash screen and other
        // call sites see a stable "1".
        await SecureStore.setItemAsync(BIOMETRIC_KEY, "1");
      }
    })();
  }, []);

  async function setPin(pin: string) {
    const salt = await getOrCreateSalt();
    const digest = await hashPin(pin, salt);
    await SecureStore.setItemAsync(PIN_KEY, digest);
    setMode("hasPin");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert("PIN saved", "Your PIN is set. We'll ask for it on launch.");
  }

  async function changePin(current: string, next: string) {
    const salt = await getOrCreateSalt();
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    const candidate = await hashPin(current, salt);
    if (candidate !== stored) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Wrong PIN", "The current PIN doesn't match.");
      return;
    }
    const digest = await hashPin(next, salt);
    await SecureStore.setItemAsync(PIN_KEY, digest);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert("PIN changed", "Your new PIN is in effect.");
  }

  async function removePin() {
    Alert.alert(
      "Remove PIN?",
      "Anyone with the device will be able to open ATMAD without confirmation.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync(PIN_KEY);
            await SecureStore.setItemAsync(BIOMETRIC_KEY, "0");
            setBiometricOn(false);
            setMode("needsPin");
          },
        },
      ],
    );
  }

  async function toggleBiometric(value: boolean) {
    if (value) {
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricSupport.kind} for ATMAD`,
        fallbackLabel: "Use PIN",
        disableDeviceFallback: false,
      });
      if (!r.success) return;
    }
    setBiometricOn(value);
    await SecureStore.setItemAsync(BIOMETRIC_KEY, value ? "1" : "0");
    Haptics.selectionAsync().catch(() => {});
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="PIN & Biometrics" eyebrow="Profile" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
              Lock screen
            </Text>
            <Text style={{ marginTop: 4, fontFamily: fonts.heading, fontSize: 24, color: colors.foreground }}>
              Keep ATMAD private
            </Text>
            <Text style={{ marginTop: spacing.xs, fontFamily: fonts.bodyLight, fontSize: 12, color: colors.textSecondary }}>
              A 6-digit PIN locks redemption, identity vault, and points history.
            </Text>
          </View>

          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
            <PinPanel
              mode={mode}
              onSetPin={setPin}
              onChangePin={changePin}
              onRemove={removePin}
            />
          </View>

          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xxl }}>
            <Text style={{
              fontFamily: fonts.body, fontSize: 9, letterSpacing: 3,
              color: colors.textTertiary, textTransform: "uppercase", marginBottom: spacing.sm,
            }}>
              Biometrics
            </Text>
            <View style={{
              padding: spacing.lg,
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              borderWidth: 1, borderColor: colors.border,
              flexDirection: "row", alignItems: "center", gap: spacing.md,
            }}>
              <View style={{
                width: 36, height: 36, borderRadius: radius.md,
                backgroundColor: colors.background,
                alignItems: "center", justifyContent: "center",
              }}>
                <Feather name="user-check" size={16} color={colors.foreground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.foreground }}>
                  {biometricSupport.kind || "Biometrics"}
                </Text>
                <Text style={{ marginTop: 1, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
                  {!biometricSupport.supported
                    ? "Not supported on this device"
                    : !biometricSupport.enrolled
                    ? "Enrol in Settings, then return"
                    : "Required to unlock ATMAD on this device"}
                </Text>
              </View>
              <Switch
                value={biometricOn}
                disabled={!biometricSupport.supported || !biometricSupport.enrolled}
                onValueChange={toggleBiometric}
                trackColor={{ true: colors.foreground, false: "rgba(60,60,60,0.18)" }}
                thumbColor={colors.background}
                ios_backgroundColor="rgba(60,60,60,0.18)"
              />
            </View>
          </View>

          <View style={{
            margin: spacing.xl, padding: spacing.md,
            flexDirection: "row", gap: 8,
            backgroundColor: "rgba(60,60,60,0.06)", borderRadius: radius.md,
          }}>
            <Feather name="info" size={12} color={colors.textSecondary} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, fontFamily: fonts.bodyLight, fontSize: 11, color: colors.textSecondary }}>
              The PIN is never sent to ATMAD's servers — we only store a salted hash inside the device's secure enclave.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function PinPanel({
  mode, onSetPin, onChangePin, onRemove,
}: {
  mode: Mode;
  onSetPin: (pin: string) => Promise<void>;
  onChangePin: (current: string, next: string) => Promise<void>;
  onRemove: () => void;
}) {
  const [step, setStep] = useState<"enter" | "verify" | "current" | "next" | "confirm">("enter");
  const [first, setFirst]     = useState("");
  const [current, setCurrent] = useState("");
  const [pin, setPin]         = useState("");

  function reset() {
    setFirst(""); setCurrent(""); setPin("");
    setStep(mode === "hasPin" ? "current" : "enter");
  }

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mode]);

  if (mode === "hasPin") {
    if (step === "current") {
      return (
        <Pad
          title="Change PIN"
          subtitle="Enter your current PIN"
          value={pin}
          onChange={(v) => {
            setPin(v);
            if (v.length === PIN_LENGTH) {
              setCurrent(v); setPin(""); setStep("next");
            }
          }}
          actionLabel="Remove PIN"
          onAction={onRemove}
        />
      );
    }
    if (step === "next") {
      return (
        <Pad
          title="New PIN"
          subtitle="Choose 6 digits"
          value={pin}
          onChange={(v) => {
            setPin(v);
            if (v.length === PIN_LENGTH) { setFirst(v); setPin(""); setStep("confirm"); }
          }}
        />
      );
    }
    return (
      <Pad
        title="Confirm"
        subtitle="Re-enter your new PIN"
        value={pin}
        onChange={(v) => {
          setPin(v);
          if (v.length === PIN_LENGTH) {
            if (v === first) {
              onChangePin(current, v).then(reset);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
              Alert.alert("Doesn't match", "Try again.");
              setPin(""); setFirst(""); setStep("next");
            }
          }
        }}
      />
    );
  }

  // No PIN yet: enter -> verify
  if (step === "enter") {
    return (
      <Pad
        title="Set PIN"
        subtitle="Choose 6 digits"
        value={pin}
        onChange={(v) => {
          setPin(v);
          if (v.length === PIN_LENGTH) { setFirst(v); setPin(""); setStep("verify"); }
        }}
      />
    );
  }
  return (
    <Pad
      title="Confirm"
      subtitle="Re-enter your PIN"
      value={pin}
      onChange={(v) => {
        setPin(v);
        if (v.length === PIN_LENGTH) {
          if (v === first) {
            onSetPin(v).then(() => { setFirst(""); setPin(""); });
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
            Alert.alert("Doesn't match", "Try again.");
            setPin(""); setFirst(""); setStep("enter");
          }
        }
      }}
    />
  );
}

function Pad({
  title, subtitle, value, onChange, actionLabel, onAction,
}: {
  title: string;
  subtitle: string;
  value: string;
  onChange: (v: string) => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  function press(d: string) {
    if (value.length >= PIN_LENGTH) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(value + d);
  }
  function back() {
    if (value.length === 0) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(value.slice(0, -1));
  }

  return (
    <View style={{
      padding: spacing.lg,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1, borderColor: colors.border,
    }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 9, letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase" }}>
        {title}
      </Text>
      <Text style={{ marginTop: 2, fontFamily: fonts.heading, fontSize: 18, color: colors.foreground }}>
        {subtitle}
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginVertical: spacing.lg }}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 14, height: 14, borderRadius: 999,
              backgroundColor: i < value.length ? colors.foreground : "transparent",
              borderWidth: 1,
              borderColor: i < value.length ? colors.foreground : colors.border,
            }}
          />
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" }}>
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <PadKey key={d} label={d} onPress={() => press(d)} />
        ))}
        {actionLabel ? (
          <PadKey label={actionLabel} onPress={onAction} small />
        ) : (
          <View style={{ width: 72 }} />
        )}
        <PadKey label="0" onPress={() => press("0")} />
        <PadKey label="⌫" onPress={back} />
      </View>
    </View>
  );
}

function PadKey({
  label, onPress, small,
}: {
  label: string;
  onPress?: () => void;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 72, height: 56,
        borderRadius: radius.md,
        alignItems: "center", justifyContent: "center",
        backgroundColor: pressed ? "rgba(60,60,60,0.08)" : "transparent",
      })}
    >
      <Text style={{
        fontFamily: small ? fonts.body : fonts.heading,
        fontSize: small ? 9 : 22,
        letterSpacing: small ? 2 : 0,
        color: small ? colors.destructiveSoft : colors.foreground,
        textTransform: small ? "uppercase" : "none",
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
