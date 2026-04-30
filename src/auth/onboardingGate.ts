/** Whether first-run onboarding (role/country/language/interests + display name present) must still complete. */

export function needsMandatoryOnboarding(
  profile: {
    full_name: string | null;
    country_iso: string | null;
    interests: string[] | null;
  } | null,
): boolean {
  if (!profile) return true;
  if (!profile.full_name?.trim()) return true;
  if (!profile.country_iso?.trim()) return true;
  if (!profile.interests || profile.interests.length === 0) return true;
  return false;
}

/** Explain why onboarding is incomplete (when profile exists but gate still fails). */
export function mandatoryOnboardingMissingHint(
  profile: {
    full_name: string | null;
    country_iso: string | null;
    interests: string[] | null;
  } | null,
): string | null {
  if (!profile) return "Couldn't load your profile from the server.";
  if (!profile.full_name?.trim()) return "Missing display name.";
  if (!profile.country_iso?.trim()) return "Missing country.";
  if (!profile.interests?.length) return "Select at least one interest.";
  return null;
}
