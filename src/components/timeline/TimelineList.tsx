import { useMemo } from "react";
import { format } from "date-fns";
import { AnimatedList } from "@/components/shared/AnimatedList";
import { TimelineItemCard } from "./TimelineItemCard";
import type { TimelineItem } from "@/types/api";

interface MonthGroup {
  key: string;
  label: string;
  items: TimelineItem[];
}

export function TimelineList({ items }: { items: TimelineItem[] }) {
  const groups = useMemo(() => {
    const dated: MonthGroup[] = [];
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

    // Sort month keys descending (most recent first)
    const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));
    for (const key of sortedKeys) {
      const groupItems = map.get(key)!;
      const label = format(new Date(groupItems[0].dateRecorded!), "MMMM yyyy");
      dated.push({ key, label, items: groupItems });
    }

    if (undated.length > 0) {
      dated.push({ key: "unknown", label: "Unknown Date", items: undated });
    }

    return dated;
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="sticky top-0 z-10 mb-2 bg-background/80 py-1 text-sm font-semibold text-muted-foreground backdrop-blur-sm">
            {group.label}
          </h3>
          <AnimatedList className="space-y-2">
            {group.items.map((item) => (
              <TimelineItemCard key={item.id} item={item} />
            ))}
          </AnimatedList>
        </section>
      ))}
    </div>
  );
}
