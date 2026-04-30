export type ProfileNamePick = { full_name: string | null } | null;

/** Trimmed `profiles.full_name` when at least 2 characters. */
export function fullNameFromProfile(profile: ProfileNamePick): string {
  const t = profile?.full_name?.trim() ?? "";
  return t.length >= 2 ? t : "";
}
