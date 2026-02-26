/**
 * Pre-LLM deterministic crisis keyword matching.
 * When triggered, bypasses AI entirely and shows emergency card.
 * Uses word-boundary matching to avoid false positives.
 */

const CRISIS_PATTERNS = [
  // Suicidal ideation
  /\bsuicid(e|al)\b/i,
  /\bkill\s+(my|him|her|them)self\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bend\s+(my|it\s+all)\s+life\b/i,
  /\bself[- ]harm\b/i,

  // Acute medical emergencies
  /\bchest\s+pain\b/i,
  /\bcan'?t\s+breathe\b/i,
  /\bdifficulty\s+breathing\b/i,
  /\bstroke\s+symptoms?\b/i,
  /\bheart\s+attack\b/i,
  /\bsevere\s+bleeding\b/i,
  /\bsevere\s+allergic\s+reaction\b/i,
  /\banaphylax/i,
  /\boverdos(e|ing)\b/i,
];

export interface CrisisResult {
  isCrisis: boolean;
  matchedPattern?: string;
}

export function detectCrisis(text: string): CrisisResult {
  for (const pattern of CRISIS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { isCrisis: true, matchedPattern: match[0] };
    }
  }
  return { isCrisis: false };
}

export const CRISIS_MESSAGE = {
  title: "If you're experiencing a medical emergency",
  body: "Please contact emergency services immediately.",
  contacts: [
    { label: "Emergency Services", number: "911" },
    { label: "Suicide & Crisis Lifeline", number: "988" },
  ],
} as const;
