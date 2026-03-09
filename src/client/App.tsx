import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { SimplePage } from "./pages/SimplePage";
import type { DashboardPayload, NavigationItem } from "../shared/domain";
import { fetchDashboard, fetchNavigation } from "../shared/api";

export default function App() {
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    fetchNavigation().then((result) => setNavItems(result.data)).catch(() => setNavItems([]));
    fetchDashboard().then((result) => setDashboard(result.data)).catch(() => setDashboard(null));
  }, []);

  return (
    <AppShell
      navItems={navItems}
      title="Activity Operating System"
      subtitle="Scaffolded for monthly planning, daily execution, reporting, KPI and exports."
    >
      <Routes>
        <Route path="/" element={<DashboardPage dashboard={dashboard} />} />
        <Route
          path="/plan"
          element={
            <SimplePage
              title="Monthly Work Plan"
              description="Date-wise planning, travel plan and approval flow start here."
              bullets={[
                "Auto-generate rows for the month",
                "Keep the Excel-compatible header and signature block",
                "Track revisions before manager approval",
              ]}
            />
          }
        />
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
            <SimplePage
              title="Manager Workspace"
              description="Managers review work plans, missing submissions and KPI queues here."
              bullets={[
                "Approval queue",
                "Overdue filters",
                "Employee detail drilldown",
              ]}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <SimplePage
              title="Admin Workspace"
              description="Admin filters, batch exports, template management and governance."
              bullets={[
                "Organization-wide compliance monitoring",
                "Template activation",
                "Bulk Excel, Word and PDF exports",
              ]}
            />
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
      </Routes>
    </AppShell>
  );
}

