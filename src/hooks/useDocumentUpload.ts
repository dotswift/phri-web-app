import { useState, useCallback, useRef } from "react";
import { streamUpload } from "../lib/api";
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

export function useDocumentUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (
      file: File,
      patientInfo: { firstName: string; lastName: string; dob: string },
    ) => {
      setState("uploading");
      setProgress(null);
      setResult(null);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamUpload(
          file,
          patientInfo,
          (event: UploadSSEEvent) => {
            switch (event.type) {
              case "progress":
                setProgress({
                  step: event.step,
                  totalSteps: event.totalSteps,
                  description: event.description,
                  percent: event.percent,
                });
                break;
              case "complete":
                setResult({
                  uploadId: event.uploadId,
                  resourceCount: event.resourceCount,
                  resources: event.resources,
                });
                setState("complete");
                break;
              case "error":
                setError(event.error);
                setState("error");
                break;
            }
          },
          controller.signal,
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setState("idle");
          return;
        }
        setError(err instanceof Error ? err.message : "Upload failed");
        setState("error");
      } finally {
        abortRef.current = null;
      }
    },
    [],
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
  }, []);

  return { state, progress, result, error, upload, cancel, reset };
}
