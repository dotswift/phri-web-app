import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Pill } from "lucide-react";
import { useResourceDetail } from "@/context/ResourceDetailContext";
import type { MedicationsResponse, MedicationItem } from "@/types/api";

export function MedicationsPage() {
  const [data, setData] = useState<MedicationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { openResourceDetail } = useResourceDetail();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMeds = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const result = await api.get<MedicationsResponse>(
        `/api/medications?${params.toString()}`,
      );
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load medications");
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch]);

  useEffect(() => {
    fetchMeds();
  }, [fetchMeds]);

  const isEmpty =
    data &&
    data.active.length === 0 &&
    data.other.length === 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Medications</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Label className="mb-1 text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="mb-1 text-xs">Search</Label>
          <Input
            placeholder="Search medications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Pill className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No medications found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No medications match the current filters.
          </p>
        </div>
      ) : (
        <>
          {data!.active.length > 0 && (
            <MedicationSection
              title="Active Medications"
              items={data!.active}
              onSelect={(id) => openResourceDetail(id, "/api/medications")}
            />
          )}
          {data!.other.length > 0 && (
            <MedicationSection
              title="Other Medications"
              items={data!.other}
              onSelect={(id) => openResourceDetail(id, "/api/medications")}
            />
          )}
        </>
      )}

    </div>
  );
}

function MedicationSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: MedicationItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((med) => (
          <div
            key={med.id}
            className="flex items-center justify-between rounded-md p-2 transition-colors cursor-pointer hover:bg-accent"
            onClick={() => onSelect(med.id)}
          >
            <div>
              <p className="text-sm font-medium">{med.name ?? "Unknown"}</p>
              {med.dosage && (
                <p className="text-xs text-muted-foreground">{med.dosage}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CitationBadge citation={med.citation} />
              <Badge
                variant={med.status === "active" ? "default" : "secondary"}
              >
                {med.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
