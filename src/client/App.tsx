import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { SimplePage } from "./pages/SimplePage";
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
        <Route
          path="/today"
          element={
            <SimplePage
              title="Daily Activity"
              description="Daily execution stays linked to approved plan rows and travel items."
              bullets={[
                "Multiple time rows per day",
                "Delivery and note sections match the print format",
                "Ad hoc work remains separately reportable",
              ]}
            />
          }
        />
        <Route
          path="/pending"
          element={
            <SimplePage
              title="Pending Board"
              description="Carry-forward, overdue and next-month actions live here."
              bullets={[
                "Continue tomorrow",
                "Reschedule in current month",
                "Move to next month",
              ]}
            />
          }
        />
        <Route
          path="/report"
          element={
            <SimplePage
              title="Monthly Report"
              description="Generate the report from actual execution, then export to Word/PDF."
              bullets={[
                "Completed tasks snapshot",
                "Ongoing items and next month draft",
                "Lessons learned and approval block",
              ]}
            />
          }
        />
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
            <SimplePage
              title="Manager Workspace"
              description="Managers review work plans, missing submissions and KPI queues here."
              bullets={[
                "Approval queue",
                "Overdue filters",
                "Employee detail drilldown",
              ]}
            />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user.role === "admin" || user.role === "super_admin" ? (
            <SimplePage
              title="Admin Workspace"
              description="Admin filters, batch exports, template management and governance."
              bullets={[
                "Organization-wide compliance monitoring",
                "Template activation",
                "Bulk Excel, Word and PDF exports",
              ]}
            />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/exports"
          element={
            <SimplePage
              title="Export Center"
              description="The export pipeline will generate Excel, Word, PDF and print-ready outputs."
              bullets={[
                "Monthly work plan to Excel",
                "Monthly report to Word",
                "Daily activity and KPI summaries to PDF",
              ]}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
