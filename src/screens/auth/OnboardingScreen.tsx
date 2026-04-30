import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  type TextStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { CountryCodePicker } from "../../components/CountryCodePicker";
import { useAuth, type UserRole } from "../../auth/AuthProvider";
import {
  mandatoryOnboardingMissingHint,
  needsMandatoryOnboarding,
} from "../../auth/onboardingGate";
import { fullNameFromProfile } from "../../auth/displayName";
import { sendPhoneOtp, updateProfile, verifyPhoneOtp, otpSendFailureAdvice, type OtpChannel } from "../../auth/authActions";
import { PENDING_COUNTRY_ISO_KEY } from "./PhoneEntryScreen";
import { DEFAULT_COUNTRY, findCountryByCode, type Country } from "../../data/countries";
import { isBiometricSupported } from "../../auth/biometrics";
import { APP_LOCALES } from "../../regional/RegionalPreferencesContext";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { trackJourney } from "../../analytics/journeyContracts";
import { supabase } from "../../lib/supabase";
import {
  clampNationalDigits,
  nationalDigitsRangePhrase,
  nationalNumberLengthBounds,
  validateNationalPhoneDigits,
} from "../../validation/phoneNationalDigits";

const INTERESTS = [
  "Fashion", "Luxury", "Tech", "Travel",
  "Automotive", "Finance", "F&B",
];

/** Sign-up personas → `profiles.user_role` (creator = former “publisher” — one role). */
const ROLE_CHOICE: {
  role: Extract<UserRole, "member" | "advertiser" | "content_creator">;
  title: string;
  sub: string;
}[] = [
  {
    role: "member",
    title: "Consumer",
    sub: "Discover deals, redeem rewards, browse the magazine.",
  },
  {
    role: "advertiser",
    title: "Advertiser",
    sub: "Run brand campaigns and reach qualified luxury shoppers.",
  },
  {
    role: "content_creator",
    title: "Creator & publisher",
    sub: "Publish offers, run campaigns, earn on conversions.",
  },
];

type StepId = "role" | "country" | "language" | "interests";

const ALL_ONBOARD_STEPS: StepId[] = ["role", "country", "language", "interests"];

function nextIncludedStep(current: StepId, flow: StepId[]): StepId | null {
  const i = ALL_ONBOARD_STEPS.indexOf(current);
  if (i < 0) return flow[0] ?? null;
  for (let j = i + 1; j < ALL_ONBOARD_STEPS.length; j++) {
    const cand = ALL_ONBOARD_STEPS[j];
    if (flow.includes(cand)) return cand;
  }
  return null;
}

function prevIncludedStep(current: StepId, flow: StepId[]): StepId | null {
  const i = ALL_ONBOARD_STEPS.indexOf(current);
  if (i < 0) return flow[0] ?? null;
  for (let j = i - 1; j >= 0; j--) {
    const cand = ALL_ONBOARD_STEPS[j];
    if (flow.includes(cand)) return cand;
  }
  return null;
}

function pastRoleStorageKey(userId: string) {
  return `atmad.onboarding.past_role.${userId}`;
}

const STEP_META: Record<StepId, { title: string; subtitle: string }> = {
  role: {
    title: "How will you use ATMAD?",
    subtitle: "You can revisit this choice later from your profile.",
  },
  country: {
    title: "Choose country",
    subtitle:
      "Market country sets deals and preferences. Below, choose the dial for the mobile number you're verifying—it can differ from your market selection. Skip verification if you prefer.",
  },
  language: {
    title: "Preferred language",
    subtitle: "App copy and newsletters follow this preference.",
  },
  interests: {
    title: "Curate your world",
    subtitle: "Select editorial interests—we’ll tune your discovery feed.",
  },
};

const BIOMETRIC_KEY = "atmad.biometric.enabled.v1";

const PHONE_OTP_LEN = 6;

