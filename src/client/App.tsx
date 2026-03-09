import { useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { ExportPage } from "./pages/ExportPage";
import { LoginPage } from "./pages/LoginPage";
import { ReportPage } from "./pages/ReportPage";
import { TodayPage } from "./pages/TodayPage";
import { WorkPlanPage } from "./pages/WorkPlanPage";

type TabKey = "plan" | "daily" | "report" | "exports";

const tabs: { id: TabKey; label: string; description: string }[] = [
  {
    id: "plan",
    label: "Work Plan",
    description: "Create and update the monthly plan that you submit to office.",
  },
  {
    id: "daily",
    label: "Daily Activity",
    description: "Write the daily register based on your work plan and actual work done.",
  },
  {
    id: "report",
    label: "Monthly Report",
    description: "Prepare the end-of-month report from your daily activity and pending work.",
  },
  {
    id: "exports",
    label: "Submission Files",
    description: "Generate the Excel, Word, PDF, and print outputs needed for office submission.",
  },
];

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>("plan");

  if (loading) {
    return (
      <main className="workspace-shell">
        <section className="page-card">Loading workspace...</section>
      </main>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0];

  return (
    <main className="workspace-shell">
      <section className="topbar-card">
        <div className="topbar-copy">
          <span className="brand-mark">PRAAN Activity Workspace</span>
          <h1>Work Plan, Daily Activity, and Monthly Report</h1>
          <p>{activeTab.description}</p>
        </div>

        <div className="topbar-side">
          <div className="user-badge">
            <strong>{user.fullName}</strong>
            <span>{user.designation}</span>
            <small>{user.projectName}</small>
          </div>
          <button type="button" className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </section>

      <nav className="tabbar">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab-button ${tab === item.id ? "is-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>

      <section className="shell-body">
        {tab === "plan" ? <WorkPlanPage /> : null}
        {tab === "daily" ? <TodayPage /> : null}
        {tab === "report" ? <ReportPage /> : null}
        {tab === "exports" ? <ExportPage /> : null}
      </section>
    </main>
  );
}
