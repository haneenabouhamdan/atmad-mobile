/**
 * Luxury design tokens — ported from src/index.css.
 * Black/white editorial palette, Playfair display serif, Inter body.
 */

export const colors = {
  background:        "#FFFFFF",
  foreground:        "#0A0A0A",
  card:              "#F5F5F5",
  cardForeground:    "#0A0A0A",
  surface:           "#1F1F1F",
  surfaceRaised:     "#2A2A2A",
  border:            "rgba(60,60,60,0.14)",
  borderFocus:       "rgba(10,10,10,0.28)",
  muted:             "#EDEDED",
  mutedForeground:   "rgba(60,60,60,0.42)",
  silver:            "#E8E8E8",
  silverDim:         "#C0C0C0",
  destructive:       "rgba(180,60,60,0.85)",
  destructiveSoft:   "rgba(180,80,80,0.8)",
  obsidian:          "#0A0A0A",

  textPrimary:       "#0A0A0A",
  textSecondary:     "rgba(60,60,60,0.58)",
  textTertiary:      "rgba(60,60,60,0.42)",
  textFaint:         "rgba(60,60,60,0.22)",
  inverse:           "#FFFFFF",
} as const;

export const fonts = {
  heading: "PlayfairDisplay_500Medium",
  headingItalic: "PlayfairDisplay_500Medium_Italic",
  bodyLight:   "Inter_300Light",
  body:        "Inter_400Regular",
  bodyMedium:  "Inter_500Medium",
  bodySemi:    "Inter_600SemiBold",
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const tracking = {
  wide:   0.5,
  wider:  1.2,
  widest: 3.5,
} as const;

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
};
