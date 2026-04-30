import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { signInWithEmailPassword, signUpWithEmailPassword } from "../../auth/authActions";
import { env } from "../../lib/env";
import { trackJourney } from "../../analytics/journeyContracts";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

function isDuplicateEmailSignup(msg: string, code?: string): boolean {
  if (code === "user_already_exists" || code === "email_exists") return true;
  const m = msg.toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already")
  );
}

export type EmailAuthMode = "signup" | "login";

type Props = {
  /**
   * `signup`: new-account fields (growth default common in consumer apps).
   * `login`: password-only gate for returning sessions.
   */
  initialMode?: EmailAuthMode;
  variant?: "standalone" | "embedded";
  onModeChange?: (mode: EmailAuthMode) => void;
};

const inputStyle = {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: 14,
  fontFamily: fonts.body,
  fontSize: 14,
  color: colors.foreground,
} as const;

/** Sign up: full name → email → password → confirm · Log in: email → password only. */
export function EmailAuthForm({
  initialMode = "signup",
  variant = "standalone",
  onModeChange,
}: Props) {
  const [mode, setMode] = useState<EmailAuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** After sign-up when email confirmation is required — show “log in after confirm” UX */
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  useEffect(() => {
    trackJourney("auth_email_password_start");
  }, []);

  useEffect(() => {
    if (mode === "login") setConfirmPassword("");
  }, [mode]);

  function setModeClear(next: EmailAuthMode) {
    setMode(next);
    setError(null);
    setBanner(null);
    if (next === "signup") setAwaitingEmailConfirm(false);
  }

  const canSubmit = useMemo(() => {
    if (!email.trim() || password.length < 8) return false;
    if (mode === "login") return true;
    if (fullName.trim().length < 2) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [email, password, confirmPassword, mode, fullName]);

  async function onSubmit() {
    setError(null);
    if (!awaitingEmailConfirm) setBanner(null);
    if (!canSubmit) {
      if (mode === "signup") {
        if (!email.trim()) setError("Enter your email.");
        else if (fullName.trim().length < 2) setError("Enter your full name (at least 2 characters).");
        else if (password.length < 8) setError("Password must be at least 8 characters.");
        else if (password !== confirmPassword) setError("Passwords must match.");
        else setError("Check the form and try again.");
      } else setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const r = await signUpWithEmailPassword(email, password, fullName.trim());
        if (!r.success) {
          const code = "authCode" in r ? r.authCode : undefined;
          if (isDuplicateEmailSignup(r.error ?? "", code)) {
            setMode("login");
            setAwaitingEmailConfirm(false);
            setBanner(
              "This email already has an account (you’ll see it in Auth users). Log in below with your password.",
            );
            Keyboard.dismiss();
            return;
          }
          setError(r.error ?? "Could not sign up");
          return;
        }
        // Sign-up typically returns `session` when email confirmation is off; onAuthStateChange updates the app — no second sign-in.
        if (
          env.TRY_SIGNIN_AFTER_EMAIL_SIGNUP &&
          !r.needsEmailConfirmation &&
          !r.session
        ) {
          const sr = await signInWithEmailPassword(email, password);
          if (sr.success) return;
          setError(sr.error ?? "Signed up but couldn’t finish sign-in. Try Log in.");
          return;
        }
        if (r.needsEmailConfirmation) {
          setAwaitingEmailConfirm(true);
          setBanner(
            "We sent a confirmation link. After you tap it (or if you already confirmed in Supabase), open Log in below and enter the same email and password to enter the app.",
          );
          Keyboard.dismiss();
          return;
        }
        return;
      }

      const r = await signInWithEmailPassword(email, password);
      if (!r.success) {
        const code = "authCode" in r ? r.authCode : undefined;
        if (code === "email_not_confirmed" || /\bnot\s+confirmed\b/i.test(r.error ?? "")) {
          setBanner(
            "Confirm the link in your email first — then tap Log in here again.",
          );
          setError(null);
          return;
        }
        setError(r.error ?? "Could not log in");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const embedded = variant === "embedded";

  return (
    <View>
      {!embedded ? (
        <Text style={{
          marginBottom: spacing.lg,
          fontFamily: fonts.heading,
          fontSize: 24,
          color: colors.foreground,
          textAlign: "center",
        }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </Text>
      ) : null}

      {/* iOS/Android pattern: segmented control, always actionable */}
      <View style={{
        flexDirection: "row",
        marginBottom: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 4,
        backgroundColor: colors.card,
      }}>
        <ToggleChip active={mode === "signup"} label="Sign up" onPress={() => setModeClear("signup")} />
        <ToggleChip active={mode === "login"} label="Log in" onPress={() => setModeClear("login")} />
      </View>

      {mode === "signup" ? (
        <>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={colors.textFaint}
            autoComplete="name"
            textContentType="name"
            style={inputStyle}
          />
          <View style={{ height: spacing.md }} />
        </>
      ) : null}

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.textFaint}
        autoComplete="email"
        textContentType="emailAddress"
        style={inputStyle}
      />

      <View style={{ height: spacing.md }} />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password · min 8 characters"
        placeholderTextColor={colors.textFaint}
        autoComplete={mode === "signup" ? "password-new" : "password"}
        textContentType={mode === "signup" ? "newPassword" : "password"}
        style={inputStyle}
      />

      {mode === "signup" ? (
        <>
          <View style={{ height: spacing.md }} />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm password"
            placeholderTextColor={colors.textFaint}
            autoComplete="password-new"
            textContentType="newPassword"
            style={inputStyle}
          />
        </>
      ) : null}

      <Pressable
        disabled={submitting}
        onPress={onSubmit}
        style={({ pressed }) => ({
          marginTop: spacing.lg,
          paddingVertical: 16,
          borderRadius: radius.md,
          backgroundColor: canSubmit ? colors.foreground : "rgba(10,10,10,0.06)",
          alignItems: "center",
          opacity: pressed && !submitting ? 0.92 : 1,
        })}
      >
        <Text style={{
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
          letterSpacing: 3,
          color: canSubmit ? colors.inverse : colors.textTertiary,
          textTransform: "uppercase",
        }}>
          {submitting
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </Text>
      </Pressable>

      {banner ? (
        <Text style={{
          marginTop: spacing.md,
          fontFamily: fonts.bodyLight,
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 18,
          textAlign: "center",
        }}>
          {banner}
        </Text>
      ) : null}

      {awaitingEmailConfirm ? (
        <Pressable
          onPress={() => {
            setAwaitingEmailConfirm(false);
            setMode("login");
            setError(null);
            setBanner(
              "You’re registered — enter your password and tap Log in to continue.",
            );
          }}
          style={{ marginTop: spacing.md }}
        >
          <Text style={{
            textAlign: "center",
            fontFamily: fonts.bodyMedium,
            fontSize: 11,
            letterSpacing: 1,
            color: colors.foreground,
            textDecorationLine: "underline",
          }}>
            I confirmed my email → Log in
          </Text>
        </Pressable>
      ) : null}

      {error ? (
        <Text style={{
          marginTop: spacing.sm,
          fontFamily: fonts.body,
          fontSize: 11,
          color: colors.destructiveSoft,
          textAlign: "center",
        }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function ToggleChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: radius.sm,
        backgroundColor: active ? colors.background : "transparent",
        borderWidth: active ? 1 : 0,
        borderColor: colors.border,
      }}
    >
      <Text style={{
        fontFamily: active ? fonts.bodyMedium : fonts.body,
        fontSize: 11,
        letterSpacing: 2,
        color: active ? colors.foreground : colors.textSecondary,
        textTransform: "uppercase",
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
