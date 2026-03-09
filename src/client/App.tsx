import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { ExportPage } from "./pages/ExportPage";
import { LoginPage } from "./pages/LoginPage";
import { PendingPage } from "./pages/PendingPage";
import { ReportPage } from "./pages/ReportPage";
import { ReviewWorkspacePage } from "./pages/ReviewWorkspacePage";
import { SimplePage } from "./pages/SimplePage";
import { TodayPage } from "./pages/TodayPage";
import { WorkPlanPage } from "./pages/WorkPlanPage";
import type { DashboardPayload, NavigationItem } from "../shared/domain";
import { fetchDashboard, fetchNavigation } from "../shared/api";
import { useAuth } from "./auth/AuthContext";

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    if (!user) {
      setNavItems([]);
      setDashboard(null);
      return;
    }

    fetchNavigation().then((result) => setNavItems(result.data)).catch(() => setNavItems([]));
    fetchDashboard().then((result) => setDashboard(result.data)).catch(() => setDashboard(null));
  }, [user]);

  if (loading) {
    return (
      <div className="login-shell">
        <section className="login-card">
          <span className="brand-mark">PRAAN</span>
          <h1>Loading workspace...</h1>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell
      navItems={navItems}
      title="Activity Operating System"
      subtitle="Scaffolded for monthly planning, daily execution, reporting, KPI and exports."
      user={user}
      onLogout={logout}
    >
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<DashboardPage dashboard={dashboard} />} />
        <Route path="/plan" element={<WorkPlanPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/pending" element={<PendingPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route
          path="/kpi"
          element={
            <SimplePage
              title="KPI Review"
              description="Configurable scorecards combine system metrics and manager scoring."
              bullets={[
                "Auto metrics from plan and daily submission data",
                "Evidence uploads and manager comments",
                "Final score snapshot for export",
              ]}
            />
          }
        />
        <Route
          path="/team"
          element={
            user.role === "manager" || user.role === "admin" || user.role === "super_admin" ? (
              <ReviewWorkspacePage scope="team" />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user.role === "admin" || user.role === "super_admin" ? (
              <ReviewWorkspacePage scope="admin" />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/exports" element={<ExportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
