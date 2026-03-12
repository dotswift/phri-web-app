import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { EpicStatus } from "@/types/api";

export function useEpicStatus(pollMs = 3000) {
  const [status, setStatus] = useState<EpicStatus | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await api.get<EpicStatus>("/api/epic/status");
        if (cancelled) return;
        setStatus(data);

        if (data.connected && !data.syncing && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } catch {
        // Silently retry on network error
      }
    };

    poll();
    intervalRef.current = setInterval(poll, pollMs);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollMs]);

  return status;
}
