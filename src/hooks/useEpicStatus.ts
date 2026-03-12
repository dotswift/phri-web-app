import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { EpicStatus } from "@/types/api";

export function useEpicStatus(pollMs = 3000) {
  const [status, setStatus] = useState<EpicStatus | null>(null);

  useEffect(() => {
    if (!pollMs) return; // pollMs=0 means disabled

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const data = await api.get<EpicStatus>("/api/epic/status");
        if (cancelled) return;
        setStatus(data);

        if (data.connected && !data.syncing) return; // done — stop polling
      } catch {
        // Silently retry on network error
      }
      if (!cancelled) {
        timeoutId = setTimeout(poll, pollMs);
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [pollMs]);

  return status;
}
