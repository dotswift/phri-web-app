interface TimelineDateFilterProps {
  availableYears: number[];
  selectedYears: Set<number>;
  onChange: (years: Set<number>) => void;
}

export function TimelineDateFilter({
  availableYears,
  selectedYears,
  onChange,
}: TimelineDateFilterProps) {
  const allSelected = selectedYears.size === 0;

  const pillClass = (active: boolean) =>
    `inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "bg-foreground text-background"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    }`;

  function toggleYear(year: number) {
    const next = new Set(selectedYears);
    if (next.has(year)) {
      next.delete(year);
    } else {
      next.add(year);
    }
    onChange(next);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onChange(new Set())}
        className={pillClass(allSelected)}
      >
        All Time
      </button>
      {availableYears.map((year) => (
        <button
          key={year}
          onClick={() => toggleYear(year)}
          className={pillClass(!allSelected && selectedYears.has(year))}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
