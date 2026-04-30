/**
 * Bounds for national-significant digits (typed beside dial), excluding +country dial.
 * Ranges approximate common mobile numbering — unknown ISO uses permissive fallback.
 */

const FALLBACK = { min: 7, max: 15 };

/** Min/max inclusive lengths for mobiles (typical UX in apps). */
export const PHONE_NS_LENGTH_BY_ISO: Record<string, { min: number; max: number }> = {
  // GCC & Middle East / North Africa
  AE: { min: 9, max: 9 }, // mobiles 5xxxxxxxx
  SA: { min: 9, max: 9 },
  KW: { min: 8, max: 8 },
  BH: { min: 8, max: 8 },
  QA: { min: 8, max: 8 },
  OM: { min: 8, max: 8 },
  LB: { min: 7, max: 8 },
  JO: { min: 9, max: 9 },
  IQ: { min: 10, max: 10 },
  SY: { min: 9, max: 9 },
  YE: { min: 9, max: 9 },
  PS: { min: 9, max: 9 },
  IL: { min: 9, max: 9 },
  EG: { min: 10, max: 10 },
  TN: { min: 8, max: 8 },
  DZ: { min: 9, max: 9 },
  MA: { min: 9, max: 9 },
  LY: { min: 9, max: 9 },

  // NANP (+1 …)
  US: { min: 10, max: 10 },
  CA: { min: 10, max: 10 },

  GB: { min: 10, max: 10 },
  IE: { min: 9, max: 9 },
  AU: { min: 9, max: 9 },
  NZ: { min: 9, max: 9 },

  IN: { min: 10, max: 10 },
  PK: { min: 10, max: 10 },
  BD: { min: 10, max: 10 },
  NP: { min: 10, max: 10 },
  LK: { min: 9, max: 9 },

  FR: { min: 9, max: 9 },
  ES: { min: 9, max: 9 },
  PT: { min: 9, max: 9 },
  IT: { min: 9, max: 11 },
  DE: { min: 10, max: 11 },
  AT: { min: 10, max: 13 },
  CH: { min: 9, max: 9 },
  NL: { min: 9, max: 9 },
  BE: { min: 9, max: 9 },
  LU: { min: 9, max: 9 },
  DK: { min: 8, max: 8 },
  SE: { min: 9, max: 9 },
  NO: { min: 8, max: 8 },
  FI: { min: 9, max: 12 },
  PL: { min: 9, max: 9 },
  CZ: { min: 9, max: 9 },
  SK: { min: 9, max: 9 },
  HU: { min: 9, max: 9 },
  GR: { min: 10, max: 10 },
  CY: { min: 8, max: 8 },
  UA: { min: 9, max: 9 },

  TR: { min: 10, max: 10 },
  RU: { min: 10, max: 10 },
  KZ: { min: 10, max: 10 },

  CN: { min: 11, max: 11 },
  HK: { min: 8, max: 8 },
  JP: { min: 10, max: 11 },
  KR: { min: 9, max: 11 },
  TW: { min: 9, max: 9 },
  TH: { min: 9, max: 9 },
  VN: { min: 9, max: 10 },
  MY: { min: 9, max: 10 },
  SG: { min: 8, max: 8 },
  ID: { min: 9, max: 12 },
  PH: { min: 10, max: 10 },

  ZA: { min: 9, max: 9 },

  BR: { min: 10, max: 11 },
  MX: { min: 10, max: 10 },
  CO: { min: 10, max: 10 },
  AR: { min: 10, max: 10 },

  NG: { min: 10, max: 10 },
  KE: { min: 9, max: 9 },
};

export function nationalNumberLengthBounds(iso2Upper: string): { min: number; max: number } {
  return PHONE_NS_LENGTH_BY_ISO[iso2Upper.trim().toUpperCase()] ?? FALLBACK;
}

export function clampNationalDigits(digits: string, maxDigits: number): string {
  return digits.replace(/\D/g, "").slice(0, maxDigits);
}

/** Numeric span for labels: `"9"` or `"9–11"` (single length never duplicated). Add `" digits"` when building copy. */
export function nationalDigitsRangePhrase(minDigits: number, maxDigits: number): string {
  return minDigits === maxDigits ? `${minDigits}` : `${minDigits}–${maxDigits}`;
}

/**
 * Returns `null` if length is acceptable; otherwise short user-readable error text.
 */
export function validateNationalPhoneDigits(iso2: string, digits: string): string | null {
  const cleaned = digits.replace(/\D/g, "");
  if (cleaned.length === 0) return null;
  const { min, max } = nationalNumberLengthBounds(iso2);
  const n = cleaned.length;
  if (n < min) {
    if (min === max) return `Enter exactly ${min} digits (${n}/${min}).`;
    return `Use ${nationalDigitsRangePhrase(min, max)} digits for this dial code (${n}/${min}).`;
  }
  if (n > max) return min === max ? `Exactly ${max} digits for this dial code.` : `${max} digits maximum for this dial code.`;
  return null;
}
