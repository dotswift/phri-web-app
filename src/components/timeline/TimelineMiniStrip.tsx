import { useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getYear,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  getQuarter,
} from "date-fns";
import { ChartAccessibility } from "@/components/charts/ChartAccessibility";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import type { TimelineItem } from "@/types/api";

const DEFAULT_COLOR = "oklch(0.55 0.02 260)";

interface BucketData {
  label: string;
  from: Date;
  to: Date;
  total: number;
  [type: string]: string | number | Date;
}

export function TimelineMiniStrip({
  items,
  onDateRangeSelect,
}: {
  items: TimelineItem[];
  onDateRangeSelect?: (from: Date | null, to: Date | null) => void;
}) {
  const datedItems = useMemo(
    () => items.filter((i) => i.dateRecorded),
    [items],
  );

  const resourceTypes = useMemo(() => {
    const types = new Set<string>();
    for (const item of datedItems) types.add(item.resourceType);
    return [...types].sort();
  }, [datedItems]);

  const { buckets, useQuarters } = useMemo(() => {
    if (datedItems.length === 0) return { buckets: [], useQuarters: false };

    const times = datedItems.map((i) => new Date(i.dateRecorded!));
    const minYear = getYear(
      times.reduce((a, b) => (a < b ? a : b)),
    );
    const maxYear = getYear(
      times.reduce((a, b) => (a > b ? a : b)),
    );
    const yearSpan = maxYear - minYear + 1;
    const useQ = yearSpan <= 3;

    const bucketMap = new Map<string, BucketData>();

    if (useQ) {
      // Quarter buckets
      for (let y = minYear; y <= maxYear; y++) {
        for (let q = 1; q <= 4; q++) {
          const d = new Date(y, (q - 1) * 3, 1);
          const key = `Q${q} ${y}`;
          const bucket: BucketData = {
            label: key,
            from: startOfQuarter(d),
            to: endOfQuarter(d),
            total: 0,
          };
          bucketMap.set(key, bucket);
        }
      }

      for (const item of datedItems) {
        const d = new Date(item.dateRecorded!);
        const key = `Q${getQuarter(d)} ${getYear(d)}`;
        const bucket = bucketMap.get(key);
        if (bucket) {
          bucket.total++;
          bucket[item.resourceType] =
            ((bucket[item.resourceType] as number) || 0) + 1;
        }
      }
    } else {
      // Year buckets
      for (let y = minYear; y <= maxYear; y++) {
        const d = new Date(y, 0, 1);
        const key = String(y);
        const bucket: BucketData = {
          label: key,
          from: startOfYear(d),
          to: endOfYear(d),
          total: 0,
        };
        bucketMap.set(key, bucket);
      }

      for (const item of datedItems) {
        const d = new Date(item.dateRecorded!);
        const key = String(getYear(d));
        const bucket = bucketMap.get(key);
        if (bucket) {
          bucket.total++;
          bucket[item.resourceType] =
            ((bucket[item.resourceType] as number) || 0) + 1;
        }
      }
    }

    // Filter out empty buckets
    const result = [...bucketMap.values()].filter((b) => b.total > 0);
    return { buckets: result, useQuarters: useQ };
  }, [datedItems]);

  const handleBarClick = useCallback(
    (data: BucketData) => {
      if (onDateRangeSelect && data) {
        onDateRangeSelect(data.from, data.to);
      }
    },
    [onDateRangeSelect],
  );

  if (datedItems.length === 0 || buckets.length === 0) return null;

  const insight = `Timeline density showing ${datedItems.length} events across ${buckets.length} ${useQuarters ? "quarters" : "years"}.`;

  return (
    <ChartAccessibility label="Timeline density chart" insight={insight}>
      <p className="mb-2 text-center text-xs text-muted-foreground">
        Tap a bar to filter by that period
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={buckets}
          margin={{ left: -10, right: 10, top: 5, bottom: 5 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={useQuarters ? -45 : 0}
            textAnchor={useQuarters ? "end" : "middle"}
            height={useQuarters ? 45 : 25}
          />
          <YAxis tick={{ fontSize: 10 }} width={30} allowDecimals={false} />
          <Tooltip
            content={<DensityTooltip resourceTypes={resourceTypes} />}
          />
          {resourceTypes.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="stack"
              fill={FHIR_RESOURCE_COLORS[type]?.badge ?? DEFAULT_COLOR}
              cursor="pointer"
              onClick={(data: { payload?: BucketData }) => {
                if (data?.payload) handleBarClick(data.payload);
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {resourceTypes.map((type) => (
          <div key={type} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  FHIR_RESOURCE_COLORS[type]?.badge ?? DEFAULT_COLOR,
              }}
            />
            <span className="text-[10px] text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>
    </ChartAccessibility>
  );
}

function DensityTooltip({
  active,
  payload,
  label,
  resourceTypes,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
  resourceTypes: string[];
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);

  return (
    <div className="rounded border bg-popover p-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {resourceTypes.map((type) => {
        const entry = payload.find((p) => p.dataKey === type);
        if (!entry || !entry.value) return null;
        return (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{type}</span>
            <span className="ml-auto font-medium">{entry.value}</span>
          </div>
        );
      })}
      <div className="mt-1 border-t pt-1 font-medium">Total: {total}</div>
    </div>
  );
}
