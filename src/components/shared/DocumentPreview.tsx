import { useEffect, useState } from "react";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type {
  DocumentForResourceResponse,
  DocumentUrlResponse,
} from "@/types/api";

interface DocumentPreviewProps {
  resourceId: string;
  resourceType: string;
}

export function DocumentPreview({
  resourceId,
  resourceType,
}: DocumentPreviewProps) {
  const [state, setState] = useState<"loading" | "found" | "not-found">(
    "loading"
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (resourceType !== "DiagnosticReport") {
      setState("not-found");
      return;
    }

    let cancelled = false;

    api
      .get<DocumentForResourceResponse>(
        `/api/documents/for-resource/${resourceId}`
      )
      .then((res) => {
        if (cancelled) return;
        if (res.fileName) {
          setFileName(res.fileName);
          setDescription(res.description);
          setMimeType(res.mimeType);
          setState("found");
        } else {
          setState("not-found");
        }
      })
      .catch(() => {
        if (!cancelled) setState("not-found");
      });

    return () => {
      cancelled = true;
    };
  }, [resourceId, resourceType]);

  if (resourceType !== "DiagnosticReport") return null;

  if (state === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  if (state === "not-found" || !fileName) return null;

  const isXml = mimeType?.includes("xml");

  const handleOpen = async () => {
    setOpening(true);
    try {
      const params = new URLSearchParams({ fileName });
      if (isXml) params.set("type", "pdf");
      const result = await api.get<DocumentUrlResponse>(
        `/api/documents/url?${params.toString()}`
      );
      window.open(result.url, "_blank");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to open document"
      );
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {description ?? "Source Document"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isXml ? "PDF (converted)" : mimeType ?? "Document"}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={opening}
        onClick={handleOpen}
      >
        {opening ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        View
      </Button>
    </div>
  );
}
