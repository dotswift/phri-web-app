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

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<DashboardResponse>("/api/dashboard"),
      api
        .get<MedicationInsightsResponse>("/api/medications/insights")
        .catch(() => null),
      api
        .get<ImmunizationInsightsResponse>("/api/immunizations/insights")
        .catch(() => null),
    ])
      .then(([dash, meds, immun]) => {
        setDashboard(dash);
        setMedInsights(meds);
        setImmunInsights(immun);
        hasFetched.current = true;
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (shouldFetch) {
      fetchAll();
    } else {
      // Patient gone or not ready — clear cached data
      setDashboard(null);
      setMedInsights(null);
      setImmunInsights(null);
      hasFetched.current = false;
    }
  }, [shouldFetch, fetchAll]);

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
