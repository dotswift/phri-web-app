import { useMemo } from "react";
import { format } from "date-fns";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import type { TimelineItem } from "@/types/api";

const DEFAULT_COLOR = "oklch(0.55 0.02 260)";
const STRIP_HEIGHT = 48;
const BUCKET_COUNT = 25;
const BAR_WIDTH = 10;
const BAR_GAP = 2;

interface Slice {
  from: number;
  to: number;
  segments: { type: string; count: number }[];
  total: number;
}

export function TimelineDensityStrip({
  items,
}: {
  items: TimelineItem[];
}) {
  const datedItems = useMemo(
    () => items.filter((i) => i.dateRecorded),
    [items],
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

    // Initialize buckets
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

  // Single-day edge case
  if (datedItems.length === 0) return null;

  if (!extent || extent.range < 86_400_000) {
    const dateStr = datedItems[0].dateRecorded
      ? format(new Date(datedItems[0].dateRecorded), "MMMM d, yyyy")
      : "unknown date";
    return (
      <p className="py-1 text-center text-xs text-muted-foreground">
        All {datedItems.length} events on {dateStr}
      </p>
    );
  }

  const maxTotal = Math.max(...slices.map((s) => s.total), 1);
  const svgWidth = BUCKET_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

  return (
    <div>
      <svg
        viewBox={`0 0 ${svgWidth} ${STRIP_HEIGHT}`}
        className="w-full"
        style={{ height: STRIP_HEIGHT }}
        role="img"
        aria-label={`Timeline density showing ${datedItems.length} events`}
      >
        {slices.map((slice, i) => {
          const barHeight = (slice.total / maxTotal) * (STRIP_HEIGHT - 4);
          const x = i * (BAR_WIDTH + BAR_GAP);

          // Stack segments bottom-up
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
                rx={1.5}
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
          {format(new Date(extent.min), "MMM yyyy")}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(extent.max), "MMM yyyy")}
        </span>
      </div>
    </div>
  );
}
