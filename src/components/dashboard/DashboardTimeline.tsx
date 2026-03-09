import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTimelineData } from "@/hooks/useTimelineData";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";

const RESOURCE_LABELS: Record<string, string> = {
  Condition: "Conditions",
  MedicationRequest: "Medications",
  Observation: "Labs",
  Encounter: "Visits",
  Immunization: "Immunizations",
  Procedure: "Procedures",
  DiagnosticReport: "Reports",
  AllergyIntolerance: "Allergies",
};

const DEFAULT_FILTERS = {
  resourceTypes: new Set<string>(),
  years: new Set<number>(),
  sortBy: "date-desc" as const,
};

const DEFAULT_COLOR = "oklch(0.55 0.02 260)";
const BUCKET_COUNT = 60;
const BAR_WIDTH = 16;
const BAR_GAP = 3;
const STRIP_HEIGHT = 48;

interface Slice {
  from: number;
  to: number;
  segments: { type: string; count: number }[];
  total: number;
}

export function DashboardTimeline() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { allItems, loading, resourceTypeCounts } =
    useTimelineData(DEFAULT_FILTERS);

  const datedItems = useMemo(
    () => allItems.filter((i) => i.dateRecorded),
    [allItems],
  );

  const extent = useMemo(() => {
    if (datedItems.length === 0) return null;
    const times = datedItems.map((i) => new Date(i.dateRecorded!).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    return { min, max, range: max - min };
  }, [datedItems]);

  const slices = useMemo((): Slice[] => {
    if (!extent || extent.range < 86_400_000) return [];

    const { min, range } = extent;
    const sliceWidth = range / BUCKET_COUNT;

    const buckets: Map<string, number>[] = Array.from(
      { length: BUCKET_COUNT },
      () => new Map(),
    );
    const totals = new Array(BUCKET_COUNT).fill(0) as number[];

    for (const item of datedItems) {
      const t = new Date(item.dateRecorded!).getTime();
      let idx = Math.floor((t - min) / sliceWidth);
      if (idx >= BUCKET_COUNT) idx = BUCKET_COUNT - 1;
      const map = buckets[idx];
      map.set(item.resourceType, (map.get(item.resourceType) ?? 0) + 1);
      totals[idx]++;
    }

    return buckets.map((map, i) => {
      const segments: { type: string; count: number }[] = [];
      for (const [type, count] of [...map.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      )) {
        segments.push({ type, count });
      }
      return {
        from: min + i * sliceWidth,
        to: min + (i + 1) * sliceWidth,
        segments,
        total: totals[i],
      };
    });
  }, [datedItems, extent]);

  // Most recent is on the left — no scroll needed on mount

  if (loading) {
    return <Skeleton className="h-20 w-full shrink-0" />;
  }

  if (datedItems.length === 0) return null;

  // Build color key from resource types that actually exist
  const colorKey = [...resourceTypeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => ({
      type,
      label: RESOURCE_LABELS[type] || type,
      color: FHIR_RESOURCE_COLORS[type]?.badge ?? DEFAULT_COLOR,
    }));

  // Single-day edge case
  if (!extent || extent.range < 86_400_000) {
    const dateStr = datedItems[0].dateRecorded
      ? format(new Date(datedItems[0].dateRecorded), "MMMM d, yyyy")
      : "unknown date";
    return (
      <div className="shrink-0 rounded-2xl border bg-card p-4">
        <div
          onClick={() => navigate("/timeline")}
          className="mb-2 flex cursor-pointer items-center gap-1"
        >
          <h2 className="text-sm font-semibold">Your Timeline</h2>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="py-1 text-center text-xs text-muted-foreground">
          All {datedItems.length} events on {dateStr}
        </p>
      </div>
    );
  }

  // Reverse so most recent is on the left
  const reversedSlices = [...slices].reverse();
  const maxTotal = Math.max(...slices.map((s) => s.total), 1);
  const svgWidth = BUCKET_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

  // Midpoint date for center label
  const midDate = new Date((extent.min + extent.max) / 2);

  return (
    <div className="shrink-0 rounded-2xl border bg-card p-4">
      <div
        onClick={() => navigate("/timeline")}
        className="mb-2 flex cursor-pointer items-center gap-1"
      >
        <h2 className="text-sm font-semibold">Your Timeline</h2>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div
        ref={scrollRef}
        onClick={() => navigate("/timeline")}
        className="cursor-pointer overflow-x-auto"
      >
        <div style={{ width: svgWidth }}>
          <svg
            width={svgWidth}
            height={STRIP_HEIGHT}
            viewBox={`0 0 ${svgWidth} ${STRIP_HEIGHT}`}
            role="img"
            aria-label={`Timeline density showing ${datedItems.length} events`}
          >
            {reversedSlices.map((slice, i) => {
              const barHeight = (slice.total / maxTotal) * (STRIP_HEIGHT - 4);
              const x = i * (BAR_WIDTH + BAR_GAP);

              let yOffset = STRIP_HEIGHT - 2;
              const rects: React.ReactNode[] = [];
              for (const seg of slice.segments) {
                const segHeight = (seg.count / slice.total) * barHeight;
                yOffset -= segHeight;
                rects.push(
                  <rect
                    key={seg.type}
                    x={x}
                    y={yOffset}
                    width={BAR_WIDTH}
                    height={segHeight}
                    rx={2}
                    fill={
                      FHIR_RESOURCE_COLORS[seg.type]?.badge ?? DEFAULT_COLOR
                    }
                  />,
                );
              }

              return (
                <g key={i} className="opacity-80">
                  {rects}
                </g>
              );
            })}
          </svg>
          <div className="flex justify-between px-0.5">
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(extent.max), "MMM yyyy")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {format(midDate, "MMM yyyy")}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(extent.min), "MMM yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Color key */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {colorKey.map(({ type, label, color }) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
              title={label}
            />
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
