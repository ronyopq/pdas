import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth/AuthContext";
import { fetchCurrentDailySheet, fetchDashboard, fetchPendingItems } from "../shared/api";
import type { DailyActivityRow, DashboardPayload, PendingItem } from "../shared/domain";
import { DashboardPage } from "./pages/DashboardPage";
import { ExportPage } from "./pages/ExportPage";
import { LoginPage } from "./pages/LoginPage";
import { ReportPage } from "./pages/ReportPage";
import { ReviewWorkspacePage } from "./pages/ReviewWorkspacePage";
import { TodayPage } from "./pages/TodayPage";
import { WorkPlanPage } from "./pages/WorkPlanPage";
import { CalendarPage } from "./pages/CalendarPage";

type PrimaryTab = "dashboard" | "daily" | "plan" | "calendar" | "report" | "exports" | "team" | "admin";

interface TabDefinition {
  id: PrimaryTab;
  label: string;
  description: string;
  roles?: ("employee" | "manager" | "admin" | "super_admin")[];
}

const tabs: TabDefinition[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Today plan, pending follow-up, and quick operational view.",
  },
  {
    id: "daily",
    label: "Daily Activity",
    description: "Time-based activity log with daily register workflow.",
  },
  {
    id: "plan",
    label: "Work Plan",
    description: "Monthly work plan create, import, edit, and export.",
  },
  {
    id: "calendar",
    label: "Calendar",
    description: "Plan rows and travel commitments in a calendar layout.",
  },
  {
    id: "report",
    label: "Monthly Report",
    description: "Month-end report drafted from the running daily activity data.",
  },
  {
    id: "exports",
    label: "Submission Files",
    description: "Excel, Word, PDF, and print views for office submission.",
  },
  {
    id: "team",
    label: "Team",
    description: "Manager review queue and team progress.",
    roles: ["manager", "admin", "super_admin"],
  },
  {
    id: "admin",
    label: "Admin",
    description: "Organization-wide oversight and approval actions.",
    roles: ["admin", "super_admin"],
  },
];

function todayInDhaka() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "03";
  const day = parts.find((part) => part.type === "day")?.value ?? "09";
  return `${year}-${month}-${day}`;
}

