import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";
import type {
  DashboardResponse,
  MedicationInsightsResponse,
  ImmunizationInsightsResponse,
} from "../types/api";

interface HealthDataState {
  dashboard: DashboardResponse | null;
  medInsights: MedicationInsightsResponse | null;
  immunInsights: ImmunizationInsightsResponse | null;
  loading: boolean;
  /** True only on first load when no cached data exists yet */
  initialLoading: boolean;
  refresh: () => void;
  /** Refresh only dashboard data (used during live upload) */
  refreshDashboard: () => void;
}

const HealthDataContext = createContext<HealthDataState | null>(null);

export function HealthDataProvider({ children }: { children: ReactNode }) {
  const { patient } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [medInsights, setMedInsights] =
    useState<MedicationInsightsResponse | null>(null);
  const [immunInsights, setImmunInsights] =
    useState<ImmunizationInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  const patientStatus = patient?.status;
  const shouldFetch =
    patientStatus === "ready" || patientStatus === "partial";
  // Allow dashboard fetch during processing (for live upload data view)
  const canFetchDashboard =
    shouldFetch || patientStatus === "processing" || patientStatus === "pending";

  const refreshDashboard = useCallback(() => {
    if (!canFetchDashboard) return;
    api
      .get<DashboardResponse>("/api/dashboard")
      .then((dash) => setDashboard(dash))
      .catch(() => {});
  }, [canFetchDashboard]);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<DashboardResponse>("/api/dashboard"),
      shouldFetch
        ? api
            .get<MedicationInsightsResponse>("/api/medications/insights")
            .catch(() => null)
        : Promise.resolve(null),
      shouldFetch
        ? api
            .get<ImmunizationInsightsResponse>("/api/immunizations/insights")
            .catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([dash, meds, immun]) => {
        setDashboard(dash);
        if (meds) setMedInsights(meds);
        if (immun) setImmunInsights(immun);
        hasFetched.current = true;
      })
      .finally(() => setLoading(false));
  }, [shouldFetch]);

  useEffect(() => {
    if (canFetchDashboard) {
      fetchAll();
    } else {
      // Patient gone or not ready — clear cached data
      setDashboard(null);
      setMedInsights(null);
      setImmunInsights(null);
      hasFetched.current = false;
    }
  }, [canFetchDashboard, fetchAll]);

  const initialLoading = loading && !hasFetched.current;

  return (
    <HealthDataContext.Provider
      value={{
        dashboard,
        medInsights,
        immunInsights,
        loading,
        initialLoading,
        refresh: fetchAll,
        refreshDashboard,
      }}
    >
      {children}
    </HealthDataContext.Provider>
  );
}

export function useHealthData() {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error("useHealthData must be used within a HealthDataProvider");
  }
  return context;
}
