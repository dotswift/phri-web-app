import { useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { TimelineFilterBar } from "@/components/timeline/TimelineFilterBar";
import { TimelineDateFilter } from "@/components/timeline/TimelineDateFilter";
import { TimelineList } from "@/components/timeline/TimelineList";
import { TimelineDensityStrip } from "@/components/timeline/TimelineMiniStrip";
import { TimelineScatterChart } from "@/components/charts/TimelineScatterChart";
import { useTimelineData, type SortOption } from "@/hooks/useTimelineData";
import {
  useResourceDetail,
  endpointForResourceType,
} from "@/context/ResourceDetailContext";
import { Clock } from "lucide-react";

export function TimelinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openResourceDetail } = useResourceDetail();

  // Parse filter state from URL
  const resourceTypes = useMemo(() => {
    const raw = searchParams.get("resourceTypes");
    if (!raw) return new Set<string>();
    return new Set(raw.split(",").filter(Boolean));
  }, [searchParams]);

  const years = useMemo(() => {
    const raw = searchParams.get("years");
    if (!raw) return new Set<number>();
    return new Set(raw.split(",").map(Number).filter((n) => !isNaN(n)));
  }, [searchParams]);

  const sortBy = useMemo((): SortOption => {
    const raw = searchParams.get("sortBy");
    if (raw === "date-asc" || raw === "type" || raw === "name-asc") return raw;
    return "date-desc";
  }, [searchParams]);

  const filters = useMemo(
    () => ({ resourceTypes, years, sortBy }),
    [resourceTypes, years, sortBy],
  );

  const { allItems, filteredItems, loading, availableYears, resourceTypeCounts } =
    useTimelineData(filters);

  // Deep-link: ?resourceId=abc opens modal then cleans URL
  useEffect(() => {
    const id = searchParams.get("resourceId");
    const type = searchParams.get("resourceType") ?? "";
    if (id) {
      openResourceDetail(id, endpointForResourceType(type));
      const next = new URLSearchParams(searchParams);
      next.delete("resourceId");
      next.delete("resourceType");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResourceTypesChange = useCallback(
    (next: Set<string>) => {
      const params = new URLSearchParams(searchParams);
      if (next.size === 0) {
        params.delete("resourceTypes");
      } else {
        params.set("resourceTypes", [...next].join(","));
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handleYearsChange = useCallback(
    (next: Set<number>) => {
      const params = new URLSearchParams(searchParams);
      if (next.size === 0) {
        params.delete("years");
      } else {
        params.set("years", [...next].join(","));
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value === "date-desc") {
        params.delete("sortBy");
      } else {
        params.set("sortBy", value);
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  return (
    <div className="min-w-0 space-y-3">
      {/* Header */}
      <h1 className="text-2xl font-bold">Timeline</h1>

      {/* Filter bars */}
      {!loading && allItems.length > 0 && (
        <div className="space-y-2">
          <TimelineFilterBar
            resourceTypeCounts={resourceTypeCounts}
            selected={resourceTypes}
            onChange={handleResourceTypesChange}
          />
          <TimelineDateFilter
            availableYears={availableYears}
            selectedYears={years}
            onChange={handleYearsChange}
          />
        </div>
      )}

      {/* Toolbar: event count + sort */}
      {!loading && allItems.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filteredItems.length === allItems.length
              ? `${allItems.length} events`
              : `${filteredItems.length} of ${allItems.length} events`}
          </p>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (Newest)</SelectItem>
              <SelectItem value="date-asc">Date (Oldest)</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="name-asc">Name (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No records found"
          description={
            allItems.length > 0
              ? "Try adjusting your filters or date range."
              : "No timeline data available yet."
          }
        />
      ) : (
        <>
          {/* Desktop: scatter chart + density strip */}
          <div className="hidden md:block space-y-2">
            <TimelineScatterChart items={filteredItems} />
            <TimelineDensityStrip items={filteredItems} />
          </div>

          {/* List */}
          <TimelineList items={filteredItems} sortBy={sortBy} />
        </>
      )}
    </div>
  );
}
