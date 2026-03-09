/// <reference types="@cloudflare/workers-types" />

import type {
  ApiResponse,
  DashboardPayload,
  LoginInput,
  MonthlyWorkPlan,
  NavigationItem,
  TravelPlanRow,
  TravelPlanRowInput,
  UserRole,
  UserSession,
  WorkPlanRow,
  WorkPlanRowInput,
} from "../shared/domain";

interface Env {
  ASSETS: Fetcher;
  APP_NAME?: string;
  APP_TIMEZONE?: string;
}

interface MockUser extends UserSession {
  password: string;
}

const SESSION_COOKIE = "praan_session";

const mockUsers: MockUser[] = [
  {
    id: "user-rony",
    employeeCode: "rony001",
    fullName: "Nure Alam Siddiqi",
    designation: "Media & Communication Officer",
    projectName: "Campaign on RtFN",
    managerName: "Umme Salma",
    role: "employee",
    password: "demo123",
  },
  {
    id: "manager-us",
    employeeCode: "manager001",
    fullName: "Umme Salma",
    designation: "Programme Coordinator",
    projectName: "Campaign on RtFN",
    managerName: "Chief Executive",
    role: "manager",
    password: "demo123",
  },
  {
    id: "admin-root",
    employeeCode: "admin001",
    fullName: "PRAAN Admin",
    designation: "System Administrator",
    projectName: "Organization",
    managerName: "Chief Executive",
    role: "admin",
    password: "demo123",
  },
];

const sessions = new Map<string, string>();
const workPlans = new Map<string, MonthlyWorkPlan>();

function publicUser(user: MockUser): UserSession {
  const { password: _password, ...rest } = user;
  return rest;
}

function json<T>(data: T, init?: ResponseInit): Response {
  const payload: ApiResponse<T> = {
    data,
    generatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init?.headers ?? {}),
    },
    status: init?.status ?? 200,
  });
}

