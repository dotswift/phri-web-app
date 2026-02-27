import { useMemo, useCallback } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartAccessibility } from "./ChartAccessibility";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import {
  useResourceDetail,
  endpointForResourceType,
} from "@/context/ResourceDetailContext";
import type { TimelineItem } from "@/types/api";

interface ChartDot {
  x: number;
  y: number;
  jitter: number;
  id: string;
  resourceType: string;
  label: string;
  dateLabel: string;
}

const DEFAULT_DOT_COLOR = "oklch(0.55 0.02 260)";

// Deterministic jitter based on id hash
function jitterFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return ((h & 0xff) / 255 - 0.5) * 0.6;
}

export function TimelineScatterChart({
  items,
}: {
  items: TimelineItem[];
}) {
  const { openResourceDetail } = useResourceDetail();

  // Only include items with dates
  const datedItems = useMemo(
    () => items.filter((i) => i.dateRecorded),
    [items],
  );

  // Active resource types (sorted for stable lane order)
  const laneTypes = useMemo(() => {
    const types = new Set<string>();
    for (const item of datedItems) types.add(item.resourceType);
    return [...types].sort();
  }, [datedItems]);

  // Build per-type datasets
  const datasets = useMemo(() => {
    const laneIndex = new Map<string, number>();
    laneTypes.forEach((t, i) => laneIndex.set(t, i));

    const byType = new Map<string, ChartDot[]>();
    for (const item of datedItems) {
      const y = laneIndex.get(item.resourceType) ?? 0;
      const dot: ChartDot = {
        x: new Date(item.dateRecorded!).getTime(),
        y: y + jitterFor(item.id),
        jitter: jitterFor(item.id),
        id: item.id,
        resourceType: item.resourceType,
        label: item.displayText ?? "Unknown",
        dateLabel: new Date(item.dateRecorded!).toLocaleDateString(),
      };
      const arr = byType.get(item.resourceType);
      if (arr) arr.push(dot);
      else byType.set(item.resourceType, [dot]);
    }
    return byType;
  }, [datedItems, laneTypes]);

  const handleDotClick = useCallback(
    (dot: ChartDot) => {
      openResourceDetail(dot.id, endpointForResourceType(dot.resourceType));
    },
    [openResourceDetail],
  );

  // Don't render when no data or when all items fall on the same day
  const timeRange = useMemo(() => {
    if (datedItems.length < 2) return 0;
    const times = datedItems.map((i) => new Date(i.dateRecorded!).getTime());
    return Math.max(...times) - Math.min(...times);
  }, [datedItems]);

  if (datedItems.length === 0 || timeRange < 86_400_000) return null;

  const insight = `Timeline scatter chart showing ${datedItems.length} events across ${laneTypes.length} resource types.`;

  return (
    <ChartAccessibility label="Timeline scatter chart" insight={insight}>
      <ResponsiveContainer
        width="100%"
        height={Math.max(180, laneTypes.length * 44 + 50)}
      >
        <ScatterChart
          accessibilityLayer={false}
          margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            type="number"
            dataKey="x"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts: number) =>
              new Date(ts).toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              })
            }
            tick={{ fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[-0.5, laneTypes.length - 0.5]}
            ticks={laneTypes.map((_, i) => i)}
            tickFormatter={(i: number) => laneTypes[i] ?? ""}
            tick={{ fontSize: 9 }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          {laneTypes.map((type) => {
            const color =
              FHIR_RESOURCE_COLORS[type]?.badge ?? DEFAULT_DOT_COLOR;
            return (
              <Scatter
                key={type}
                name={type}
                data={datasets.get(type) ?? []}
                fill={color}
                shape="circle"
                onClick={(data: { payload?: ChartDot }) => {
                  if (data?.payload) handleDotClick(data.payload);
                }}
                cursor="pointer"
              />
            );
          })}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartAccessibility>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDot }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border bg-popover p-2 text-xs shadow-md">
      <p className="font-medium">{d.label}</p>
      <p className="text-muted-foreground">{d.dateLabel}</p>
      <p
        className="mt-0.5 font-medium"
        style={{
          color: FHIR_RESOURCE_COLORS[d.resourceType]?.labelText,
        }}
      >
        {d.resourceType}
      </p>
    </div>
  );
}
