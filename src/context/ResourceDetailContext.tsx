import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FhirResourceDetail } from "@/components/shared/FhirResourceDetail";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { TimelineDetail } from "@/types/api";

interface ResourceDetailState {
  openResourceDetail: (id: string, endpoint: string) => void;
}

const ResourceDetailContext = createContext<ResourceDetailState | null>(null);

export function endpointForResourceType(resourceType: string): string {
  switch (resourceType) {
    case "MedicationRequest":
      return "/api/medications";
    case "Immunization":
      return "/api/immunizations";
    default:
      return "/api/timeline";
  }
}

export function ResourceDetailProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<TimelineDetail | null>(null);

  const openResourceDetail = useCallback((id: string, endpoint: string) => {
    setOpen(true);
    setDetail(null);
    setLoading(true);
    api
      .get<TimelineDetail>(`${endpoint}/${id}`)
      .then(setDetail)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load resource");
        setOpen(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ResourceDetailContext.Provider value={{ openResourceDetail }}>
      {children}
      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resource Detail</DialogTitle>
            <DialogDescription className="sr-only">
              FHIR resource details
            </DialogDescription>
          </DialogHeader>
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
          {!loading && detail && <FhirResourceDetail detail={detail} />}
        </DialogContent>
      </Dialog>
    </ResourceDetailContext.Provider>
  );
}

export function useResourceDetail() {
  const context = useContext(ResourceDetailContext);
  if (!context) {
    throw new Error(
      "useResourceDetail must be used within a ResourceDetailProvider",
    );
  }
  return context;
}