function metaByTab(tab: PrimaryTab) {
  switch (tab) {
    case "dashboard":
      return {
        eyebrow: "Operational Pulse",
        title: "Work journal and planning cockpit",
        text: "Start from today’s planned work, sticky pending reminders, and quick drill-down into daily execution.",
      };
    case "daily":
      return {
        eyebrow: "Daily Register",
        title: "Time-based activity capture",
        text: "Record each activity with time, output, note, and carry-forward status in one place.",
      };
    case "plan":
      return {
        eyebrow: "Monthly Planning",
        title: "Plan first, execute later",
        text: "Create the monthly work plan, travel plan, and export them in office-ready format.",
      };
    case "calendar":
      return {
        eyebrow: "Calendar View",
        title: "See the month visually",
        text: "Review planned work, travel, and pending rows in a calendar layout instead of a long table.",
      };
    case "report":
      return {
        eyebrow: "Monthly Reporting",
        title: "Turn daily work into report output",
        text: "Completed work, open items, and next month commitments can be reviewed before export.",
      };
    case "exports":
      return {
        eyebrow: "Submission Files",
        title: "Generate the office documents",
        text: "Download Excel, Word, PDF, and print views from the same dataset.",
      };
    case "team":
      return {
        eyebrow: "Manager Review",
        title: "Review direct reports",
        text: "Track pending submissions, approvals, and employee work status in one workspace.",
      };
    case "admin":
      return {
        eyebrow: "Admin Oversight",
        title: "See everything centrally",
        text: "Organization-wide review, exception handling, and approval history are visible here.",
      };
    default:
      return {
        eyebrow: "PRAAN Workspace",
        title: "Operational workspace",
        text: "",
      };
  }
}

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<PrimaryTab>("dashboard");
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [followUpRows, setFollowUpRows] = useState<DailyActivityRow[]>([]);

  useEffect(() => {
    if (!user) {
      setDashboard(null);
      setPending([]);
      return;
    }

    const workDate = todayInDhaka();
    fetchDashboard()
      .then((result) => setDashboard(result.data))
      .catch(() => setDashboard(null));
    fetchPendingItems(workDate)
      .then((result) => setPending(result.data))
      .catch(() => setPending([]));
    fetchCurrentDailySheet(workDate)
      .then((result) =>
        setFollowUpRows(result.data.rows.filter((row) => row.isFollowUpGenerated || row.followUpDate === workDate)),
      )
      .catch(() => setFollowUpRows([]));
  }, [user]);

  const availableTabs = useMemo(() => {
    if (!user) return [];
    return tabs.filter((tab) => !tab.roles || tab.roles.includes(user.role));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!availableTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(availableTabs[0]?.id ?? "dashboard");
    }
  }, [activeTab, availableTabs, user]);

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

  const activeMeta = metaByTab(activeTab);
  const stickyPlan = dashboard?.todayPlan ?? [];
  const stickyFollowUps = followUpRows.filter((row) => row.isFollowUpGenerated).slice(0, 4);
  const stickyPending = pending.slice(0, 4);

  return (
    <main className="workspace-shell">
      <section className="hero-shell">
        <div className="hero-copy">
          <span className="eyebrow">{activeMeta.eyebrow}</span>
          <h1>{activeMeta.title}</h1>
          <p>{activeMeta.text}</p>
        </div>

        <div className="hero-side">
          <div className="user-badge">
            <strong>{user.fullName}</strong>
            <span>{user.designation}</span>
            <small>
              {user.employeeCode} | {user.role}
            </small>
          </div>
          <button type="button" className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </section>

      <section className="sticky-tray">
        <div className="sticky-section">
          <div className="sticky-header">
            <strong>Today plan</strong>
            <button type="button" className="inline-action" onClick={() => setActiveTab("daily")}>
              Open Daily Activity
            </button>
          </div>
          <div className="sticky-list">
            {stickyPlan.length ? (
              stickyPlan.slice(0, 4).map((item) => (
                <button key={`${item.title}:${item.meta}`} type="button" className="sticky-chip" onClick={() => setActiveTab("daily")}>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </button>
              ))
            ) : (
              <div className="sticky-empty">No highlighted plan item for today.</div>
            )}
          </div>
        </div>

        <div className="sticky-section">
          <div className="sticky-header">
            <strong>Pending follow-up</strong>
            <button type="button" className="inline-action" onClick={() => setActiveTab("dashboard")}>
              View dashboard
            </button>
          </div>
          <div className="sticky-list">
            {stickyFollowUps.length || stickyPending.length ? (
              <>
                {stickyFollowUps.map((row) => (
                  <button key={row.id} type="button" className="sticky-chip tone-focus" onClick={() => setActiveTab("daily")}>
                    <strong>{row.actualActivity}</strong>
                    <span>
                      {row.followUpSourceDate ?? "Previous day"} | {row.followUpPerson || "Follow-up"}
                    </span>
                  </button>
                ))}
                {stickyPending.map((item) => (
                  <button key={item.id} type="button" className={`sticky-chip tone-${item.status === "overdue" ? "alert" : "focus"}`} onClick={() => setActiveTab("daily")}>
                    <strong>{item.title}</strong>
                    <span>
                      {item.workDate} | {item.status}
                    </span>
                  </button>
                ))}
              </>
            ) : (
              <div className="sticky-empty">No pending reminder right now.</div>
            )}
          </div>
        </div>
      </section>

      <nav className="module-bar">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`module-card ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </button>
        ))}
      </nav>

      <section className="shell-body">
        {activeTab === "dashboard" ? <DashboardPage dashboard={dashboard} /> : null}
        {activeTab === "daily" ? <TodayPage /> : null}
        {activeTab === "plan" ? <WorkPlanPage /> : null}
        {activeTab === "calendar" ? <CalendarPage /> : null}
        {activeTab === "report" ? <ReportPage /> : null}
        {activeTab === "exports" ? <ExportPage /> : null}
        {activeTab === "team" ? <ReviewWorkspacePage scope="team" /> : null}
        {activeTab === "admin" ? <ReviewWorkspacePage scope="admin" /> : null}
      </section>
    </main>
  );
}
