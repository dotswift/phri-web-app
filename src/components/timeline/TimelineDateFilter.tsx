import { useState, useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  getYear,
  subMonths,
  subYears,
  differenceInDays,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface SmartPreset {
  key: string;
  label: string;
  from: Date | null;
  to: Date | null;
}

interface TimelineDateFilterProps {
  dateFrom: Date | null;
  dateTo: Date | null;
  dateExtent: [Date, Date] | null;
  onChange: (from: Date | null, to: Date | null) => void;
}

function buildSmartPresets(dateExtent: [Date, Date] | null): SmartPreset[] {
  const presets: SmartPreset[] = [
    { key: "all", label: "All Time", from: null, to: null },
  ];

  if (!dateExtent) {
    presets.push({ key: "custom", label: "Custom", from: null, to: null });
    return presets;
  }

  const [minDate, maxDate] = dateExtent;
  const now = new Date();

  // If most recent data is within a year, add recency presets
  if (differenceInDays(now, maxDate) < 365) {
    presets.push({
      key: "last-12m",
      label: "Last 12M",
      from: startOfDay(subYears(now, 1)),
      to: endOfDay(now),
    });
    presets.push({
      key: "last-6m",
      label: "Last 6M",
      from: startOfDay(subMonths(now, 6)),
      to: endOfDay(now),
    });
  }

  // Year-based presets
  const minYear = getYear(minDate);
  const maxYear = getYear(maxDate);
  const yearSpan = maxYear - minYear + 1;

  if (yearSpan <= 5) {
    // One preset per year, descending
    for (let y = maxYear; y >= minYear; y--) {
      const d = new Date(y, 0, 1);
      presets.push({
        key: `year-${y}`,
        label: String(y),
        from: startOfYear(d),
        to: endOfYear(d),
      });
    }
  } else {
    // Most recent 3 years individually
    for (let y = maxYear; y >= maxYear - 2; y--) {
      const d = new Date(y, 0, 1);
      presets.push({
        key: `year-${y}`,
        label: String(y),
        from: startOfYear(d),
        to: endOfYear(d),
      });
    }
    // Group the rest
    const groupEnd = maxYear - 3;
    if (groupEnd >= minYear) {
      presets.push({
        key: `years-${minYear}-${groupEnd}`,
        label: minYear === groupEnd ? String(minYear) : `${minYear}\u2013${groupEnd}`,
        from: startOfYear(new Date(minYear, 0, 1)),
        to: endOfYear(new Date(groupEnd, 0, 1)),
      });
    }
  }

  presets.push({ key: "custom", label: "Custom", from: null, to: null });
  return presets;
}

function detectActivePreset(
  presets: SmartPreset[],
  dateFrom: Date | null,
  dateTo: Date | null,
): string {
  if (!dateFrom && !dateTo) return "all";
  if (!dateFrom || !dateTo) return "custom";

  const fromTime = dateFrom.getTime();
  const toTime = dateTo.getTime();
  const DAY_MS = 86_400_000;

  for (const preset of presets) {
    if (preset.key === "all" || preset.key === "custom" || !preset.from || !preset.to) continue;
    if (
      Math.abs(preset.from.getTime() - fromTime) < DAY_MS &&
      Math.abs(preset.to.getTime() - toTime) < DAY_MS
    ) {
      return preset.key;
    }
  }
  return "custom";
}

export function TimelineDateFilter({
  dateFrom,
  dateTo,
  dateExtent,
  onChange,
}: TimelineDateFilterProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const presets = useMemo(() => buildSmartPresets(dateExtent), [dateExtent]);
  const activeKey = detectActivePreset(presets, dateFrom, dateTo);

  function handlePreset(preset: SmartPreset) {
    if (preset.key === "custom") {
      setPopoverOpen(true);
      return;
    }
    onChange(preset.from, preset.to);
  }

  const pillClass = (active: boolean) =>
    `inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "bg-foreground text-background"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    }`;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {presets.map((preset) =>
        preset.key === "custom" ? (
          <Popover
            key={preset.key}
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
          >
            <PopoverTrigger asChild>
              <button className={pillClass(activeKey === "custom")}>
                {preset.label}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-col gap-2 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  From
                </p>
                <Calendar
                  mode="single"
                  selected={dateFrom ?? undefined}
                  onSelect={(d) => {
                    if (d) onChange(startOfDay(d), dateTo);
                  }}
                />
                <p className="text-xs font-medium text-muted-foreground">To</p>
                <Calendar
                  mode="single"
                  selected={dateTo ?? undefined}
                  onSelect={(d) => {
                    if (d) onChange(dateFrom, endOfDay(d));
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange(null, null);
                    setPopoverOpen(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <button
            key={preset.key}
            onClick={() => handlePreset(preset)}
            className={pillClass(activeKey === preset.key)}
          >
            {preset.label}
          </button>
        ),
      )}
    </div>
  );
}
