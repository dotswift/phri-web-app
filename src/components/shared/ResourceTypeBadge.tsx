import { FHIR_RESOURCE_COLORS } from "@/lib/colors";

const DEFAULT_COLOR = {
  badge: "oklch(0.55 0.02 260)",
  cardBg: "oklch(0.95 0.005 260)",
  labelText: "oklch(0.40 0.02 260)",
  hue: 260,
};

export function ResourceTypeBadge({
  resourceType,
}: {
  resourceType: string;
}) {
  const colors = FHIR_RESOURCE_COLORS[resourceType] ?? DEFAULT_COLOR;

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: colors.cardBg,
        color: colors.labelText,
      }}
    >
      {resourceType}
    </span>
  );
}
