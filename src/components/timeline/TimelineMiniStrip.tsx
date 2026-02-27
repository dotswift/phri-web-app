import { useMemo } from "react";
import { format } from "date-fns";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import type { TimelineItem } from "@/types/api";

const STRIP_HEIGHT = 120;
const DOT_R = 3;
const LABEL_X = 40;
const DEFAULT_COLOR = "oklch(0.55 0.02 260)";

export function TimelineMiniStrip({ items }: { items: TimelineItem[] }) {
  const datedItems = useMemo(
    () =>
      items
        .filter((i) => i.dateRecorded)
        .sort(
          (a, b) =>
            new Date(b.dateRecorded!).getTime() -
            new Date(a.dateRecorded!).getTime(),
        ),
    [items],
  );

  const extent = useMemo<[number, number] | null>(() => {
    if (datedItems.length === 0) return null;
    const times = datedItems.map((i) => new Date(i.dateRecorded!).getTime());
    return [Math.min(...times), Math.max(...times)];
  }, [datedItems]);

  // Month labels at evenly spaced intervals
  const monthLabels = useMemo(() => {
    if (!extent) return [];
    const [min, max] = extent;
    const range = max - min;
    if (range === 0) return [];

    const labels: { y: number; label: string }[] = [];
    const seen = new Set<string>();

    for (const item of datedItems) {
      const t = new Date(item.dateRecorded!).getTime();
      const key = format(new Date(item.dateRecorded!), "MMM yyyy");
      if (seen.has(key)) continue;
      seen.add(key);
      const y = ((max - t) / range) * STRIP_HEIGHT;
      labels.push({ y, label: key });
    }

    // Only show ~4 labels to avoid crowding
    if (labels.length <= 4) return labels;
    const step = Math.ceil(labels.length / 4);
    return labels.filter((_, i) => i % step === 0);
  }, [extent, datedItems]);

  if (!extent || datedItems.length === 0) return null;

  const [min, max] = extent;
  const range = max - min || 1;

  return (
    <div className="flex justify-center py-2">
      <svg
        width={LABEL_X + 20}
        height={STRIP_HEIGHT + 10}
        viewBox={`0 0 ${LABEL_X + 20} ${STRIP_HEIGHT + 10}`}
        role="img"
        aria-label={`Visual timeline with ${datedItems.length} events`}
      >
        {/* Vertical line */}
        <line
          x1={LABEL_X}
          y1={4}
          x2={LABEL_X}
          y2={STRIP_HEIGHT + 4}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={1}
        />

        {/* Month labels */}
        {monthLabels.map((m) => (
          <text
            key={m.label}
            x={LABEL_X - 6}
            y={m.y + 7}
            textAnchor="end"
            fontSize={8}
            fill="currentColor"
            opacity={0.45}
          >
            {m.label}
          </text>
        ))}

        {/* Dots */}
        {datedItems.map((item) => {
          const t = new Date(item.dateRecorded!).getTime();
          const y = ((max - t) / range) * STRIP_HEIGHT + 4;
          const color =
            FHIR_RESOURCE_COLORS[item.resourceType]?.badge ?? DEFAULT_COLOR;
          return (
            <circle
              key={item.id}
              cx={LABEL_X}
              cy={y}
              r={DOT_R}
              fill={color}
              opacity={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
}
