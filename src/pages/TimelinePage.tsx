import { useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { TimelineFilterBar } from "@/components/timeline/TimelineFilterBar";
import { TimelineDateFilter } from "@/components/timeline/TimelineDateFilter";
import { TimelineList } from "@/components/timeline/TimelineList";
import { TimelineMiniStrip } from "@/components/timeline/TimelineMiniStrip";
import { TimelineScatterChart } from "@/components/charts/TimelineScatterChart";
import { useTimelineData } from "@/hooks/useTimelineData";
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

  const dateFrom = useMemo(() => {
    const raw = searchParams.get("dateFrom");
    return raw ? new Date(raw) : null;
  }, [searchParams]);

  const dateTo = useMemo(() => {
    const raw = searchParams.get("dateTo");
    return raw ? new Date(raw) : null;
  }, [searchParams]);

  const filters = useMemo(
    () => ({ resourceTypes, dateFrom, dateTo }),
    [resourceTypes, dateFrom, dateTo],
  );

  const { allItems, filteredItems, loading, resourceTypeCounts } =
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

  const handleDateChange = useCallback(
    (from: Date | null, to: Date | null) => {
      const params = new URLSearchParams(searchParams);
      if (from) {
        params.set("dateFrom", from.toISOString());
      } else {
        params.delete("dateFrom");
      }
      if (to) {
        params.set("dateTo", to.toISOString());
      } else {
        params.delete("dateTo");
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const hasData = !loading && filteredItems.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Timeline</h1>
        {!loading && (
          <p className="text-sm text-muted-foreground">
            {filteredItems.length === allItems.length
              ? `${allItems.length} events`
              : `${filteredItems.length} of ${allItems.length} events`}
          </p>
        )}
      </div>

      {/* Filter bars */}
      {!loading && allItems.length > 0 && (
        <div className="space-y-2">
          <TimelineFilterBar
            resourceTypeCounts={resourceTypeCounts}
            selected={resourceTypes}
            onChange={handleResourceTypesChange}
          />
          <TimelineDateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={handleDateChange}
          />
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
          {/* Desktop: chart always visible above list */}
          <div className="hidden md:block">
            <TimelineScatterChart
              items={filteredItems}
              onBrushChange={handleDateChange}
            />
          </div>

          {/* Mobile: tabs for List / Visual */}
          <div className="md:hidden">
            <Tabs defaultValue="list">
              <TabsList>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="visual">Visual</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <TimelineList items={filteredItems} />
              </TabsContent>
              <TabsContent value="visual">
                <TimelineMiniStrip items={filteredItems} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop list (always visible) */}
          {hasData && (
            <div className="hidden md:block">
              <TimelineList items={filteredItems} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
