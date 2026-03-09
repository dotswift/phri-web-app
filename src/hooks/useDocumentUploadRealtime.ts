import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

interface UploadRealtimeStatus {
  status: string;
  chunksCompleted: number;
  totalChunks: number;
  enrichmentStatus: string;
  embeddingStatus: string;
}

/**
 * Subscribes to Supabase Realtime changes on a DocumentUpload row.
 * Returns enrichmentStatus and embeddingStatus, updating live.
 * Does an initial fetch to avoid missing events from the race window.
 */
export function useDocumentUploadRealtime(
  uploadId: string | null,
): UploadRealtimeStatus | null {
  const [status, setStatus] = useState<UploadRealtimeStatus | null>(null);

  useEffect(() => {
    if (!uploadId) {
      setStatus(null);
      return;
    }

    // Initial fetch to avoid race condition
    api
      .get<{
        status: string;
        chunksCompleted: number;
        totalChunks: number;
        enrichmentStatus: string;
        embeddingStatus: string;
      }>(`/api/upload/${uploadId}/status`)
      .then((data) => {
        setStatus({
          status: data.status ?? "processing",
          chunksCompleted: data.chunksCompleted ?? 0,
          totalChunks: data.totalChunks ?? 0,
          enrichmentStatus: data.enrichmentStatus ?? "pending",
          embeddingStatus: data.embeddingStatus ?? "pending",
        });
      })
      .catch(() => {
        setStatus({
          status: "processing",
          chunksCompleted: 0,
          totalChunks: 0,
          enrichmentStatus: "pending",
          embeddingStatus: "pending",
        });
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`upload-${uploadId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "DocumentUpload",
          filter: `id=eq.${uploadId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setStatus({
            status: (row.status as string) ?? "processing",
            chunksCompleted: (row.chunksCompleted as number) ?? 0,
            totalChunks: (row.totalChunks as number) ?? 0,
            enrichmentStatus: (row.enrichmentStatus as string) ?? "pending",
            embeddingStatus: (row.embeddingStatus as string) ?? "pending",
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uploadId]);

  return status;
}
