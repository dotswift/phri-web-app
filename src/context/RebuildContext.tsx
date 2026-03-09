import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import { useHealthData } from "./HealthDataContext";
import { toast } from "sonner";

const STORAGE_KEY = "phri_rebuild_started_at";
/** If a page refresh happens within this window, show the indicator briefly */
const STALE_MS = 5 * 60 * 1000; // 5 minutes

interface RebuildState {
  isRebuilding: boolean;
  triggerRebuild: () => void;
}

const RebuildContext = createContext<RebuildState | null>(null);

export function RebuildProvider({ children }: { children: ReactNode }) {
  const { refresh: refreshHealthData } = useHealthData();

  const [isRebuilding, setIsRebuilding] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    // If the flag is recent, assume rebuild may still be running
    return Date.now() - Number(raw) < STALE_MS;
  });

  // On mount with a stale flag, refresh data and clear it
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && Date.now() - Number(raw) >= STALE_MS) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const triggerRebuild = useCallback(async () => {
    if (isRebuilding) return;
    setIsRebuilding(true);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));

    try {
      const result = await api.post<{ succeeded: number; failed: number }>(
        "/api/settings/regenerate-insights",
      );
      refreshHealthData();
      if (result.failed === 0) {
        toast.success("Rebuild complete");
      } else {
        toast.warning(
          `${result.succeeded} succeeded, ${result.failed} failed`,
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to rebuild data",
      );
    } finally {
      setIsRebuilding(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isRebuilding, refreshHealthData]);

  return (
    <RebuildContext.Provider value={{ isRebuilding, triggerRebuild }}>
      {children}
    </RebuildContext.Provider>
  );
}

export function useRebuild() {
  const context = useContext(RebuildContext);
  if (!context) {
    throw new Error("useRebuild must be used within a RebuildProvider");
  }
  return context;
}
