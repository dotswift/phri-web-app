import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

interface UploadRealtimeStatus {
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
        enrichmentStatus: string;
        embeddingStatus: string;
      }>(`/api/upload/${uploadId}/status`)
      .then((data) => {
        setStatus({
          enrichmentStatus: data.enrichmentStatus ?? "pending",
          embeddingStatus: data.embeddingStatus ?? "pending",
        });
      })
      .catch(() => {
        // Fall back to pending if fetch fails
        setStatus({ enrichmentStatus: "pending", embeddingStatus: "pending" });
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
