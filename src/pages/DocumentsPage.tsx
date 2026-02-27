import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import type { DocumentListResponse, DocumentUrlResponse, DocumentItem } from "@/types/api";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentTitle(doc: DocumentItem): string {
  return (
    doc.description ??
    doc.type?.coding?.[0]?.display ??
    doc.type?.text ??
    doc.fileName
  );
}

export function DocumentsPage() {
  const [data, setData] = useState<DocumentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingFileName, setViewingFileName] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<DocumentListResponse>("/api/documents");
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDocument = async (doc: DocumentItem) => {
    setViewingFileName(doc.fileName);
    try {
      const params = new URLSearchParams({ fileName: doc.fileName });
      // Only request PDF conversion for XML documents (CDA/CCDA);
      // native PDF/JPG/etc. should be fetched without conversion.
      if (doc.mimeType?.includes("xml")) params.set("type", "pdf");
      const result = await api.get<DocumentUrlResponse>(
        `/api/documents/url?${params.toString()}`,
      );
      window.open(result.url, "_blank");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to get document URL",
      );
    } finally {
      setViewingFileName(null);
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[{ label: "Records", to: "/records" }, { label: "Documents" }]}
      />
      <h1 className="text-2xl font-bold">Documents</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !data || data.documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="No source documents have been recorded."
        />
      ) : (
        <div className="space-y-2">
          {data.documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {getDocumentTitle(doc)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {doc.mimeType && <span>{doc.mimeType}</span>}
                    {doc.size != null && <span>{formatBytes(doc.size)}</span>}
                    {doc.indexed && (
                      <span>
                        {new Date(doc.indexed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status && (
                    <Badge variant="outline" className="text-xs">
                      {doc.status}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={viewingFileName === doc.fileName}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDocument(doc);
                    }}
                  >
                    {viewingFileName === doc.fileName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
