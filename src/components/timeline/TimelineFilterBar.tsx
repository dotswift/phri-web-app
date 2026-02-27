import { FHIR_RESOURCE_COLORS } from "@/lib/colors";

interface TimelineFilterBarProps {
  resourceTypeCounts: Map<string, number>;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export function TimelineFilterBar({
  resourceTypeCounts,
  selected,
  onChange,
}: TimelineFilterBarProps) {
  const types = [...resourceTypeCounts.keys()].sort();
  const allSelected = selected.size === 0;

  function toggleAll() {
    onChange(new Set());
  }

  function toggleType(type: string) {
    const next = new Set(selected);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onChange(next);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={toggleAll}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          allSelected
            ? "bg-foreground text-background"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        All
      </button>
      {types.map((type) => {
        const count = resourceTypeCounts.get(type) ?? 0;
        const active = selected.has(type);
        const color = FHIR_RESOURCE_COLORS[type];

        return (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            style={
              active && color
                ? { backgroundColor: color.badge }
                : undefined
            }
          >
            {type}
            <span
              className={`tabular-nums ${active ? "opacity-80" : "opacity-60"}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