function error(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function parseJson<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

function sessionHeader(token: string, expires?: string): HeadersInit {
  return {
    "set-cookie": `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${expires ? `; Expires=${expires}` : ""}`,
  };
}

function clearSessionHeader(): HeadersInit {
  return {
    "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  };
}

function getUserFromRequest(request: Request): UserSession | null {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const userId = sessions.get(token);
  if (!userId) return null;

  const user = mockUsers.find((entry) => entry.id === userId);
  return user ? publicUser(user) : null;
}

function requireUser(request: Request): UserSession | Response {
  const user = getUserFromRequest(request);
  if (!user) {
    return error("Authentication required.", 401);
  }

  return user;
}

function navByRole(role: UserRole): NavigationItem[] {
  const items: NavigationItem[] = [
    { label: "Dashboard", href: "/", description: "Overview of today, pending work and progress." },
    { label: "My Plan", href: "/plan", description: "Monthly work plan and travel planning." },
    { label: "Today", href: "/today", description: "Daily activity entry tied to the approved plan." },
    { label: "Pending", href: "/pending", description: "Carry-forward, overdue and recovery actions." },
    { label: "Monthly Report", href: "/report", description: "End-of-month drafting and approvals." },
    { label: "KPI", href: "/kpi", description: "Monthly performance, evidence and score review." },
    { label: "Exports", href: "/exports", description: "Excel, Word, PDF and print output center." },
  ];

  if (role === "manager" || role === "admin" || role === "super_admin") {
    items.push({
      label: "Team",
      href: "/team",
      description: "Manager view of approvals and submission compliance.",
    });
  }

  if (role === "admin" || role === "super_admin") {
    items.push({
      label: "Admin",
      href: "/admin",
      description: "Organization-wide filters, exports and governance.",
    });
  }

  return items;
}

function makePlanKey(userId: string, year: number, month: number): string {
  return `${userId}:${year}:${month}`;
}

function seededRows(): WorkPlanRow[] {
  return [
    {
      id: crypto.randomUUID(),
      serialNo: 1,
      workDate: "2026-03-01",
      activity: "KPI format preparation",
      expectedOutput: "Draft KPI format prepared",
      rowType: "regular_work",
      rowStatus: "planned",
    },
    {
      id: crypto.randomUUID(),
      serialNo: 2,
      workDate: "2026-03-02",
      activity: "KPI format finalization",
      expectedOutput: "Final KPI format approved",
      rowType: "regular_work",
      rowStatus: "planned",
    },
    {
      id: crypto.randomUUID(),
      serialNo: 3,
      workDate: "2026-03-03",
      activity: "Prep for Women's Day",
      expectedOutput: "Event materials designed and ready",
      rowType: "regular_work",
      rowStatus: "planned",
    },
    {
      id: crypto.randomUUID(),
      serialNo: 4,
      workDate: "2026-03-12",
      activity: "Follow-up meeting with developer for KHANI website update",
      expectedOutput: "Website update plan discussed",
      rowType: "meeting",
      rowStatus: "pending",
    },
    {
      id: crypto.randomUUID(),
      serialNo: 5,
      workDate: "2026-03-29",
      activity: "Prepared monthly report and submitted",
      expectedOutput: "Monthly report submitted",
      rowType: "regular_work",
      rowStatus: "planned",
    },
  ];
}

function seededTravelRows(): TravelPlanRow[] {
  return [
    {
      id: crypto.randomUUID(),
      serialNo: 1,
      travelDate: "2026-03-03",
      destination: "Subarnachar",
      purpose: "Collect woman farmer information",
      expectedOutput: "Field notes and source stories",
      status: "planned",
    },
    {
      id: crypto.randomUUID(),
      serialNo: 2,
      travelDate: "2026-03-08",
      destination: "Women's Day event venue",
      purpose: "Coverage and documentation",
      expectedOutput: "Photos and social post assets",
      status: "pending",
    },
  ];
}

function getOrCreatePlan(user: UserSession, month: number, year: number): MonthlyWorkPlan {
  const key = makePlanKey(user.id, year, month);
  const existing = workPlans.get(key);

  if (existing) {
    return existing;
  }

  const freshPlan: MonthlyWorkPlan = {
    id: crypto.randomUUID(),
    userId: user.id,
    month,
    year,
    preparedDate: `${year}-${String(month).padStart(2, "0")}-01`,
    status: "draft",
    employeeName: user.fullName,
    designation: user.designation,
    projectName: user.projectName,
    supervisorName: user.managerName,
    rows: user.role === "employee" ? seededRows() : [],
    travelRows: user.role === "employee" ? seededTravelRows() : [],
  };

  workPlans.set(key, freshPlan);
  return freshPlan;
}

function summarizeDashboard(user: UserSession): DashboardPayload {
  const plan = getOrCreatePlan(user, 3, 2026);
  const pendingCount = plan.rows.filter((row) => row.rowStatus === "pending" || row.rowStatus === "overdue").length;
  const submittedText = plan.status === "submitted" ? "Submitted for review" : "Draft ready for manager review";

  return {
    summary: [
      { label: "Plan Status", value: submittedText, tone: plan.status === "submitted" ? "success" : "focus" },
      { label: "Daily Submission", value: "21/24 working days submitted", tone: "success" },
      { label: "Pending Tasks", value: `${pendingCount} open items`, tone: pendingCount ? "alert" : "calm" },
      { label: "KPI Snapshot", value: "73/100 provisional score", tone: "calm" },
    ],
    todayPlan: plan.rows.slice(0, 2).map((row) => ({
      title: row.activity,
      meta: `Planned for ${row.workDate}`,
      hint: row.expectedOutput,
    })),
    pending: plan.rows
      .filter((row) => row.rowStatus === "pending" || row.rowStatus === "overdue")
      .map((row) => ({
        title: row.activity,
        meta: row.rowStatus === "overdue" ? "Overdue task" : "Pending task",
        hint: row.expectedOutput,
      })),
    approvals: [
      {
        title: plan.status === "submitted" ? "Manager review in progress" : "Work Plan awaiting approval",
        meta: `Current status: ${plan.status.replaceAll("_", " ")}`,
        hint: "The approved plan becomes the source for the Today screen.",
      },
      {
        title: "Monthly report lock after approval",
        meta: "Snapshot retained",
        hint: "Final approved reports remain printable even if tasks change later.",
      },
    ],
  };
}

function matchRoute(pathname: string, pattern: RegExp) {
  return pathname.match(pattern);
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

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const body = await parseJson<LoginInput>(request);
      const user = mockUsers.find(
        (entry) => entry.employeeCode.toLowerCase() === body.employeeCode.toLowerCase() && entry.password === body.password,
      );

      if (!user) {
        return error("Invalid employee code or password.", 401);
      }

      const token = crypto.randomUUID();
      sessions.set(token, user.id);
      return json(publicUser(user), {
        headers: sessionHeader(token),
      });
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const token = readCookie(request, SESSION_COOKIE);
      if (token) {
        sessions.delete(token);
      }

      return json(
        { success: true },
        {
          headers: clearSessionHeader(),
        },
      );
    }

    if (url.pathname === "/api/auth/me") {
      const user = getUserFromRequest(request);
      if (!user) {
        return error("No active session.", 401);
      }
      return json(user);
    }

    const auth = requireUser(request);
    if (auth instanceof Response) {
      return auth;
    }

    const user = auth;

    if (url.pathname === "/api/meta/navigation") {
      return json(navByRole(user.role));
    }

    if (url.pathname === "/api/dashboard/summary") {
      return json(summarizeDashboard(user));
    }

    if (url.pathname === "/api/blueprint/routes") {
      return json({
        employee: ["/api/work-plans", "/api/daily-sheets", "/api/monthly-reports", "/api/kpis"],
        manager: ["/api/team/work-plans", "/api/team/reports", "/api/team/kpis"],
        admin: ["/api/admin/users", "/api/admin/templates", "/api/admin/exports"],
      });
    }

    if (url.pathname === "/api/work-plans/current" && request.method === "GET") {
      const month = Number(url.searchParams.get("month") ?? 3);
      const year = Number(url.searchParams.get("year") ?? 2026);
      return json(getOrCreatePlan(user, month, year));
    }

    const planMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)$/);
    if (planMatch && request.method === "PATCH") {
      const body = await parseJson<{ preparedDate?: string }>(request);
      const planId = planMatch[1];
      const plan = Array.from(workPlans.values()).find((entry) => entry.id === planId && entry.userId === user.id);

      if (!plan) {
        return error("Work plan not found.", 404);
      }

      plan.preparedDate = body.preparedDate ?? plan.preparedDate;
      return json(plan);
    }

    const rowCreateMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/rows$/);
    if (rowCreateMatch && request.method === "POST") {
      const planId = rowCreateMatch[1];
      const plan = Array.from(workPlans.values()).find((entry) => entry.id === planId && entry.userId === user.id);
      if (!plan) return error("Work plan not found.", 404);

      const body = await parseJson<WorkPlanRowInput>(request);
      const row: WorkPlanRow = {
        id: crypto.randomUUID(),
        serialNo: plan.rows.length + 1,
        workDate: body.workDate,
        activity: body.activity,
        expectedOutput: body.expectedOutput,
        rowType: body.rowType,
        rowStatus: "planned",
      };
      plan.rows.push(row);
      return json(row, { status: 201 });
    }

    const rowUpdateMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/rows\/([^/]+)$/);
    if (rowUpdateMatch && request.method === "PATCH") {
      const [, planId, rowId] = rowUpdateMatch;
      const plan = Array.from(workPlans.values()).find((entry) => entry.id === planId && entry.userId === user.id);
      if (!plan) return error("Work plan not found.", 404);

      const row = plan.rows.find((entry) => entry.id === rowId);
      if (!row) return error("Work plan row not found.", 404);

      const body = await parseJson<WorkPlanRowInput>(request);
      row.workDate = body.workDate;
      row.activity = body.activity;
      row.expectedOutput = body.expectedOutput;
      row.rowType = body.rowType;
      return json(row);
    }

    if (rowUpdateMatch && request.method === "DELETE") {
      const [, planId, rowId] = rowUpdateMatch;
      const plan = Array.from(workPlans.values()).find((entry) => entry.id === planId && entry.userId === user.id);
      if (!plan) return error("Work plan not found.", 404);

      plan.rows = plan.rows.filter((entry) => entry.id !== rowId).map((entry, index) => ({
        ...entry,
        serialNo: index + 1,
      }));
      return json({ success: true });
    }

    const travelCreateMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/travel-rows$/);
    if (travelCreateMatch && request.method === "POST") {
      const planId = travelCreateMatch[1];
      const plan = Array.from(workPlans.values()).find((entry) => entry.id === planId && entry.userId === user.id);
      if (!plan) return error("Work plan not found.", 404);

      const body = await parseJson<TravelPlanRowInput>(request);
      const row: TravelPlanRow = {
        id: crypto.randomUUID(),
        serialNo: plan.travelRows.length + 1,
        travelDate: body.travelDate,
        destination: body.destination,
        purpose: body.purpose,
        expectedOutput: body.expectedOutput,
        status: "planned",
      };
      plan.travelRows.push(row);
      return json(row, { status: 201 });
    }

    const travelUpdateMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/travel-rows\/([^/]+)$/);
    if (travelUpdateMatch && request.method === "PATCH") {
      const [, planId, rowId] = travelUpdateMatch;
      const plan = Array.from(workPlans.values()).find((entry) => entry.id === planId && entry.userId === user.id);
      if (!plan) return error("Work plan not found.", 404);

      const row = plan.travelRows.find((entry) => entry.id === rowId);
      if (!row) return error("Travel row not found.", 404);

      const body = await parseJson<TravelPlanRowInput>(request);
      row.travelDate = body.travelDate;
      row.destination = body.destination;
      row.purpose = body.purpose;
      row.expectedOutput = body.expectedOutput;
      return json(row);
    }

    if (travelUpdateMatch && request.method === "DELETE") {
      const [, planId, rowId] = travelUpdateMatch;
      const plan = Array.from(workPlans.values()).find((entry) => entry.id === planId && entry.userId === user.id);
      if (!plan) return error("Work plan not found.", 404);

      plan.travelRows = plan.travelRows.filter((entry) => entry.id !== rowId).map((entry, index) => ({
        ...entry,
        serialNo: index + 1,
      }));
      return json({ success: true });
    }

    const submitMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/submit$/);
    if (submitMatch && request.method === "POST") {
      const planId = submitMatch[1];
      const plan = Array.from(workPlans.values()).find((entry) => entry.id === planId && entry.userId === user.id);
      if (!plan) return error("Work plan not found.", 404);

      plan.status = "submitted";
      return json(plan);
    }

    return env.ASSETS.fetch(request);
  },
};
