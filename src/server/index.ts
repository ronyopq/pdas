/// <reference types="@cloudflare/workers-types" />

import type { ApiResponse, DashboardPayload, NavigationItem } from "../shared/domain";

interface Env {
  ASSETS: Fetcher;
  APP_NAME?: string;
  APP_TIMEZONE?: string;
}

const navigation: NavigationItem[] = [
  { label: "Dashboard", href: "/", description: "Overview of today, pending work and progress." },
  { label: "My Plan", href: "/plan", description: "Monthly work plan and travel planning." },
  { label: "Today", href: "/today", description: "Daily activity entry tied to the approved plan." },
  { label: "Pending", href: "/pending", description: "Carry-forward, overdue and recovery actions." },
  { label: "Monthly Report", href: "/report", description: "End-of-month drafting and approvals." },
  { label: "KPI", href: "/kpi", description: "Monthly performance, evidence and score review." },
  { label: "Team", href: "/team", description: "Manager view of approvals and submission compliance." },
  { label: "Admin", href: "/admin", description: "Organization-wide filters, exports and governance." },
  { label: "Exports", href: "/exports", description: "Excel, Word, PDF and print output center." },
];

const dashboard: DashboardPayload = {
  summary: [
    { label: "Plan Status", value: "Draft ready for manager review", tone: "focus" },
    { label: "Daily Submission", value: "21/24 working days submitted", tone: "success" },
    { label: "Pending Tasks", value: "4 open items", tone: "alert" },
    { label: "KPI Snapshot", value: "73/100 provisional score", tone: "calm" },
  ],
  todayPlan: [
    {
      title: "National lobby meeting planning",
      meta: "Planned for 11 March 2026",
      hint: "Open the daily sheet and link activity rows to this plan item.",
    },
    {
      title: "KHANI website follow-up",
      meta: "Pending from 10 March 2026",
      hint: "Mark as continued, rescheduled or moved to next month.",
    },
  ],
  pending: [
    {
      title: "Activity log monitoring system preparation",
      meta: "Overdue by 3 days",
      hint: "Manager will see this on the team dashboard until resolved.",
    },
    {
      title: "Travel output for field visit",
      meta: "Missing expected output",
      hint: "Attach the evidence file or complete the travel output text.",
    },
  ],
  approvals: [
    {
      title: "Work Plan awaiting approval",
      meta: "Manager review queue",
      hint: "The approved plan becomes the source for the Today screen.",
    },
    {
      title: "Monthly report lock after approval",
      meta: "Snapshot retained",
      hint: "Final approved reports remain printable even if tasks change later.",
    },
  ],
};

function json<T>(data: T): Response {
  const payload: ApiResponse<T> = {
    data,
    generatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        status: "ok",
        appName: env.APP_NAME ?? "PRAAN Activity App",
        timezone: env.APP_TIMEZONE ?? "Asia/Dhaka",
      });
    }

    if (url.pathname === "/api/meta/navigation") {
      return json(navigation);
    }

    if (url.pathname === "/api/dashboard/summary") {
      return json(dashboard);
    }

    if (url.pathname === "/api/blueprint/routes") {
      return json({
        employee: ["/api/work-plans", "/api/daily-sheets", "/api/monthly-reports", "/api/kpis"],
        manager: ["/api/team/work-plans", "/api/team/reports", "/api/team/kpis"],
        admin: ["/api/admin/users", "/api/admin/templates", "/api/admin/exports"],
      });
    }

    return env.ASSETS.fetch(request);
  },
};

