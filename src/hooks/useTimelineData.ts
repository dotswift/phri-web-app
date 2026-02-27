import { useState, useEffect, useRef, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { TimelineItem, TimelineResponse } from "@/types/api";

export interface TimelineFilters {
  resourceTypes: Set<string>;
  dateFrom: Date | null;
  dateTo: Date | null;
}

export interface TimelineData {
  allItems: TimelineItem[];
  filteredItems: TimelineItem[];
  loading: boolean;
  dateExtent: [Date, Date] | null;
  resourceTypeCounts: Map<string, number>;
}

export function useTimelineData(filters: TimelineFilters): TimelineData {
  const [allItems, setAllItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchAll() {
      setLoading(true);
      try {
        const first = await api.get<TimelineResponse>(
          "/api/timeline?page=1&limit=100",
        );
        let items = first.items;

        if (first.pagination.totalPages > 1) {
          const pages = Array.from(
            { length: first.pagination.totalPages - 1 },
            (_, i) => i + 2,
          );
          const rest = await Promise.all(
            pages.map((p) =>
              api.get<TimelineResponse>(
                `/api/timeline?page=${p}&limit=100`,
              ),
            ),
          );
          for (const r of rest) {
            items = items.concat(r.items);
          }
        }

        // Dedupe by id
        const seen = new Set<string>();
        const deduped: TimelineItem[] = [];
        for (const item of items) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            deduped.push(item);
          }
        }

        setAllItems(deduped);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load timeline",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const resourceTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of allItems) {
      counts.set(item.resourceType, (counts.get(item.resourceType) ?? 0) + 1);
    }
    return counts;
  }, [allItems]);

  const dateExtent = useMemo<[Date, Date] | null>(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const item of allItems) {
      if (item.dateRecorded) {
        const t = new Date(item.dateRecorded).getTime();
        if (t < min) min = t;
        if (t > max) max = t;
      }
    }
    if (min === Infinity) return null;
    return [new Date(min), new Date(max)];
  }, [allItems]);

  const filteredItems = useMemo(() => {
    let items = allItems;

    if (filters.resourceTypes.size > 0) {
      items = items.filter((item) =>
        filters.resourceTypes.has(item.resourceType),
      );
    }

    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom?.getTime() ?? -Infinity;
      const to = filters.dateTo?.getTime() ?? Infinity;
      items = items.filter((item) => {
        if (!item.dateRecorded) return false;
        const t = new Date(item.dateRecorded).getTime();
        return t >= from && t <= to;
      });
    }

    return items;
  }, [allItems, filters.resourceTypes, filters.dateFrom, filters.dateTo]);

  return { allItems, filteredItems, loading, dateExtent, resourceTypeCounts };
}
