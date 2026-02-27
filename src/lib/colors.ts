/**
 * FHIR resource type color mappings for programmatic use.
 * Each resource type has badge, cardBg, and labelText variants.
 * labelText uses low chroma to ensure WCAG AA contrast (≥4.5:1) against cardBg.
 * Light mode values — dark mode overrides handled via CSS variables.
 */
export const FHIR_RESOURCE_COLORS: Record<
  string,
  { badge: string; cardBg: string; labelText: string; hue: number }
> = {
  Condition: {
    badge: "oklch(0.65 0.13 18)",
    cardBg: "oklch(0.95 0.02 18)",
    labelText: "oklch(0.20 0.06 18)",
    hue: 18,
  },
  DiagnosticReport: {
    badge: "oklch(0.65 0.12 310)",
    cardBg: "oklch(0.95 0.02 310)",
    labelText: "oklch(0.20 0.06 310)",
    hue: 310,
  },
  Encounter: {
    badge: "oklch(0.65 0.12 240)",
    cardBg: "oklch(0.95 0.02 240)",
    labelText: "oklch(0.20 0.06 240)",
    hue: 240,
  },
  Immunization: {
    badge: "oklch(0.65 0.12 175)",
    cardBg: "oklch(0.95 0.02 175)",
    labelText: "oklch(0.20 0.06 175)",
    hue: 175,
  },
  Observation: {
    badge: "oklch(0.65 0.11 220)",
    cardBg: "oklch(0.95 0.02 220)",
    labelText: "oklch(0.20 0.06 220)",
    hue: 220,
  },
  Procedure: {
    badge: "oklch(0.65 0.13 275)",
    cardBg: "oklch(0.95 0.02 275)",
    labelText: "oklch(0.20 0.06 275)",
    hue: 275,
  },
  MedicationRequest: {
    badge: "oklch(0.70 0.14 70)",
    cardBg: "oklch(0.95 0.025 70)",
    labelText: "oklch(0.20 0.06 70)",
    hue: 70,
  },
  AllergyIntolerance: {
    badge: "oklch(0.65 0.13 350)",
    cardBg: "oklch(0.95 0.02 350)",
    labelText: "oklch(0.20 0.06 350)",
    hue: 350,
  },
};

export const STATUS_COLORS = {
  success: {
    bg: "oklch(0.92 0.04 155)",
    text: "oklch(0.20 0.06 155)",
    icon: "oklch(0.59 0.17 155)",
  },
  warning: {
    bg: "oklch(0.92 0.04 75)",
    text: "oklch(0.20 0.03 65)",
    icon: "oklch(0.75 0.16 75)",
  },
  error: {
    bg: "oklch(0.93 0.03 20)",
    text: "oklch(0.20 0.08 25)",
    icon: "oklch(0.57 0.22 25)",
  },
  info: {
    bg: "oklch(0.93 0.03 240)",
    text: "oklch(0.20 0.06 240)",
    icon: "oklch(0.59 0.15 240)",
  },
  muted: {
    bg: "oklch(0.95 0.005 260)",
    text: "oklch(0.35 0.02 260)",
    icon: "oklch(0.55 0.02 260)",
  },
} as const;
