import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { ConsentPage } from "./pages/ConsentPage";
import { ConnectPage } from "./pages/ConnectPage";
import { ProgressPage } from "./pages/ProgressPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TimelinePage } from "./pages/TimelinePage";
import { MedicationsPage } from "./pages/MedicationsPage";
import { MedicationInsightsPage } from "./pages/MedicationInsightsPage";
import { ImmunizationsPage } from "./pages/ImmunizationsPage";
import { ChatPage } from "./pages/ChatPage";
import { SettingsPage } from "./pages/SettingsPage";

function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireConsent() {
  const { consent, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!consent) return <Navigate to="/consent" replace />;
  return <Outlet />;
}

function RequirePatient() {
  const { patient, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!patient) return <Navigate to="/connect" replace />;
  if (patient.status === "pending" || patient.status === "querying") {
    return <Navigate to="/progress" replace />;
  }
  return <Outlet />;
}

function RootRedirect() {
  const { user, consent, patient, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!consent) return <Navigate to="/consent" replace />;
  if (!patient) return <Navigate to="/connect" replace />;
  if (patient.status === "pending" || patient.status === "querying") {
    return <Navigate to="/progress" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          <Route path="/settings" element={<AppLayout />}>
            <Route index element={<SettingsPage />} />
          </Route>

          <Route element={<RequirePatient />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/medications" element={<MedicationsPage />} />
              <Route
                path="/medications/insights"
                element={<MedicationInsightsPage />}
              />
              <Route path="/immunizations" element={<ImmunizationsPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
