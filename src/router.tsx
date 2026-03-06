import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { ConsentPage } from "./pages/ConsentPage";
import { ConnectPage } from "./pages/ConnectPage";
import { ProgressPage } from "./pages/ProgressPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ChatPage } from "./pages/ChatPage";
import { SettingsPage } from "./pages/SettingsPage";
import { RecordsCategoryGrid } from "./pages/RecordsCategoryGrid";
import { Skeleton } from "./components/ui/skeleton";

// Lazy-load chart-heavy and less-visited pages
const TimelinePage = lazy(() =>
  import("./pages/TimelinePage").then((m) => ({ default: m.TimelinePage })),
);
const MedicationInsightsPage = lazy(() =>
  import("./pages/MedicationInsightsPage").then((m) => ({
    default: m.MedicationInsightsPage,
  })),
);
const ImmunizationsPage = lazy(() =>
  import("./pages/ImmunizationsPage").then((m) => ({
    default: m.ImmunizationsPage,
  })),
);
const ConditionsPage = lazy(() =>
  import("./pages/ConditionsPage").then((m) => ({
    default: m.ConditionsPage,
  })),
);
const LabResultsPage = lazy(() =>
  import("./pages/LabResultsPage").then((m) => ({
    default: m.LabResultsPage,
  })),
);
const VisitsPage = lazy(() =>
  import("./pages/VisitsPage").then((m) => ({ default: m.VisitsPage })),
);
const DocumentsPage = lazy(() =>
  import("./pages/DocumentsPage").then((m) => ({
    default: m.DocumentsPage,
  })),
);

function LazyFallback() {
  return (
    <div className="space-y-4 p-6" role="status" aria-label="Loading page">
      <Skeleton className="h-8 w-48" aria-hidden="true" />
      <Skeleton className="h-4 w-32" aria-hidden="true" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" aria-hidden="true" />
        ))}
      </div>
      <span className="sr-only">Loading page content...</span>
    </div>
  );
}

function PublicOnly() {
  const { user, initialLoading } = useAuth();
  if (initialLoading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequireAuth() {
  const { user, initialLoading } = useAuth();
  if (initialLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireConsent() {
  const { consent, initialLoading } = useAuth();
  if (initialLoading) return <LoadingScreen />;
  if (!consent) return <Navigate to="/consent" replace />;
  return <Outlet />;
}

function RequirePatient() {
  const { patient, initialLoading } = useAuth();
  if (initialLoading) return <LoadingScreen />;
  if (!patient) return <Navigate to="/connect" replace />;
  if (
    patient.status === "querying" ||
    patient.status === "downloading" ||
    patient.status === "processing"
  ) {
    return <Navigate to="/progress" replace />;
  }
  return <Outlet />;
}

function RootRedirect() {
  const { user, consent, patient, initialLoading } = useAuth();

  if (initialLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!consent) return <Navigate to="/consent" replace />;
  if (!patient) return <Navigate to="/connect" replace />;
  if (
    patient.status === "querying" ||
    patient.status === "downloading" ||
    patient.status === "processing"
  ) {
    return <Navigate to="/progress" replace />;
  }
  return <Navigate to="/home" replace />;
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center animate-in fade-in duration-300">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/consent" element={<ConsentPage />} />

        <Route element={<RequireConsent />}>
          <Route path="/connect" element={<ConnectPage />} />
          <Route path="/progress" element={<ProgressPage />} />

          {/* Settings accessible without patient */}
          <Route element={<AppLayout />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route element={<RequirePatient />}>
            <Route element={<AppLayout />}>
              <Route path="/home" element={<DashboardPage />} />
              <Route path="/records" element={<RecordsCategoryGrid />} />
              <Route
                path="/records/conditions"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <ConditionsPage />
                  </Suspense>
                }
              />
              <Route
                path="/records/medications"
                element={<Navigate to="/records/medications/insights" replace />}
              />
              <Route
                path="/records/medications/insights"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <MedicationInsightsPage />
                  </Suspense>
                }
              />
              <Route
                path="/records/lab-results"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <LabResultsPage />
                  </Suspense>
                }
              />
              <Route
                path="/records/immunizations"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <ImmunizationsPage />
                  </Suspense>
                }
              />
              <Route
                path="/records/visits"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <VisitsPage />
                  </Suspense>
                }
              />
              <Route
                path="/records/documents"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <DocumentsPage />
                  </Suspense>
                }
              />
              <Route
                path="/timeline"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <TimelinePage />
                  </Suspense>
                }
              />
              <Route path="/chat" element={<ChatPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Redirects from old paths */}
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route
        path="/records/timeline"
        element={<Navigate to="/timeline" replace />}
      />
      <Route
        path="/medications"
        element={<Navigate to="/records/medications" replace />}
      />
      <Route
        path="/medications/insights"
        element={<Navigate to="/records/medications/insights" replace />}
      />
      <Route
        path="/immunizations"
        element={<Navigate to="/records/immunizations" replace />}
      />
      <Route
        path="/profile"
        element={<Navigate to="/settings" replace />}
      />
      <Route
        path="/profile/settings"
        element={<Navigate to="/settings" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
