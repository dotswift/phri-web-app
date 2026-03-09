/**
 * Parse a free-text doctor name into first + last name for NPI search.
 *
 * Handles:
 *   "Smith"                → { first: "", last: "Smith" }
 *   "John Smith"           → { first: "John", last: "Smith" }
 *   "Dr. John Smith"       → { first: "John", last: "Smith" }
 *   "Dr. Shaina Hecht, MD" → { first: "Shaina", last: "Hecht" }
 *   "John A. Smith Jr."    → { first: "John", last: "Smith" }
 */
export function parseProviderName(raw: string): { first: string; last: string } {
  let s = raw.trim();

  // Strip leading titles: Dr. / Dr / Doctor
  s = s.replace(/^(dr\.?\s+|doctor\s+)/i, "");

  // Strip trailing credentials: , MD / MD / M.D. / DO / D.O. / PhD / NP / PA / RN / FACP etc.
  s = s.replace(/,?\s*(M\.?D\.?|D\.?O\.?|Ph\.?D\.?|N\.?P\.?|P\.?A\.?|R\.?N\.?|D\.?D\.?S\.?|D\.?M\.?D\.?|D\.?P\.?M\.?|F\.?A\.?[A-Z\.]*|B\.?S\.?|M\.?S\.?|Jr\.?|Sr\.?|III?|IV)\s*\.?\s*$/gi, "");

  // Strip trailing credentials again (handles "MD, FACP" → two passes)
  s = s.replace(/,?\s*(M\.?D\.?|D\.?O\.?|Ph\.?D\.?|N\.?P\.?|P\.?A\.?|R\.?N\.?|F\.?A\.?[A-Z\.]*|Jr\.?|Sr\.?)\s*\.?\s*$/gi, "");

  s = s.trim().replace(/,+$/, "").trim();

  const parts = s.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: "", last: parts[0] };

  // First word = first name, last word = last name (skip middle initials)
  return { first: parts[0], last: parts[parts.length - 1] };
}
