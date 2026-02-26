import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CitationBadge } from "@/components/shared/CitationBadge";
import { DetailDrawer } from "@/components/shared/DetailDrawer";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Syringe } from "lucide-react";
import { ImmunizationTimeline } from "@/components/charts/ImmunizationTimeline";
import { AnimatedList } from "@/components/shared/AnimatedList";
import type { ImmunizationsResponse, ImmunizationItem } from "@/types/api";

export function ImmunizationsPage() {
  const [data, setData] = useState<ImmunizationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchImmunizations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const result = await api.get<ImmunizationsResponse>(
        `/api/immunizations?${params.toString()}`,
      );
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load immunizations");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchImmunizations();
  }, [fetchImmunizations]);

  // Group by year
  const grouped = useMemo(() => {
    if (!data) return {};
    const groups: Record<string, ImmunizationItem[]> = {};
    for (const item of data.items) {
      const year = item.dateRecorded
        ? new Date(item.dateRecorded).getFullYear().toString()
        : "Unknown";
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    }
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)),
    );
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Immunizations</h1>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.total} total
          </span>
        )}
      </div>

      <div className="max-w-sm">
        <Label className="mb-1 text-xs">Search</Label>
        <Input
          placeholder="Search immunizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Syringe}
          title="No immunizations found"
          description="No immunization records match your search."
        />
      ) : (
        <div className="space-y-4">
          {/* Immunization timeline chart */}
          {data.items.some((item) => item.dateRecorded) && (
            <Card className="p-4">
              <ImmunizationTimeline
                items={data.items
                  .filter((item): item is ImmunizationItem & { dateRecorded: string; name: string } =>
                    item.dateRecorded !== null && item.name !== null
                  )
                  .map((item) => ({
                    name: item.name,
                    date: item.dateRecorded,
                    status: item.status,
                  }))}
              />
            </Card>
          )}

          <AnimatedList className="space-y-4">
          {Object.entries(grouped).map(([year, items]) => (
            <Card key={year}>
              <CardHeader>
                <CardTitle className="text-lg">{year}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-accent"
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.source}
                        {item.dateRecorded &&
                          ` — ${new Date(item.dateRecorded).toLocaleDateString()}`}
                      </p>
                    </div>
                    <CitationBadge citation={item.citation} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          </AnimatedList>
        </div>
      )}

      <DetailDrawer
        resourceId={selectedId}
        endpoint="/api/immunizations"
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
