import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceTypeBadge } from "@/components/shared/ResourceTypeBadge";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { FHIR_RESOURCE_COLORS } from "@/lib/colors";
import { useResourceDetail } from "@/context/ResourceDetailContext";
import type { TimelineResponse } from "@/types/api";

export function ConditionsPage() {
  const { openResourceDetail } = useResourceDetail();
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        resourceType: "Condition",
        limit: "50",
      });
      const result = await api.get<TimelineResponse>(
        `/api/timeline?${params.toString()}`,
      );
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Records", to: "/records" },
          { label: "Health Conditions" },
        ]}
      />
      <h1 className="text-2xl font-bold">Health Conditions</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No conditions found"
          description="No health conditions have been recorded."
        />
      ) : (
        <div className="space-y-2">
          {data.items.map((item) => {
            const color = FHIR_RESOURCE_COLORS[item.resourceType];
            return (
            <Card
              key={item.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              style={color ? { borderLeft: `3px solid ${color.badge}` } : undefined}
              onClick={() => openResourceDetail(item.id, "/api/timeline")}
            >
              <CardContent className="flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.displayText ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.source}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ResourceTypeBadge resourceType={item.resourceType} />
                  {item.dateRecorded && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.dateRecorded).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
