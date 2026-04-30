import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../../theme/tokens";
import { useToast } from "../Toast";
import { submitLead, type FormField, type ListingForm } from "../../lib/listings";

type Values = Record<string, string | number | boolean | string[]>;

function calcAge(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function looksLikeDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function ActionForm({
  form,
  listingId,
}: {
  form: ListingForm;
  listingId: string;
}) {
  const toast = useToast();
  const [values, setValues]   = useState<Values>({});
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const requiresConsent = !!form.consentText;

  const validateLocal = useMemo(() => {
    return () => {
      const next: Record<string, string> = {};
      for (const f of form.fields) {
        const v = values[f.key];
        const present =
          v !== undefined && v !== null &&
          !(typeof v === "string" && v.trim() === "") &&
          !(Array.isArray(v) && v.length === 0);

        if (f.required && !present) {
          next[f.key] = `${f.label} is required`;
          continue;
        }
        if (!present) continue;

        if (f.type === "email" && typeof v === "string" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          next[f.key] = "Invalid email";
        }
        if (f.type === "phone" && typeof v === "string" &&
            !/^[+()\-\s\d]{6,20}$/.test(v)) {
          next[f.key] = "Invalid phone";
        }
        if (f.type === "number") {
          const n = typeof v === "number" ? v : Number(v);
          if (Number.isNaN(n)) next[f.key] = "Must be a number";
          else {
            if (typeof f.min === "number" && n < f.min) next[f.key] = `Min ${f.min}`;
            if (typeof f.max === "number" && n > f.max) next[f.key] = `Max ${f.max}`;
          }
        }
        if ((f.type === "date" || f.type === "dob") && typeof v === "string") {
          if (!looksLikeDate(v)) {
            next[f.key] = "Use format YYYY-MM-DD";
          } else if (f.type === "dob" && typeof form.minAge === "number" && form.minAge > 0) {
            const age = calcAge(v);
            if (age === null) next[f.key] = "Invalid date";
            else if (age < form.minAge) next[f.key] = `Must be ${form.minAge}+ to apply`;
          }
        }
      }
      return next;
    };
  }, [form, values]);

  async function onSubmit() {
    const next = validateLocal();
    if (Object.keys(next).length) {
      setErrors(next);
      toast.show({ message: "Please fix the highlighted fields", tone: "error" });
      return;
    }
    if (requiresConsent && !consent) {
      toast.show({ message: "Please accept the consent to continue", tone: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of form.fields) {
        const v = values[f.key];
        if (v === undefined || v === null || v === "") continue;
        if (f.type === "number" && typeof v !== "number") payload[f.key] = Number(v);
        else payload[f.key] = v;
      }
      const res = await submitLead({
        formId: form._id,
        listingId,
        payload,
        consent: consent || !requiresConsent,
      });
      setSuccess(form.successMessage || "Thanks — we'll be in touch shortly.");
      toast.show({ message: "Submitted", tone: "success" });
      setValues({});
      void res;
    } catch (e) {
      toast.show({ message: (e as Error).message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <View style={styles.successWrap}>
        <Feather name="check-circle" size={32} color={colors.foreground} />
        <Text style={styles.successText}>{success}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
      >
        {form.minAge ? (
          <View style={styles.ageBanner}>
            <Feather name="user-check" size={14} color={colors.foreground} />
            <Text style={styles.ageText}>You must be {form.minAge}+ to submit.</Text>
          </View>
        ) : null}

        {form.fields.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={values[field.key]}
            error={errors[field.key]}
            onChange={(v) => {
              setValues((prev) => ({ ...prev, [field.key]: v }));
              if (errors[field.key]) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next[field.key];
                  return next;
                });
              }
            }}
          />
        ))}

        {requiresConsent ? (
          <Pressable onPress={() => setConsent((c) => !c)} style={styles.consentRow}>
            <View style={[styles.checkbox, consent && styles.checkboxOn]}>
              {consent ? <Feather name="check" size={12} color={colors.inverse} /> : null}
            </View>
            <Text style={styles.consentText}>{form.consentText}</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={submitting}
          style={({ pressed }) => [styles.submit, pressed && { opacity: 0.85 }]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.inverse} />
          ) : (
            <Text style={styles.submitLabel}>Submit</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Field renderer ─────────────────────────────────────────────────────
function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: Values[string] | undefined;
  error?: string;
  onChange: (v: Values[string]) => void;
}) {
  const label = (
    <View style={styles.labelRow}>
      <Text style={styles.fieldLabel}>
        {field.label}{field.required ? " *" : ""}
      </Text>
      {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}
    </View>
  );

  if (field.type === "checkbox") {
    return (
      <View style={{ gap: 4 }}>
        <Pressable
          onPress={() => onChange(!value)}
          style={styles.consentRow}
        >
          <View style={[styles.checkbox, value ? styles.checkboxOn : null]}>
            {value ? <Feather name="check" size={12} color={colors.inverse} /> : null}
          </View>
          <Text style={styles.consentText}>{field.label}</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <View style={{ gap: 6 }}>
        {label}
        <View style={styles.chipRow}>
          {field.options.map((opt) => {
            const active = value === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => onChange(opt)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (field.type === "multi_select" && field.options) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <View style={{ gap: 6 }}>
        {label}
        <View style={styles.chipRow}>
          {field.options.map((opt) => {
            const active = arr.includes(opt);
            return (
              <Pressable
                key={opt}
                onPress={() => onChange(active ? arr.filter((v) => v !== opt) : [...arr, opt])}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  if (field.type === "textarea") {
    return (
      <View style={{ gap: 6 }}>
        {label}
        <TextInput
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          placeholder={field.placeholder ?? ""}
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[styles.input, styles.textarea, error ? styles.inputError : null]}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  const keyboardType =
    field.type === "email"  ? "email-address" :
    field.type === "phone"  ? "phone-pad"     :
    field.type === "number" ? "decimal-pad"   :
                              "default";

  const placeholder =
    field.placeholder ??
    (field.type === "dob"  ? "YYYY-MM-DD" :
     field.type === "date" ? "YYYY-MM-DD" : "");

  return (
    <View style={{ gap: 6 }}>
      {label}
      <TextInput
        value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize={field.type === "email" ? "none" : undefined}
        autoCorrect={field.type !== "email"}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ageBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.muted, borderRadius: radius.md,
  },
  ageText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.foreground },
  labelRow: { gap: 2 },
  fieldLabel: {
    fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.4,
    textTransform: "uppercase", color: colors.textSecondary,
  },
  help: { fontFamily: fonts.body, fontSize: 11, color: colors.textTertiary },
  input: {
    fontFamily: fonts.body, fontSize: 14, color: colors.foreground,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  inputError: { borderColor: colors.destructive },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  error: { fontFamily: fonts.body, fontSize: 11, color: colors.destructive },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  chipLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.foreground },
  chipLabelActive: { color: colors.inverse },
  consentRow: {
    flexDirection: "row", alignItems: "flex-start", gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
    borderColor: colors.foreground, alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.foreground },
  consentText: {
    flex: 1, fontFamily: fonts.body, fontSize: 12,
    color: colors.textSecondary, lineHeight: 18,
  },
  submit: {
    marginTop: spacing.md, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.foreground, paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  submitLabel: {
    color: colors.inverse, fontFamily: fonts.bodyMedium,
    fontSize: 13, letterSpacing: 1.4, textTransform: "uppercase",
  },
  successWrap: {
    alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl,
  },
  successText: {
    fontFamily: fonts.heading, fontSize: 18, color: colors.foreground, textAlign: "center",
  },
});
