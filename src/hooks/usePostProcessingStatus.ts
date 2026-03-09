import { useState, useEffect } from "react";
import { useDocumentUploadRealtime } from "./useDocumentUploadRealtime";

const STORAGE_KEY = "phri_pending_upload_id";

function isDone(status: string | undefined): boolean {
  return status === "completed" || status === "failed";
}

export function usePostProcessingStatus() {
  const [uploadId, setUploadId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );

  const status = useDocumentUploadRealtime(uploadId);

  const enrichmentDone = isDone(status?.enrichmentStatus);
  const embeddingDone = isDone(status?.embeddingStatus);
  const allDone = enrichmentDone && embeddingDone;

  // Clear localStorage once both are done
  useEffect(() => {
    if (allDone && uploadId) {
      localStorage.removeItem(STORAGE_KEY);
      setUploadId(null);
    }
  }, [allDone, uploadId]);

  const isProcessing = uploadId !== null && status !== null && !allDone;

  return {
    isProcessing,
    enrichmentDone,
    embeddingDone,
    status,
  };
}
