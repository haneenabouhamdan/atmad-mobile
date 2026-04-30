import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import { updateProfile } from "../auth/authActions";
import type { Country } from "../data/countries";
import { DEFAULT_COUNTRY, findCountryByCode } from "../data/countries";
import { trackJourney } from "../analytics/journeyContracts";

/** Curated UX languages; widen when translations ship. */
export const APP_LOCALES = [
  { tag: "en", label: "English" },
  { tag: "ar", label: "العربية" },
  { tag: "fr", label: "Français" },
] as const;

type GuestPrefs = Partial<{
  countryIso: string;
  locale: string;
}>;

export interface RegionalPreferencesValue {
  countryIso: string;
  country: Country;
  locale: string;
  /** Persists to `profiles` when logged in; local-only otherwise (e.g. preview mode). */
  setCountryIso: (code: string) => Promise<boolean>;
  setLocale: (localeTag: string) => Promise<boolean>;
  busyField: null | "country" | "locale";
}

const RegionalPreferencesContext = createContext<RegionalPreferencesValue | null>(
  null,
);

export function RegionalPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, refreshProfile, session } = useAuth();
  const [guest, setGuest] = useState<GuestPrefs>({});
  const [busyField, setBusyField] =
    useState<RegionalPreferencesValue["busyField"]>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    setGuest({});
  }, [session?.user?.id]);

  const countryIso =
    profile?.country_iso ?? guest.countryIso ?? DEFAULT_COUNTRY.code;
  const locale = profile?.locale ?? guest.locale ?? "en";

  const country = findCountryByCode(countryIso) ?? DEFAULT_COUNTRY;

  const setCountryIso = useCallback(
    async (code: string) => {
      trackJourney("region_country_change", { countryIso: code });
      if (!session?.user?.id) {
        setGuest((p) => ({ ...p, countryIso: code }));
        return true;
      }
      setBusyField("country");
      const r = await updateProfile({ countryIso: code });
      if (r.success) await refreshProfile();
      setBusyField(null);
      return r.success;
    },
    [refreshProfile, session?.user?.id],
  );

  const setLocale = useCallback(
    async (localeTag: string) => {
      trackJourney("region_locale_change", { locale: localeTag });
      if (!session?.user?.id) {
        setGuest((p) => ({ ...p, locale: localeTag }));
        return true;
      }
      setBusyField("locale");
      const r = await updateProfile({ locale: localeTag });
      if (r.success) await refreshProfile();
      setBusyField(null);
      return r.success;
    },
    [refreshProfile, session?.user?.id],
  );

  const value = useMemo(
    (): RegionalPreferencesValue => ({
      countryIso,
      country,
      locale,
      setCountryIso,
      setLocale,
      busyField,
    }),
    [
      country,
      countryIso,
      locale,
      setCountryIso,
      setLocale,
      busyField,
    ],
  );

  return (
    <RegionalPreferencesContext.Provider value={value}>
      {children}
    </RegionalPreferencesContext.Provider>
  );
}

export function useRegionalPreferences(): RegionalPreferencesValue {
  const ctx = useContext(RegionalPreferencesContext);
  if (!ctx) {
    throw new Error("useRegionalPreferences must run inside RegionalPreferencesProvider");
  }
  return ctx;
}