export function OnboardingScreen() {
  const { refreshProfile, user, profile, signOut } = useAuth();
  const [cursor, setCursor] = useState<StepId>("role");
  const [pastRoleHydrated, setPastRoleHydrated] = useState(false);
  const [storedPastRole, setStoredPastRole] = useState(false);
  const [rolePick, setRolePick] =
    useState<Extract<UserRole, "member" | "advertiser" | "content_creator">>("member");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  /** OTP dial/country (`phoneDialCountry`) may differ from profile market (`country`). */
  const [phoneDialCountry, setPhoneDialCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [locale, setLocale] = useState<string>("en");
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<"steps" | "saving">("steps");
  const [error, setError] = useState<string | null>(null);

  /** Country step — optional phone verify (same flow as profile phone entry). */
  const [phoneLocal, setPhoneLocal] = useState("");
  const [phoneChannel, setPhoneChannel] = useState<OtpChannel>("sms");
  const [phoneOtpPhase, setPhoneOtpPhase] = useState<"idle" | "code_sent" | "verified">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [otpResendSec, setOtpResendSec] = useState(45);
  const otpInputRef = useRef<TextInput>(null);
  const phoneDigitsRef = useRef<TextInput>(null);

  /** Omit the role step when the member already chose a persona (stored) or server has a non-default role. */
  const roleSavedInProfile =
    profile?.user_role === "advertiser" || profile?.user_role === "content_creator";

  const omitRoleStep = roleSavedInProfile || (pastRoleHydrated && storedPastRole);

  const steps = useMemo<StepId[]>(() => {
    const s = [...ALL_ONBOARD_STEPS];
    if (omitRoleStep) return s.filter((x) => x !== "role");
    return s;
  }, [omitRoleStep]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid = user?.id;
      if (!uid) {
        if (!cancelled) {
          setStoredPastRole(false);
          setPastRoleHydrated(true);
        }
        return;
      }
      try {
        const v = await SecureStore.getItemAsync(pastRoleStorageKey(uid));
        if (!cancelled) setStoredPastRole(v === "1");
      } catch {
        if (!cancelled) setStoredPastRole(false);
      } finally {
        if (!cancelled) setPastRoleHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    const r = profile?.user_role;
    if (r === "advertiser" || r === "content_creator") setRolePick(r);
  }, [profile?.user_role]);

  useLayoutEffect(() => {
    if (!pastRoleHydrated) return;
    if (!steps.length) return;
    if (steps.includes(cursor)) return;
    const start = ALL_ONBOARD_STEPS.indexOf(cursor);
    for (let j = Math.max(0, start); j < ALL_ONBOARD_STEPS.length; j++) {
      const cand = ALL_ONBOARD_STEPS[j];
      if (steps.includes(cand)) {
        setCursor(cand);
        return;
      }
    }
    const first = steps[0];
    if (first) setCursor(first);
  }, [pastRoleHydrated, steps, cursor]);

  /** Display name for save + welcome — `profiles.full_name` only. */
  const resolvedFullName = useMemo(
    () => fullNameFromProfile(profile),
    [profile?.full_name],
  );

  const phoneNationalBounds = useMemo(
    () => nationalNumberLengthBounds(phoneDialCountry.code),
    [phoneDialCountry.code],
  );

  /** Truncate when switching dial ISO so pasted numbers don't stay over-long. */
  useEffect(() => {
    const { max } = nationalNumberLengthBounds(phoneDialCountry.code);
    setPhoneLocal((prev) => clampNationalDigits(prev, max));
  }, [phoneDialCountry.code]);

  const nationalLenWarn = useMemo(
    () => validateNationalPhoneDigits(phoneDialCountry.code, phoneLocal),
    [phoneDialCountry.code, phoneLocal],
  );

  const phoneDigitsTooLong =
    phoneLocal.replace(/\D/g, "").length > phoneNationalBounds.max;
  /** Red border mainly for API / send errors; length overrun or server error only. */
  const phoneHardInvalid = !!phoneError || phoneDigitsTooLong;

  const phoneErrAdvice = useMemo(
    () => (phoneError ? otpSendFailureAdvice(phoneError) : null),
    [phoneError],
  );
  const otpSendErrAdvice = useMemo(
    () => (otpError ? otpSendFailureAdvice(otpError) : null),
    [otpError],
  );

  const phoneE164Onboarding = useMemo(() => {
    const digits = phoneLocal.replace(/\D/g, "");
    if (!digits.length) return null;
    if (validateNationalPhoneDigits(phoneDialCountry.code, digits)) return null;
    return `${phoneDialCountry.dial.replace(/\s/g, "")}${digits}`;
  }, [phoneDialCountry, phoneLocal]);

  const resetCountryPhoneFlow = () => {
    setPhoneLocal("");
    setPhoneChannel("sms");
    setPhoneOtpPhase("idle");
    setOtpCode("");
    setPhoneError(null);
    setOtpError(null);
    setSendBusy(false);
    setVerifyBusy(false);
    setOtpResendSec(45);
    setPhoneDialCountry(country);
  };

  const stepIndex = Math.max(0, steps.indexOf(cursor));
  const stepId = cursor;
  const stepLabel = useMemo(
    () => `${stepIndex + 1} / ${steps.length}`,
    [stepIndex, steps.length],
  );
  const meta = STEP_META[stepId];
  const canGoBack = prevIncludedStep(stepId, steps) !== null;

  useEffect(() => {
    trackJourney("onboarding_step", { step: stepId });
  }, [stepId]);

  useEffect(() => {
    if (stepId !== "country") return;
    if (phoneOtpPhase !== "code_sent") return;
    otpInputRef.current?.focus();
    setOtpResendSec(45);
    const t = setInterval(() => setOtpResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [stepId, phoneOtpPhase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(PENDING_COUNTRY_ISO_KEY);
        if (cancelled || !raw) return;
        const c = findCountryByCode(raw);
        if (c) {
          setCountry(c);
          setPhoneDialCountry(c);
        }
      } catch {
        //
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onboardingSendPhoneCode() {
    setPhoneError(null);
    const lenErr = validateNationalPhoneDigits(phoneDialCountry.code, phoneLocal);
    if (lenErr) {
      setPhoneError(lenErr);
      return;
    }
    if (!phoneE164Onboarding) {
      setPhoneError("Enter a valid phone number");
      return;
    }
    setSendBusy(true);
    try {
      try {
        await SecureStore.setItemAsync(PENDING_COUNTRY_ISO_KEY, country.code);
      } catch {
        //
      }
      const r = await sendPhoneOtp(phoneE164Onboarding, phoneChannel);
      if (!r.success) {
        setPhoneError(r.error ?? "Could not send code");
        return;
      }
      setPhoneOtpPhase("code_sent");
      setOtpCode("");
      setOtpError(null);
      trackJourney("onboarding_country_otp_sent", { channel: phoneChannel });
    } finally {
      setSendBusy(false);
    }
  }

  async function onboardingVerifyPhoneCode() {
    setOtpError(null);
    if (!phoneE164Onboarding) return;
    const clean = otpCode.replace(/\D/g, "");
    if (clean.length !== PHONE_OTP_LEN) {
      setOtpError(`Enter the ${PHONE_OTP_LEN}-digit code`);
      return;
    }
    setVerifyBusy(true);
    try {
      const r = await verifyPhoneOtp(phoneE164Onboarding, otpCode);
      if (!r.success) {
        setOtpError(r.error ?? "Verification failed");
        return;
      }
      await refreshProfile();
      setPhoneOtpPhase("verified");
      trackJourney("onboarding_country_phone_verified");
    } finally {
      setVerifyBusy(false);
    }
  }

  function onboardingResendOtp() {
    if (otpResendSec > 0 || !phoneE164Onboarding) return;
    void (async () => {
      setOtpResendSec(45);
      setOtpError(null);
      const r = await sendPhoneOtp(phoneE164Onboarding, phoneChannel);
      if (!r.success) setOtpError(r.error ?? "Could not resend code");
    })();
  }

  /** WhatsApp depends on backend / Twilio; offer SMS fallback without leaving this step. */
  async function onboardingSwitchToSmsResend() {
    if (!phoneE164Onboarding) return;
    setPhoneError(null);
    setOtpError(null);
    setPhoneChannel("sms");
    setOtpResendSec(45);
    const r = await sendPhoneOtp(phoneE164Onboarding, "sms");
    if (!r.success) {
      setOtpError(r.error ?? "Could not send SMS code");
    }
  }

  /** Profile / market ISO — changing market also sets the phone dial to match; user can change dial below. */
  function onMarketCountrySelect(c: Country) {
    setCountry(c);
    setPhoneDialCountry(c);
  }

  /** WhatsApp/SMS OTP uses `phoneDialCountry.dial`; may differ from market country. */
  function onPhoneDialCountrySelect(c: Country) {
    setPhoneDialCountry(c);
    if (phoneOtpPhase === "code_sent") {
      setPhoneOtpPhase("idle");
      setOtpCode("");
      setOtpError(null);
    }
  }

  function goBack() {
    setError(null);
    if (stepId === "country") resetCountryPhoneFlow();
    const prev = prevIncludedStep(stepId, steps);
    if (!prev) return;
    setCursor(prev);
  }

  async function persistPastRoleAdvance() {
    const uid = user?.id;
    if (!uid) return;
    try {
      await SecureStore.setItemAsync(pastRoleStorageKey(uid), "1");
    } catch {
      //
    }
  }

  function advance() {
    setError(null);

    if (stepId === "interests") {
      if (selected.length === 0) {
        setError("Select at least one interest.");
        return;
      }
      void finish();
      return;
    }

    if (stepId === "country") resetCountryPhoneFlow();
    if (stepId === "role") void persistPastRoleAdvance();

    const next = nextIncludedStep(stepId, steps);
    if (next) setCursor(next);
  }

  function skipCountryPhoneAndContinue() {
    trackJourney("onboarding_country_phone_skip");
    advance();
  }

  async function finish() {
    setError(null);
    if (!resolvedFullName.trim()) {
      setError(
        "We couldn’t read profiles.full_name yet — open Profile to set your name, then try again.",
      );
      setPhase("steps");
      return;
    }
    setPhase("saving");

    const countryIso = country.code;
    try {
      await SecureStore.deleteItemAsync(PENDING_COUNTRY_ISO_KEY);
    } catch {
      //
    }

    const r = await updateProfile({
      fullName: resolvedFullName,
      interests: selected,
      userRole: rolePick,
      countryIso,
      locale,
    });
    if (!r.success) {
      const msg = r.error ?? "Could not save";
      const staleSession =
        /\bnot signed in\b/i.test(msg) ||
        msg.toLowerCase().includes("not signed");
      if (staleSession) {
        await signOut();
        setPhase("steps");
        return;
      }
      setError(msg);
      setPhase("steps");
      return;
    }

    try {
      const { supported, enrolled } = await isBiometricSupported();
      if (supported && enrolled) {
        await SecureStore.setItemAsync(BIOMETRIC_KEY, "1");
      }
    } catch {
      //
    }

    const refreshed = await refreshProfile();
    if (!refreshed) {
      let detail = "";
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id;
        if (uid) {
          const { error } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", uid)
            .maybeSingle();
          if (error) detail = ` ${error.message}`;
        }
      } catch {
        //
      }
      setError(
        detail
          ? `Couldn’t sync profile: ${detail.trim()}`
          : "Couldn’t sync your profile. Check your connection and try again.",
      );
      setPhase("steps");
      return;
    }
    if (needsMandatoryOnboarding(refreshed)) {
      setError(
        mandatoryOnboardingMissingHint(refreshed)
          ?? "Something is still incomplete — review the onboarding steps.",
      );
      setPhase("steps");
      return;
    }

    trackJourney("onboarding_complete", {
      countryIso,
      locale,
      role: rolePick,
    });
  }

  function toggleInterest(i: string) {
    setSelected((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }

  const interestMuted = stepId === "interests" && selected.length === 0;

  if (!pastRoleHydrated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.foreground} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "saving") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ alignItems: "center", justifyContent: "center", flex: 1, padding: spacing.xl }}>
          <ActivityIndicator color={colors.foreground} size="large" />
          <Text style={{
            marginTop: spacing.xl,
            fontFamily: fonts.heading,
            fontSize: 18,
            color: colors.foreground,
            textAlign: "center",
          }}>
            Welcome, {(resolvedFullName.split(/\s+/).filter(Boolean)[0]) || "member"}.
          </Text>
          <Text style={{
            marginTop: spacing.sm,
            fontFamily: fonts.body,
            fontSize: 11,
            color: colors.textTertiary,
            textAlign: "center",
          }}>
            Finishing setup and opening ATMAD…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
          minHeight: 44,
        }}>
          <Pressable
            onPress={goBack}
            disabled={!canGoBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => ({
              padding: spacing.sm,
              marginLeft: -spacing.sm,
              opacity: !canGoBack ? 0 : pressed ? 0.55 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={26} color={!canGoBack ? colors.textFaint : colors.foreground} />
          </Pressable>
          <Text style={{
            flex: 1, textAlign: "center",
            fontFamily: fonts.bodySemi, fontSize: 10,
            letterSpacing: 2,
            color: colors.textSecondary, textTransform: "uppercase",
          }}>
            {stepLabel}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <StepperDots count={steps.length} activeIndex={stepIndex} />

        <ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{
            padding: spacing.xl,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xxxl,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
            <Text style={{
              fontFamily: fonts.body, fontSize: 10,
              letterSpacing: 3, color: colors.textTertiary, textTransform: "uppercase",
            }}>
              ATMAD onboarding
            </Text>
          </View>

          <Text style={{
            fontFamily: fonts.heading, fontSize: 22,
            color: colors.foreground,
            textAlign: "center",
            marginBottom: spacing.sm,
          }}>
            {meta.title}
          </Text>
          <Text style={{
            fontFamily: fonts.bodyLight,
            fontSize: 12,
            lineHeight: 18,
            color: colors.textTertiary,
            textAlign: "center",
            marginBottom: spacing.xl,
          }}>
            {meta.subtitle}
          </Text>

          {stepId === "role" ? (
            <View style={{ gap: spacing.md }}>
              {ROLE_CHOICE.map((opt, i) => {
                const chosen = rolePick === opt.role;
                return (
                  <Pressable
                    key={`${opt.role}-${i}`}
                    onPress={() => {
                      setRolePick(opt.role);
                      setError(null);
                    }}
                    style={{
                      padding: spacing.lg,
                      borderRadius: radius.lg,
                      borderWidth: 1,
                      borderColor: chosen ? colors.borderFocus : colors.border,
                      backgroundColor: chosen ? colors.card : "transparent",
                    }}
                  >
                    <Text style={{
                      fontFamily: fonts.bodyMedium,
                      fontSize: 14,
                      color: colors.foreground,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      marginBottom: 6,
                    }}>
                      {opt.title}
                    </Text>
                    <Text style={{
                      fontFamily: fonts.bodyLight,
                      fontSize: 12,
                      lineHeight: 18,
                      color: colors.textSecondary,
                    }}>
                      {opt.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {stepId === "country" ? (
            <View>
              {phoneOtpPhase === "verified" ? (
                <Text style={{
                  fontFamily: fonts.bodyMedium,
                  fontSize: 13,
                  color: colors.foreground,
                  textAlign: "center",
                  marginBottom: spacing.lg,
                }}>
                  Mobile number verified ✓
                </Text>
              ) : null}

              {phoneOtpPhase === "idle" ? (
                <View style={{ gap: spacing.xxl }}>
                  <View style={{ gap: spacing.sm }}>
                    <Text style={{
                      fontFamily: fonts.bodySemi,
                      fontSize: 11,
                      letterSpacing: 2,
                      color: colors.textSecondary,
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}>
                      Choose country
                    </Text>
                    <View style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "stretch",
                      paddingHorizontal: spacing.xs,
                    }}>
                      <CountryCodePicker
                        summary="market"
                        selected={country}
                        onSelect={onMarketCountrySelect}
                      />
                    </View>
                  </View>

                  <View style={{
                    width: "100%",
                    gap: spacing.md,
                    paddingTop: spacing.lg,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}>
                    <Text style={{
                      fontFamily: fonts.bodySemi,
                      fontSize: 11,
                      letterSpacing: 2,
                      color: colors.textSecondary,
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}>
                      Verify phone number
                    </Text>
                    <Text style={{
                      fontFamily: fonts.bodyLight,
                      fontSize: 10,
                      lineHeight: 15,
                      color: colors.textFaint,
                      textAlign: "center",
                      marginBottom: spacing.xs,
                    }}>
                      Separate from Choose country.{` `}
                      Typical length for {phoneDialCountry.dial.replace(/\s/g, "")}
                      {": "}
                      {`${nationalDigitsRangePhrase(phoneNationalBounds.min, phoneNationalBounds.max)} digits`}
                      .
                    </Text>
                    <View
                      collapsable={false}
                      style={{
                        width: "100%",
                        flexDirection: "row",
                        alignItems: "stretch",
                        gap: spacing.sm,
                      }}
                    >
                      <View style={{ flexShrink: 0 }}>
                        <CountryCodePicker
                          selected={phoneDialCountry}
                          onSelect={onPhoneDialCountrySelect}
                        />
                      </View>
                      <TextInput
                        ref={phoneDigitsRef}
                        value={phoneLocal}
                        onChangeText={(v) => {
                          setPhoneLocal(
                            clampNationalDigits(v, phoneNationalBounds.max),
                          );
                          if (phoneError) setPhoneError(null);
                        }}
                        placeholder={`${nationalDigitsRangePhrase(phoneNationalBounds.min, phoneNationalBounds.max)} digits`}
                        placeholderTextColor={colors.textFaint}
                        editable
                        keyboardType="phone-pad"
                        returnKeyType="done"
                        {...(Platform.OS === "ios" ? { textContentType: "telephoneNumber" as const } : {})}
                        {...(Platform.OS === "android"
                          ? { importantForAutofill: "noExcludeDescendants" as const }
                          : {})}
                        autoCapitalize="none"
                        autoCorrect={false}
                        {...(Platform.OS === "ios" ? { clearButtonMode: "while-editing" as const } : {})}
                        selectionColor={colors.foreground}
                        cursorColor={colors.foreground}
                        underlineColorAndroid="transparent"
                        {...(Platform.OS === "web"
                          ? { autoComplete: "off" as const, spellCheck: false as const }
                          : {})}
                        maxLength={phoneNationalBounds.max}
                        style={[
                          {
                            flex: 1,
                            minWidth: 0,
                            minHeight: 50,
                            zIndex: 2,
                            backgroundColor: colors.card,
                            borderRadius: radius.md,
                            borderWidth: 1,
                            borderColor: phoneHardInvalid
                              ? colors.destructive
                              : colors.border,
                            paddingHorizontal: spacing.md,
                            paddingVertical: 14,
                            fontFamily: fonts.body,
                            fontSize: 16,
                            color: colors.foreground,
                          },
                          Platform.OS === "web"
                            ? ({
                                outlineWidth: 0,
                                boxShadow: `0 0 0 1000px ${colors.card} inset`,
                              } satisfies TextStyle)
                            : null,
                        ]}
                      />
                    </View>
                    {(phoneError ?? nationalLenWarn) ? (
                      <View style={{
                        marginTop: spacing.sm,
                        alignSelf: "stretch",
                        gap: spacing.xs,
                      }}>
                        <Text style={{
                          fontFamily: fonts.body,
                          fontSize: 11,
                          color: phoneError ? colors.destructiveSoft : colors.textTertiary,
                          textAlign: "center",
                        }}>
                          {phoneError ?? nationalLenWarn}
                        </Text>
                        {phoneErrAdvice ? (
                          <Text style={{
                            fontFamily: fonts.bodyLight,
                            fontSize: 10,
                            lineHeight: 15,
                            color: colors.textTertiary,
                            textAlign: "center",
                          }}>
                            {phoneErrAdvice}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                    <View style={{
                      flexDirection: "row",
                      backgroundColor: colors.card,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 4,
                    }}>
                      <OnboardingChannelTab
                        active={phoneChannel === "sms"}
                        label="SMS"
                        icon="message-square"
                        onPress={() => setPhoneChannel("sms")}
                      />
                      <OnboardingChannelTab
                        active={phoneChannel === "whatsapp"}
                        label="WhatsApp"
                        icon="message-circle"
                        onPress={() => setPhoneChannel("whatsapp")}
                      />
                    </View>
                    <Pressable
                      onPress={() => void onboardingSendPhoneCode()}
                      disabled={sendBusy || !phoneE164Onboarding}
                      style={({ pressed }) => ({
                        paddingVertical: 14,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.borderFocus,
                        alignItems: "center",
                        opacity:
                          pressed || sendBusy || !phoneE164Onboarding ? 0.65 : 1,
                      })}
                    >
                      <Text style={{
                        fontFamily: fonts.bodyMedium,
                        fontSize: 11,
                        letterSpacing: 2,
                        color:
                          phoneE164Onboarding ? colors.foreground : colors.textTertiary,
                        textTransform: "uppercase",
                      }}>
                        {sendBusy ? "Sending…" : "Send verification code"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {phoneOtpPhase === "code_sent" ? (
                <View style={{ gap: spacing.lg }}>
                    <Text style={{
                      fontFamily: fonts.body, fontSize: 12,
                      color: colors.textTertiary, textAlign: "center",
                    }}>
                      Code sent via {phoneChannel === "whatsapp" ? "WhatsApp" : "SMS"} to {"\n"}
                      <Text style={{ color: colors.foreground }}>
                        {phoneE164Onboarding ?? ""}
                      </Text>
                    </Text>
                    {phoneChannel === "whatsapp" ? (
                      <Text style={{
                        fontFamily: fonts.bodyLight,
                        fontSize: 11,
                        lineHeight: 16,
                        color: colors.textFaint,
                        textAlign: "center",
                      }}>
                        No WhatsApp message? WhatsApp codes need extra setup—or tap below to get the code by SMS.
                      </Text>
                    ) : (
                      <Text style={{
                        fontFamily: fonts.bodyLight,
                        fontSize: 11,
                        lineHeight: 16,
                        color: colors.textFaint,
                        textAlign: "center",
                      }}>
                        SMS is delivered through our messaging provider—wait two minutes before resending; Twilio trial accounts only text verified destinations.
                      </Text>
                    )}
                    <View style={{ position: "relative", alignSelf: "stretch" }}>
                      <View style={{
                        flexDirection: "row", gap: spacing.sm, justifyContent: "center",
                        flexWrap: "wrap",
                      }}>
                        {Array.from({ length: PHONE_OTP_LEN }).map((_, i) => {
                          const ch = otpCode[i] ?? "";
                          const focused = i === otpCode.length;
                          return (
                            <View key={i} style={{
                              width: 40, height: 48, borderRadius: radius.md,
                              borderWidth: 1,
                              borderColor: focused ? colors.borderFocus : colors.border,
                              alignItems: "center", justifyContent: "center",
                              backgroundColor: colors.card,
                            }}>
                              <Text style={{
                                fontFamily: fonts.bodyMedium, fontSize: 20, color: colors.foreground,
                              }}>
                                {ch}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                      <TextInput
                        ref={otpInputRef}
                        value={otpCode}
                        onChangeText={(v) => {
                          setOtpCode(v.replace(/\D/g, "").slice(0, PHONE_OTP_LEN));
                          if (otpError) setOtpError(null);
                        }}
                        keyboardType="number-pad"
                        maxLength={PHONE_OTP_LEN}
                        textContentType="oneTimeCode"
                        {...(Platform.OS === "android"
                          ? {
                              autoComplete: "sms-otp" as const,
                              importantForAutofill: "yes" as const,
                            }
                          : {})}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          opacity: 0.02,
                        }}
                      />
                    </View>
                    {otpError ? (
                      <View style={{ alignSelf: "stretch", gap: spacing.xs }}>
                        <Text style={{
                          fontFamily: fonts.body, fontSize: 11,
                          color: colors.destructiveSoft, textAlign: "center",
                        }}>
                          {otpError}
                        </Text>
                        {otpSendErrAdvice ? (
                          <Text style={{
                            fontFamily: fonts.bodyLight, fontSize: 10,
                            lineHeight: 15,
                            color: colors.textTertiary, textAlign: "center",
                          }}>
                            {otpSendErrAdvice}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => void onboardingVerifyPhoneCode()}
                      disabled={verifyBusy || otpCode.replace(/\D/g, "").length !== PHONE_OTP_LEN}
                      style={({ pressed }) => ({
                        paddingVertical: 14, borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: otpCode.replace(/\D/g, "").length === PHONE_OTP_LEN
                          ? colors.borderFocus
                          : colors.border,
                        alignItems: "center",
                        opacity: pressed || verifyBusy ? 0.75 : 1,
                      })}
                    >
                      <Text style={{
                        fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 3,
                        color: otpCode.replace(/\D/g, "").length === PHONE_OTP_LEN
                          ? colors.foreground
                          : colors.textTertiary,
                        textTransform: "uppercase",
                      }}>
                        {verifyBusy ? "Verifying…" : "Verify code"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={onboardingResendOtp}
                      disabled={otpResendSec > 0}
                      style={{ alignSelf: "center" }}
                    >
                      <Text style={{
                        fontFamily: fonts.body, fontSize: 11, letterSpacing: 2,
                        color: otpResendSec > 0 ? colors.textTertiary : colors.foreground,
                        textTransform: "uppercase",
                      }}>
                        {otpResendSec > 0 ? `Resend in ${otpResendSec}s` : "Resend code"}
                      </Text>
                    </Pressable>
                    {phoneChannel === "whatsapp" ? (
                      <Pressable
                        onPress={() => void onboardingSwitchToSmsResend()}
                        disabled={otpResendSec > 0}
                        style={{ alignSelf: "center", paddingVertical: spacing.xs }}
                      >
                        <Text style={{
                          fontFamily: fonts.body, fontSize: 11,
                          color: otpResendSec > 0 ? colors.textTertiary : colors.foreground,
                          textDecorationLine: "underline",
                          textAlign: "center",
                        }}>
                          Send code by SMS instead
                        </Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={() => {
                        setPhoneOtpPhase("idle");
                        setOtpCode("");
                        setOtpError(null);
                      }}
                      style={{ alignSelf: "center", paddingVertical: spacing.sm }}
                    >
                      <Text style={{
                        fontFamily: fonts.body, fontSize: 11,
                        color: colors.textTertiary,
                        textDecorationLine: "underline",
                      }}>
                        Edit number
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {phoneOtpPhase !== "verified" ? (
                <Pressable
                  onPress={skipCountryPhoneAndContinue}
                  accessibilityRole="button"
                  accessibilityLabel="Skip verifying phone number and continue onboarding"
                  style={({ pressed }) => ({
                    marginTop: spacing.lg,
                    paddingVertical: spacing.sm,
                    alignSelf: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{
                    fontFamily: fonts.body, fontSize: 11,
                    color: colors.textTertiary,
                    textDecorationLine: "underline",
                    textAlign: "center",
                  }}>
                    Skip phone verification · continue onboarding
                  </Text>
                </Pressable>
                ) : null}
              </View>
          ) : null}

          {stepId === "language" ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" }}>
              {(APP_LOCALES as readonly { tag: string; label: string }[]).map((loc) => {
                const on = locale === loc.tag;
                return (
                  <Pressable
                    key={loc.tag}
                    onPress={() => setLocale(loc.tag)}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: on ? colors.borderFocus : colors.border,
                      backgroundColor: on ? "rgba(60,60,60,0.1)" : "transparent",
                      minWidth: "42%",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{
                      fontFamily: fonts.bodyMedium,
                      fontSize: 13,
                      color: on ? colors.foreground : colors.textSecondary,
                    }}>
                      {loc.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {stepId === "interests" ? (
            <View>
              <View style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                justifyContent: "center",
              }}>
                {INTERESTS.map((i) => {
                  const on = selected.includes(i);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => toggleInterest(i)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: on ? colors.borderFocus : colors.border,
                        backgroundColor: on ? "rgba(60,60,60,0.1)" : "transparent",
                      }}
                    >
                      <Text style={{
                        fontFamily: fonts.bodyMedium,
                        fontSize: 11,
                        letterSpacing: 1,
                        color: on ? colors.foreground : colors.textTertiary,
                        textTransform: "uppercase",
                      }}>
                        {i}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {error ? (
            <Text style={{
              fontFamily: fonts.body,
              fontSize: 11,
              color: colors.destructiveSoft,
              textAlign: "center",
              marginTop: spacing.md,
            }}>
              {error}
            </Text>
          ) : null}

          <OnboardingFooter
            stepId={stepId}
            interestMuted={interestMuted}
            onContinue={advance}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function OnboardingChannelTab({
  active, label, icon, onPress,
}: {
  active: boolean;
  label: string;
  icon: ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: radius.sm,
        backgroundColor: active ? colors.background : "transparent",
        borderWidth: active ? 1 : 0,
        borderColor: colors.border,
        opacity: pressed && !active ? 0.6 : 1,
      })}
    >
      <Feather
        name={icon}
        size={14}
        color={active ? colors.foreground : colors.textTertiary}
        style={{ marginRight: 6 }}
      />
      <Text style={{
        fontFamily: active ? fonts.bodyMedium : fonts.body,
        fontSize: 11, letterSpacing: 2,
        color: active ? colors.foreground : colors.textTertiary,
        textTransform: "uppercase",
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

function StepperDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.xl,
    }}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <View
            key={String(i)}
            style={{
              height: 4,
              width: active ? 28 : 8,
              borderRadius: radius.pill,
              backgroundColor: active ? colors.foreground : colors.border,
            }}
          />
        );
      })}
    </View>
  );
}

function OnboardingFooter(props: {
  stepId: StepId;
  interestMuted: boolean;
  onContinue: () => void;
}) {
  const { stepId, interestMuted, onContinue } = props;
  const label = stepId === "interests" ? "Enter ATMAD" : "Continue";
  const dim = stepId === "interests" && interestMuted;

  return (
    <Pressable
      onPress={onContinue}
      style={{
        marginTop: spacing.xl,
        paddingVertical: 16,
        borderRadius: radius.md,
        backgroundColor: dim ? "rgba(10,10,10,0.06)" : colors.foreground,
        alignItems: "center",
      }}
    >
      <Text style={{
        fontFamily: fonts.bodyMedium,
        fontSize: 11,
        letterSpacing: 3,
        color: dim ? colors.textTertiary : colors.inverse,
        textTransform: "uppercase",
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
