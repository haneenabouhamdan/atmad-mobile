/**
 * Obsidian tier bands — aligned with v17 prototype (progressionStore).
 * Server `profiles.tier` may use different labels; we derive gates from points.
 */
export interface Tier {
  id: string;
  label: string;
  sublabel: string;
  minPoints: number;
  maxPoints: number;
  roman: string;
}

export const TIERS: Tier[] = [
  {
    id: "obsidian-i",
    label: "Obsidian",
    sublabel: "First Circle",
    roman: "I",
    minPoints: 0,
    maxPoints: 2499,
  },
  {
    id: "obsidian-ii",
    label: "Obsidian",
    sublabel: "Second Circle",
    roman: "II",
    minPoints: 2500,
    maxPoints: 4999,
  },
  {
    id: "noir-elite",
    label: "Noir Elite",
    sublabel: "Inner Sanctum",
    roman: "",
    minPoints: 5000,
    maxPoints: 9999,
  },
  {
    id: "noir-prime",
    label: "Noir Prime",
    sublabel: "The Archive",
    roman: "",
    minPoints: 10000,
    maxPoints: Number.POSITIVE_INFINITY,
  },
];

export function resolveTier(points: number): Tier {
  const p = Math.max(0, points);
  return TIERS.find((t) => p >= t.minPoints && p <= t.maxPoints) ?? TIERS[0];
}

export function resolveNextTier(tierId: string): Tier | null {
  const idx = TIERS.findIndex((t) => t.id === tierId);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1]! : null;
}

export function resolveProgressPct(points: number, tier: Tier): number {
  if (tier.maxPoints === Number.POSITIVE_INFINITY) return 100;
  const range = tier.maxPoints - tier.minPoints + 1;
  return Math.min(100, Math.round(((points - tier.minPoints) / range) * 100));
}

export function resolvePointsToNext(points: number, tierId: string): number {
  const next = resolveNextTier(tierId);
  return next ? Math.max(0, next.minPoints - points) : 0;
}
