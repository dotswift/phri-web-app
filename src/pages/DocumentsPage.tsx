import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api";
import { useUpload } from "@/context/UploadContext";
import { toast } from "sonner";
import { FileText, ExternalLink, Loader2, Plus, CheckCircle, AlertCircle, Upload, X } from "lucide-react";
import type { DocumentListResponse, DocumentUrlResponse, DocumentItem } from "@/types/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state: uploadState, progress, result, error: uploadError, upload, cancel, reset } = useUpload();

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
    setViewingId(doc.id);
    try {
      if (doc.source === "upload") {
        const result = await api.get<DocumentUrlResponse>(
          `/api/upload/${doc.id}/download-url`,
        );
        window.open(result.url, "_blank");
      } else {
        const params = new URLSearchParams({ fileName: doc.fileName });
        if (doc.mimeType?.includes("xml")) params.set("type", "pdf");
        const result = await api.get<DocumentUrlResponse>(
          `/api/documents/url?${params.toString()}`,
        );
        window.open(result.url, "_blank");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to get document URL",
      );
    } finally {
      setViewingId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be smaller than 10MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) return;
    upload(selectedFile, { firstName: firstName.trim() || "Patient", lastName, dob });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && uploadState === "uploading") return; // Prevent closing while uploading
    setDialogOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setSelectedFile(null);
      setFirstName("");
      setLastName("");
      setDob("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      reset();
    }
  };

  const handleComplete = () => {
    setDialogOpen(false);
    setSelectedFile(null);
    setFirstName("");
    setLastName("");
    setDob("");
    reset();
    fetchData();
    toast.success(`Extracted ${result?.resourceCount ?? 0} health records`);
  };

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[{ label: "Records", to: "/records" }, { label: "Documents" }]}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Upload PDF
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Medical Record</DialogTitle>
            </DialogHeader>

            {uploadState === "idle" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pdf-file">PDF File</Label>
                  <Input
                    id="pdf-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Patient"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Patient info is used to remove personal details before AI processing.
                </p>
                <Button
                  onClick={handleUploadSubmit}
                  disabled={!selectedFile}
                  className="w-full"
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Upload & Process
                </Button>
              </div>
            )}

            {uploadState === "uploading" && progress && (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{progress.description}</span>
                    <span className="text-muted-foreground">{progress.percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Step {progress.step} of {progress.totalSteps}
                  </p>
                </div>
                <Button variant="outline" onClick={cancel} className="w-full">
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}

            {uploadState === "complete" && result && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                  <p className="font-medium">Upload Complete</p>
                  <p className="text-sm text-muted-foreground">
                    Extracted {result.resourceCount} health record{result.resourceCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button onClick={handleComplete} className="w-full">
                  Close
                </Button>
              </div>
            )}

            {uploadState === "error" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="font-medium">Upload Failed</p>
                  <p className="text-sm text-muted-foreground">{uploadError}</p>
                </div>
                <Button variant="outline" onClick={reset} className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

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
              <CardContent className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {getDocumentTitle(doc)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      doc.indexed && new Date(doc.indexed).toLocaleDateString(),
                      doc.extractedCount != null && doc.source === "upload" && `${doc.extractedCount} records`,
                    ].filter(Boolean).join(" · ") || "\u00A0"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={viewingId === doc.id || (doc.source === "upload" && !doc.fileUrl)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDocument(doc);
                  }}
                >
                  {viewingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
