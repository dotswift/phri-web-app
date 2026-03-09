import { useState, useEffect } from "react";
import { useDocumentUploadRealtime } from "./useDocumentUploadRealtime";

const STORAGE_KEY = "phri_pending_upload_id";

function isDone(status: string | undefined): boolean {
  return status === "completed" || status === "failed";
}

export function usePendingUploadStatus() {
  const [uploadId, setUploadId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );

  const status = useDocumentUploadRealtime(uploadId);

  const extractionDone = isDone(status?.status);
  const enrichmentDone = isDone(status?.enrichmentStatus);
  const embeddingDone = isDone(status?.embeddingStatus);
  const allDone = extractionDone && enrichmentDone && embeddingDone;

  const isExtracting = uploadId !== null && !extractionDone;
  const isProcessing = uploadId !== null && status !== null && !allDone;

  const chunksCompleted = status?.chunksCompleted ?? 0;
  const totalChunks = status?.totalChunks ?? 0;

  // Clear localStorage once everything is done
  useEffect(() => {
    if (allDone && uploadId) {
      localStorage.removeItem(STORAGE_KEY);
      setUploadId(null);
    }
  }, [allDone, uploadId]);

  return {
    isExtracting,
    isProcessing,
    extractionDone,
    enrichmentDone,
    embeddingDone,
    allDone,
    chunksCompleted,
    totalChunks,
    status,
  };
}
