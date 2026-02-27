import { useState } from "react";
import { subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type Preset = "all" | "1y" | "6m" | "90d" | "30d" | "custom";

interface TimelineDateFilterProps {
  dateFrom: Date | null;
  dateTo: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "all", label: "All Time" },
  { key: "1y", label: "1Y" },
  { key: "6m", label: "6M" },
  { key: "90d", label: "90D" },
  { key: "30d", label: "30D" },
  { key: "custom", label: "Custom" },
];

function presetRange(key: Preset): [Date | null, Date | null] {
  const now = new Date();
  switch (key) {
    case "all":
      return [null, null];
    case "1y":
      return [startOfDay(subYears(now, 1)), endOfDay(now)];
    case "6m":
      return [startOfDay(subMonths(now, 6)), endOfDay(now)];
    case "90d":
      return [startOfDay(subDays(now, 90)), endOfDay(now)];
    case "30d":
      return [startOfDay(subDays(now, 30)), endOfDay(now)];
    default:
      return [null, null];
  }
}

function detectPreset(from: Date | null, to: Date | null): Preset {
  if (!from && !to) return "all";
  if (!from || !to) return "custom";

  const now = new Date();
  const diffMs = now.getTime() - from.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Allow 1 day tolerance for preset detection
  if (diffDays >= 29 && diffDays <= 31) return "30d";
  if (diffDays >= 89 && diffDays <= 91) return "90d";
  if (diffDays >= 179 && diffDays <= 183) return "6m";
  if (diffDays >= 364 && diffDays <= 366) return "1y";

  return "custom";
}

export function TimelineDateFilter({
  dateFrom,
  dateTo,
  onChange,
}: TimelineDateFilterProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const activePreset = detectPreset(dateFrom, dateTo);

  function handlePreset(key: Preset) {
    if (key === "custom") {
      setPopoverOpen(true);
      return;
    }
    const [from, to] = presetRange(key);
    onChange(from, to);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {PRESETS.map(({ key, label }) =>
        key === "custom" ? (
          <Popover key={key} open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activePreset === "custom"
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {label}
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
            key={key}
            onClick={() => handlePreset(key)}
            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activePreset === key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ),
      )}
    </div>
  );
}
