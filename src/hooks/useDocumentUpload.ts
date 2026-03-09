import { useState, useCallback, useRef } from "react";
import { streamUpload, streamResume, api } from "../lib/api";
import type { UploadSSEEvent } from "../types/api";

export interface UploadProgress {
  step: number;
  totalSteps: number;
  description: string;
  percent: number;
}

export interface UploadResult {
  uploadId: string;
  resourceCount: number;
  resources: Array<{ resourceType: string; displayText: string | null }>;
}

type UploadState = "idle" | "uploading" | "complete" | "error";

const MAX_RESUME_RETRIES = 3;

/**
 * Fire-and-forget post-processing: enrich + embed in parallel.
 * Both are non-critical — enrichment has Claude fallback text,
 * embeddings have lazy generation in chat.service.ts.
 */
function triggerPostProcessing(uploadId: string) {
  api.post(`/api/upload/${uploadId}/enrich`).catch(() => {});
  api.post(`/api/upload/${uploadId}/embed`).catch(() => {});
}

export function useDocumentUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resourceCounts, setResourceCounts] = useState<Record<string, number> | null>(null);
  const [totalExtracted, setTotalExtracted] = useState(0);
  const [chunksCompleted, setChunksCompleted] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef<string | null>(null);
  const retriesRef = useRef(0);

  const handleEvent = useCallback((event: UploadSSEEvent) => {
    switch (event.type) {
      case "upload_created":
        uploadIdRef.current = event.uploadId;
        localStorage.setItem("phri_pending_upload_id", event.uploadId);
        break;
      case "resumed":
        uploadIdRef.current = event.uploadId;
        localStorage.setItem("phri_pending_upload_id", event.uploadId);
        break;
      case "progress":
        setProgress({
          step: event.step,
          totalSteps: event.totalSteps,
          description: event.description,
          percent: event.percent,
        });
        break;
      case "chunk_complete":
        setChunksCompleted((event as any).chunksCompleted ?? 0);
        setTotalChunks((event as any).totalChunks ?? 0);
        setResourceCounts((event as any).resourceCounts ?? null);
        setTotalExtracted((event as any).totalExtracted ?? 0);
        break;
      case "complete":
        setResult({
          uploadId: event.uploadId,
          resourceCount: event.resourceCount,
          resources: event.resources,
        });
        setState("complete");
        triggerPostProcessing(event.uploadId);
        break;
      case "error":
        setError(event.error);
        setState("error");
        break;
    }
  }, []);

  const attemptResume = useCallback(
    async (id: string) => {
      retriesRef.current++;
      setState("uploading");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamResume(id, handleEvent, controller.signal);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setState("idle");
          return;
        }
        // If still retryable, try again
        if (retriesRef.current < MAX_RESUME_RETRIES && uploadIdRef.current) {
          console.warn(
            `[useDocumentUpload] Resume attempt ${retriesRef.current} failed, retrying...`,
          );
          await attemptResume(uploadIdRef.current);
          return;
        }
        setError(err instanceof Error ? err.message : "Upload failed");
        setState("error");
      } finally {
        abortRef.current = null;
      }
    },
    [handleEvent],
  );

  const upload = useCallback(
    async (
      file: File,
      patientInfo: { firstName: string; lastName: string; dob: string },
    ) => {
      setState("uploading");
      setProgress(null);
      setResult(null);
      setError(null);
      uploadIdRef.current = null;
      retriesRef.current = 0;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamUpload(file, patientInfo, handleEvent, controller.signal);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setState("idle");
          return;
        }
        // Stream died unexpectedly — auto-retry via resume if we have an uploadId
        if (uploadIdRef.current && retriesRef.current < MAX_RESUME_RETRIES) {
          console.warn(
            "[useDocumentUpload] Stream died, attempting resume...",
          );
          await attemptResume(uploadIdRef.current);
          return;
        }
        setError(err instanceof Error ? err.message : "Upload failed");
        setState("error");
      } finally {
        abortRef.current = null;
      }
    },
    [handleEvent, attemptResume],
  );

  /** Manual resume from UI error state */
  const resume = useCallback(
    async (uploadId: string) => {
      setError(null);
      retriesRef.current = 0;
      uploadIdRef.current = uploadId;
      await attemptResume(uploadId);
    },
    [attemptResume],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(null);
    setResult(null);
    setError(null);
    setResourceCounts(null);
    setTotalExtracted(0);
    setChunksCompleted(0);
    setTotalChunks(0);
    uploadIdRef.current = null;
    retriesRef.current = 0;
  }, []);

  return {
    state,
    progress,
    result,
    error,
    uploadId: uploadIdRef.current,
    resourceCounts,
    totalExtracted,
    chunksCompleted,
    totalChunks,
    upload,
    resume,
    cancel,
    reset,
  };
}
