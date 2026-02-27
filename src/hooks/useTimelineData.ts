import { useState, useEffect, useRef, useMemo } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { TimelineItem, TimelineResponse } from "@/types/api";

export type SortOption = "date-desc" | "date-asc" | "type" | "name-asc";

export interface TimelineFilters {
  resourceTypes: Set<string>;
  years: Set<number>;
  sortBy: SortOption;
}

export interface TimelineData {
  allItems: TimelineItem[];
  filteredItems: TimelineItem[];
  loading: boolean;
  availableYears: number[];
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

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const item of allItems) {
      if (item.dateRecorded) {
        years.add(new Date(item.dateRecorded).getFullYear());
      }
    }
    return [...years].sort((a, b) => b - a);
  }, [allItems]);

  const filteredItems = useMemo(() => {
    let items = allItems;

    if (filters.resourceTypes.size > 0) {
      items = items.filter((item) =>
        filters.resourceTypes.has(item.resourceType),
      );
    }

    if (filters.years.size > 0) {
      items = items.filter((item) => {
        if (!item.dateRecorded) return false;
        return filters.years.has(new Date(item.dateRecorded).getFullYear());
      });
    }

    return items;
  }, [allItems, filters.resourceTypes, filters.years]);

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];
    const dateVal = (d: string | null) =>
      d ? new Date(d).getTime() : -Infinity;

    switch (filters.sortBy) {
      case "date-asc":
        return items.sort((a, b) => {
          const da = dateVal(a.dateRecorded);
          const db = dateVal(b.dateRecorded);
          if (da === -Infinity && db === -Infinity) return 0;
          if (da === -Infinity) return 1;
          if (db === -Infinity) return -1;
          return da - db;
        });
      case "type":
        return items.sort((a, b) => {
          const tc = a.resourceType.localeCompare(b.resourceType);
          if (tc !== 0) return tc;
          return dateVal(b.dateRecorded) - dateVal(a.dateRecorded);
        });
      case "name-asc":
        return items.sort((a, b) =>
          (a.displayText ?? "").localeCompare(b.displayText ?? ""),
        );
      case "date-desc":
      default:
        return items.sort((a, b) => {
          const da = dateVal(a.dateRecorded);
          const db = dateVal(b.dateRecorded);
          if (da === -Infinity && db === -Infinity) return 0;
          if (da === -Infinity) return 1;
          if (db === -Infinity) return -1;
          return db - da;
        });
    }
  }, [filteredItems, filters.sortBy]);

  return {
    allItems,
    filteredItems: sortedItems,
    loading,
    availableYears,
    resourceTypeCounts,
  };
}
