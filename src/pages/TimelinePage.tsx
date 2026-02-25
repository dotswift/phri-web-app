import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CitationBadge } from "@/components/shared/CitationBadge";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { TimelineResponse } from "@/types/api";

const RESOURCE_TYPES = [
  "All",
  "Condition",
  "DiagnosticReport",
  "Encounter",
  "Immunization",
  "Observation",
  "Procedure",
  "MedicationRequest",
  "AllergyIntolerance",
];

export function TimelinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const resourceType = searchParams.get("resourceType") ?? "All";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (resourceType !== "All") params.set("resourceType", resourceType);
    if (dateFrom) params.set("dateFrom", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      params.set("dateTo", end.toISOString());
    }
    params.set("page", String(page));
    params.set("limit", "20");

    try {
      const result = await api.get<TimelineResponse>(
        `/api/timeline?${params.toString()}`,
      );
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, [resourceType, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "All") {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Timeline</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Label className="mb-1 text-xs">Resource Type</Label>
          <Select
            value={resourceType}
            onValueChange={(v) => updateParam("resourceType", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 text-xs">From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => updateParam("dateFrom", e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label className="mb-1 text-xs">To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => updateParam("dateTo", e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No records found"
          description="Try adjusting your filters or date range."
        />
      ) : (
        <>
          <div className="space-y-2">
            {data.items.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => setSelectedId(item.id)}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.displayText ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.source}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CitationBadge citation={item.citation} />
                    <Badge variant="outline" className="text-xs">
                      {item.resourceType}
                    </Badge>
                    {item.dateRecorded && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.dateRecorded).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data.pagination.page} of {data.pagination.totalPages} (
              {data.pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam("page", String(page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => updateParam("page", String(page + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <DetailDrawer
        resourceId={selectedId}
        endpoint="/api/timeline"
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
