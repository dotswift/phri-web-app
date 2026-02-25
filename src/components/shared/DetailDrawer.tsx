import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { FhirResourceDetail } from "./FhirResourceDetail";
import { toast } from "sonner";
import type { TimelineDetail } from "@/types/api";

interface DetailDrawerProps {
  resourceId: string | null;
  endpoint: string;
  onClose: () => void;
}

export function DetailDrawer({
  resourceId,
  endpoint,
  onClose,
}: DetailDrawerProps) {
  const [detail, setDetail] = useState<TimelineDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resourceId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    api
      .get<TimelineDetail>(`${endpoint}/${resourceId}`)
      .then(setDetail)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [resourceId, endpoint]);

  return (
    <Sheet open={!!resourceId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Resource Detail</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
          {!loading && detail && <FhirResourceDetail detail={detail} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
