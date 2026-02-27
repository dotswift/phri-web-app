import { useMemo } from "react";
import { format } from "date-fns";
import { AnimatedList } from "@/components/shared/AnimatedList";
import { TimelineItemCard } from "./TimelineItemCard";
import type { TimelineItem } from "@/types/api";
import type { SortOption } from "@/hooks/useTimelineData";

interface ItemGroup {
  key: string;
  label: string;
  items: TimelineItem[];
}

function groupByMonth(items: TimelineItem[], asc: boolean): ItemGroup[] {
  const groups: ItemGroup[] = [];
  const undated: TimelineItem[] = [];
  const map = new Map<string, TimelineItem[]>();

  for (const item of items) {
    if (!item.dateRecorded) {
      undated.push(item);
      continue;
    }
    const d = new Date(item.dateRecorded);
    const key = format(d, "yyyy-MM");
    const existing = map.get(key);
    if (existing) {
      existing.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  const sortedKeys = [...map.keys()].sort((a, b) =>
    asc ? a.localeCompare(b) : b.localeCompare(a),
  );
  for (const key of sortedKeys) {
    const groupItems = map.get(key)!;
    const label = format(new Date(groupItems[0].dateRecorded!), "MMMM yyyy");
    groups.push({ key, label, items: groupItems });
  }

  if (undated.length > 0) {
    groups.push({ key: "unknown", label: "Unknown Date", items: undated });
  }

  return groups;
}

function groupByType(items: TimelineItem[]): ItemGroup[] {
  const map = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const existing = map.get(item.resourceType);
    if (existing) {
      existing.push(item);
    } else {
      map.set(item.resourceType, [item]);
    }
  }

  return [...map.keys()]
    .sort()
    .map((type) => ({
      key: `type-${type}`,
      label: type,
      items: map.get(type)!,
    }));
}

export function TimelineList({
  items,
  sortBy = "date-desc",
}: {
  items: TimelineItem[];
  sortBy?: SortOption;
}) {
  const groups = useMemo((): ItemGroup[] => {
    switch (sortBy) {
      case "date-asc":
        return groupByMonth(items, true);
      case "type":
        return groupByType(items);
      case "name-asc":
        return [{ key: "all", label: "A\u2013Z", items }];
      case "date-desc":
      default:
        return groupByMonth(items, false);
    }
  }, [items, sortBy]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="sticky top-0 z-10 mb-0.5 bg-background/80 py-1 text-sm font-semibold text-muted-foreground backdrop-blur-sm">
            {group.label}
          </h3>
          <AnimatedList className="space-y-1">
            {group.items.map((item) => (
              <TimelineItemCard key={item.id} item={item} />
            ))}
          </AnimatedList>
        </section>
      ))}
    </div>
  );
}
