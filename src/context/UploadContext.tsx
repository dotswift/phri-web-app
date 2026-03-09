import { createContext, useContext, type ReactNode } from "react";
import {
  useDocumentUpload,
  type UploadProgress,
  type UploadResult,
} from "../hooks/useDocumentUpload";

type UploadState = "idle" | "uploading" | "complete" | "error";

interface UploadContextValue {
  state: UploadState;
  progress: UploadProgress | null;
  result: UploadResult | null;
  error: string | null;
  uploadId: string | null;
  resourceCounts: Record<string, number> | null;
  totalExtracted: number;
  chunksCompleted: number;
  totalChunks: number;
  upload: (
    file: File,
    patientInfo: { firstName: string; lastName: string; dob: string },
  ) => Promise<void>;
  resume: (uploadId: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: ReactNode }) {
  const value = useDocumentUpload();
  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
