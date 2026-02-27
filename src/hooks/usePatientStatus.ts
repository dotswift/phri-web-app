import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import type { PatientStatus } from "../types/api";

export function usePatientStatus() {
  const [status, setStatus] = useState<PatientStatus["status"] | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const poll = async () => {
      try {
        const result = await api.get<PatientStatus | null>(
          "/api/patient/status",
        );
        if (!result) return;

        setStatus(result.status);

        if (
          result.status === "ready" ||
          result.status === "partial" ||
          result.status === "failed"
        ) {
          clearInterval(intervalRef.current);
        }
      } catch {
        // Ignore polling errors
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => clearInterval(intervalRef.current);
  }, []);

  return status;
}
