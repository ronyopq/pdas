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
  DB: D1Database;
  SESSIONS?: KVNamespace;
  APP_NAME?: string;
  APP_TIMEZONE?: string;
}

interface MockUser extends UserSession {
  password: string;
}

interface PlanRecord {
  id: string;
  user_id: string;
  month: number;
  year: number;
  prepared_date: string;
  status: MonthlyWorkPlan["status"];
}

interface PlanRowRecord {
  id: string;
  serial_no: number;
  work_date: string;
  planned_activity: string | null;
  expected_output: string | null;
  row_type: WorkPlanRow["rowType"];
  row_status: WorkPlanRow["rowStatus"];
}

interface TravelRowRecord {
  id: string;
  serial_no: number;
  travel_date: string;
  destination: string;
  purpose: string | null;
  expected_output: string | null;
  status: TravelPlanRow["status"];
}

const SESSION_COOKIE = "praan_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const memorySessions = new Map<string, string>();

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

async function persistSession(env: Env, token: string, userId: string) {
  memorySessions.set(token, userId);

  if (env.SESSIONS) {
    await env.SESSIONS.put(token, userId, {
      expirationTtl: SESSION_TTL_SECONDS,
    });
  }
}

async function destroySession(env: Env, token: string) {
  memorySessions.delete(token);
  if (env.SESSIONS) {
    await env.SESSIONS.delete(token);
  }
}

async function readSession(env: Env, token: string): Promise<string | null> {
  if (env.SESSIONS) {
    const userId = await env.SESSIONS.get(token);
    if (userId) return userId;
  }

  return memorySessions.get(token) ?? null;
}

async function getUserFromRequest(request: Request, env: Env): Promise<UserSession | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const userId = await readSession(env, token);
  if (!userId) return null;

  const user = mockUsers.find((entry) => entry.id === userId);
  return user ? publicUser(user) : null;
}

async function requireUser(request: Request, env: Env): Promise<UserSession | Response> {
  const user = await getUserFromRequest(request, env);
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

function seededRows(): WorkPlanRowInput[] {
  return [
    {
      workDate: "2026-03-01",
      activity: "KPI format preparation",
      expectedOutput: "Draft KPI format prepared",
      rowType: "regular_work",
    },
    {
      workDate: "2026-03-02",
      activity: "KPI format finalization",
      expectedOutput: "Final KPI format approved",
      rowType: "regular_work",
    },
    {
      workDate: "2026-03-03",
      activity: "Prep for Women's Day",
      expectedOutput: "Event materials designed and ready",
      rowType: "regular_work",
    },
    {
      workDate: "2026-03-12",
      activity: "Follow-up meeting with developer for KHANI website update",
      expectedOutput: "Website update plan discussed",
      rowType: "meeting",
    },
    {
      workDate: "2026-03-29",
      activity: "Prepared monthly report and submitted",
      expectedOutput: "Monthly report submitted",
      rowType: "regular_work",
    },
  ];
}

function seededTravelRows(): TravelPlanRowInput[] {
  return [
    {
      travelDate: "2026-03-03",
      destination: "Subarnachar",
      purpose: "Collect woman farmer information",
      expectedOutput: "Field notes and source stories",
    },
    {
      travelDate: "2026-03-08",
      destination: "Women's Day event venue",
      purpose: "Coverage and documentation",
      expectedOutput: "Photos and social post assets",
    },
  ];
}

function matchRoute(pathname: string, pattern: RegExp) {
  return pathname.match(pattern);
}

async function fetchPlanRows(env: Env, planId: string): Promise<WorkPlanRow[]> {
  const rows = await env.DB.prepare(
    `
      SELECT id, serial_no, work_date, planned_activity, expected_output, row_type, row_status
      FROM monthly_work_plan_rows
      WHERE work_plan_id = ?
      ORDER BY serial_no ASC
    `,
  )
    .bind(planId)
    .all<PlanRowRecord>();

  return rows.results.map((row) => ({
    id: row.id,
    serialNo: row.serial_no,
    workDate: row.work_date,
    activity: row.planned_activity ?? "",
    expectedOutput: row.expected_output ?? "",
    rowType: row.row_type,
    rowStatus: row.row_status,
  }));
}

async function fetchTravelRows(env: Env, planId: string): Promise<TravelPlanRow[]> {
  const rows = await env.DB.prepare(
    `
      SELECT id, serial_no, travel_date, destination, purpose, expected_output, status
      FROM monthly_travel_plan_rows
      WHERE work_plan_id = ?
      ORDER BY serial_no ASC
    `,
  )
    .bind(planId)
    .all<TravelRowRecord>();

  return rows.results.map((row) => ({
    id: row.id,
    serialNo: row.serial_no,
    travelDate: row.travel_date,
    destination: row.destination,
    purpose: row.purpose ?? "",
    expectedOutput: row.expected_output ?? "",
    status: row.status,
  }));
}

async function hydratePlan(env: Env, record: PlanRecord, user: UserSession): Promise<MonthlyWorkPlan> {
  const [rows, travelRows] = await Promise.all([fetchPlanRows(env, record.id), fetchTravelRows(env, record.id)]);

  return {
    id: record.id,
    userId: record.user_id,
    month: record.month,
    year: record.year,
    preparedDate: record.prepared_date,
    status: record.status,
    employeeName: user.fullName,
    designation: user.designation,
    projectName: user.projectName,
    supervisorName: user.managerName,
    rows,
    travelRows,
  };
}

async function findPlanRecord(env: Env, userId: string, month: number, year: number) {
  return env.DB.prepare(
    `
      SELECT id, user_id, month, year, prepared_date, status
      FROM monthly_work_plans
      WHERE user_id = ? AND month = ? AND year = ?
      ORDER BY version_no DESC
      LIMIT 1
    `,
  )
    .bind(userId, month, year)
    .first<PlanRecord>();
}

async function findPlanRecordById(env: Env, planId: string, userId: string) {
  return env.DB.prepare(
    `
      SELECT id, user_id, month, year, prepared_date, status
      FROM monthly_work_plans
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
  )
    .bind(planId, userId)
    .first<PlanRecord>();
}

async function createSeedPlan(env: Env, user: UserSession, month: number, year: number) {
  const planId = crypto.randomUUID();
  const preparedDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const statements = [
    env.DB.prepare(
      `
        INSERT INTO monthly_work_plans (
          id, user_id, month, year, prepared_date, status, version_no
        ) VALUES (?, ?, ?, ?, ?, 'draft', 1)
      `,
    ).bind(planId, user.id, month, year, preparedDate),
  ];

  seededRows().forEach((row, index) => {
    statements.push(
      env.DB.prepare(
        `
          INSERT INTO monthly_work_plan_rows (
            id, work_plan_id, serial_no, work_date, row_type, planned_activity, expected_output, row_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).bind(
        crypto.randomUUID(),
        planId,
        index + 1,
        row.workDate,
        row.rowType,
        row.activity,
        row.expectedOutput,
        index === 3 ? "pending" : "planned",
      ),
    );
  });

  seededTravelRows().forEach((row, index) => {
    statements.push(
      env.DB.prepare(
        `
          INSERT INTO monthly_travel_plan_rows (
            id, work_plan_id, serial_no, travel_date, destination, purpose, expected_output, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).bind(
        crypto.randomUUID(),
        planId,
        index + 1,
        row.travelDate,
        row.destination,
        row.purpose,
        row.expectedOutput,
        index === 1 ? "pending" : "planned",
      ),
    );
  });

  await env.DB.batch(statements);
  const record = await findPlanRecord(env, user.id, month, year);

  if (!record) {
    throw new Error("Failed to create seed work plan.");
  }

  return hydratePlan(env, record, user);
}

async function ensurePlan(env: Env, user: UserSession, month: number, year: number) {
  const existing = await findPlanRecord(env, user.id, month, year);
  if (existing) {
    return hydratePlan(env, existing, user);
  }

  return createSeedPlan(env, user, month, year);
}

async function summarizeDashboard(env: Env, user: UserSession): Promise<DashboardPayload> {
  const plan = await ensurePlan(env, user, 3, 2026);
  const pendingRows = plan.rows.filter((row) => row.rowStatus === "pending" || row.rowStatus === "overdue");
  const submittedText = plan.status === "submitted" ? "Submitted for review" : "Draft ready for manager review";

  return {
    summary: [
      { label: "Plan Status", value: submittedText, tone: plan.status === "submitted" ? "success" : "focus" },
      { label: "Daily Submission", value: "21/24 working days submitted", tone: "success" },
      { label: "Pending Tasks", value: `${pendingRows.length} open items`, tone: pendingRows.length ? "alert" : "calm" },
      { label: "KPI Snapshot", value: "73/100 provisional score", tone: "calm" },
    ],
    todayPlan: plan.rows.slice(0, 2).map((row) => ({
      title: row.activity,
      meta: `Planned for ${row.workDate}`,
      hint: row.expectedOutput,
    })),
    pending: pendingRows.map((row) => ({
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

async function resequencePlanRows(env: Env, planId: string) {
  const rows = await env.DB.prepare(
    `
      SELECT id
      FROM monthly_work_plan_rows
      WHERE work_plan_id = ?
      ORDER BY serial_no ASC
    `,
  )
    .bind(planId)
    .all<{ id: string }>();

  await env.DB.batch(
    rows.results.map((row, index) =>
      env.DB.prepare(
        `
          UPDATE monthly_work_plan_rows
          SET serial_no = ?
          WHERE id = ?
        `,
      ).bind(index + 1, row.id),
    ),
  );
}

async function resequenceTravelRows(env: Env, planId: string) {
  const rows = await env.DB.prepare(
    `
      SELECT id
      FROM monthly_travel_plan_rows
      WHERE work_plan_id = ?
      ORDER BY serial_no ASC
    `,
  )
    .bind(planId)
    .all<{ id: string }>();

  await env.DB.batch(
    rows.results.map((row, index) =>
      env.DB.prepare(
        `
          UPDATE monthly_travel_plan_rows
          SET serial_no = ?
          WHERE id = ?
        `,
      ).bind(index + 1, row.id),
    ),
  );
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
      await persistSession(env, token, user.id);

      return json(publicUser(user), {
        headers: sessionHeader(token),
      });
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const token = readCookie(request, SESSION_COOKIE);
      if (token) {
        await destroySession(env, token);
      }

      return json(
        { success: true },
        {
          headers: clearSessionHeader(),
        },
      );
    }

    if (url.pathname === "/api/auth/me") {
      const user = await getUserFromRequest(request, env);
      if (!user) {
        return error("No active session.", 401);
      }
      return json(user);
    }

    const auth = await requireUser(request, env);
    if (auth instanceof Response) {
      return auth;
    }

    const user = auth;

    if (url.pathname === "/api/meta/navigation") {
      return json(navByRole(user.role));
    }

    if (url.pathname === "/api/dashboard/summary") {
      return json(await summarizeDashboard(env, user));
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
      return json(await ensurePlan(env, user, month, year));
    }

    const planMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)$/);
    if (planMatch && request.method === "PATCH") {
      const body = await parseJson<{ preparedDate?: string }>(request);
      const planId = planMatch[1];
      const plan = await findPlanRecordById(env, planId, user.id);

      if (!plan) {
        return error("Work plan not found.", 404);
      }

      await env.DB.prepare(
        `
          UPDATE monthly_work_plans
          SET prepared_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      )
        .bind(body.preparedDate ?? plan.prepared_date, planId)
        .run();

      return json(await hydratePlan(env, { ...plan, prepared_date: body.preparedDate ?? plan.prepared_date }, user));
    }

    const rowCreateMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/rows$/);
    if (rowCreateMatch && request.method === "POST") {
      const planId = rowCreateMatch[1];
      const plan = await findPlanRecordById(env, planId, user.id);
      if (!plan) return error("Work plan not found.", 404);

      const body = await parseJson<WorkPlanRowInput>(request);
      const serialResult = await env.DB.prepare(
        `
          SELECT COALESCE(MAX(serial_no), 0) AS last_serial
          FROM monthly_work_plan_rows
          WHERE work_plan_id = ?
        `,
      )
        .bind(planId)
        .first<{ last_serial: number }>();

      const rowId = crypto.randomUUID();
      const serialNo = (serialResult?.last_serial ?? 0) + 1;
      await env.DB.prepare(
        `
          INSERT INTO monthly_work_plan_rows (
            id, work_plan_id, serial_no, work_date, row_type, planned_activity, expected_output, row_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'planned')
        `,
      )
        .bind(rowId, planId, serialNo, body.workDate, body.rowType, body.activity, body.expectedOutput)
        .run();

      return json(
        {
          id: rowId,
          serialNo,
          workDate: body.workDate,
          activity: body.activity,
          expectedOutput: body.expectedOutput,
          rowType: body.rowType,
          rowStatus: "planned",
        } satisfies WorkPlanRow,
        { status: 201 },
      );
    }

    const rowUpdateMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/rows\/([^/]+)$/);
    if (rowUpdateMatch && request.method === "PATCH") {
      const [, planId, rowId] = rowUpdateMatch;
      const plan = await findPlanRecordById(env, planId, user.id);
      if (!plan) return error("Work plan not found.", 404);

      const body = await parseJson<WorkPlanRowInput>(request);
      await env.DB.prepare(
        `
          UPDATE monthly_work_plan_rows
          SET work_date = ?, planned_activity = ?, expected_output = ?, row_type = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND work_plan_id = ?
        `,
      )
        .bind(body.workDate, body.activity, body.expectedOutput, body.rowType, rowId, planId)
        .run();

      const row = await env.DB.prepare(
        `
          SELECT id, serial_no, work_date, planned_activity, expected_output, row_type, row_status
          FROM monthly_work_plan_rows
          WHERE id = ?
        `,
      )
        .bind(rowId)
        .first<PlanRowRecord>();

      if (!row) return error("Work plan row not found.", 404);

      return json({
        id: row.id,
        serialNo: row.serial_no,
        workDate: row.work_date,
        activity: row.planned_activity ?? "",
        expectedOutput: row.expected_output ?? "",
        rowType: row.row_type,
        rowStatus: row.row_status,
      } satisfies WorkPlanRow);
    }

    if (rowUpdateMatch && request.method === "DELETE") {
      const [, planId, rowId] = rowUpdateMatch;
      const plan = await findPlanRecordById(env, planId, user.id);
      if (!plan) return error("Work plan not found.", 404);

      await env.DB.prepare(
        `
          DELETE FROM monthly_work_plan_rows
          WHERE id = ? AND work_plan_id = ?
        `,
      )
        .bind(rowId, planId)
        .run();

      await resequencePlanRows(env, planId);
      return json({ success: true });
    }

    const travelCreateMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/travel-rows$/);
    if (travelCreateMatch && request.method === "POST") {
      const planId = travelCreateMatch[1];
      const plan = await findPlanRecordById(env, planId, user.id);
      if (!plan) return error("Work plan not found.", 404);

      const body = await parseJson<TravelPlanRowInput>(request);
      const serialResult = await env.DB.prepare(
        `
          SELECT COALESCE(MAX(serial_no), 0) AS last_serial
          FROM monthly_travel_plan_rows
          WHERE work_plan_id = ?
        `,
      )
        .bind(planId)
        .first<{ last_serial: number }>();

      const rowId = crypto.randomUUID();
      const serialNo = (serialResult?.last_serial ?? 0) + 1;

      await env.DB.prepare(
        `
          INSERT INTO monthly_travel_plan_rows (
            id, work_plan_id, serial_no, travel_date, destination, purpose, expected_output, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'planned')
        `,
      )
        .bind(rowId, planId, serialNo, body.travelDate, body.destination, body.purpose, body.expectedOutput)
        .run();

      return json(
        {
          id: rowId,
          serialNo,
          travelDate: body.travelDate,
          destination: body.destination,
          purpose: body.purpose,
          expectedOutput: body.expectedOutput,
          status: "planned",
        } satisfies TravelPlanRow,
        { status: 201 },
      );
    }

    const travelUpdateMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/travel-rows\/([^/]+)$/);
    if (travelUpdateMatch && request.method === "PATCH") {
      const [, planId, rowId] = travelUpdateMatch;
      const plan = await findPlanRecordById(env, planId, user.id);
      if (!plan) return error("Work plan not found.", 404);

      const body = await parseJson<TravelPlanRowInput>(request);
      await env.DB.prepare(
        `
          UPDATE monthly_travel_plan_rows
          SET travel_date = ?, destination = ?, purpose = ?, expected_output = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND work_plan_id = ?
        `,
      )
        .bind(body.travelDate, body.destination, body.purpose, body.expectedOutput, rowId, planId)
        .run();

      const row = await env.DB.prepare(
        `
          SELECT id, serial_no, travel_date, destination, purpose, expected_output, status
          FROM monthly_travel_plan_rows
          WHERE id = ?
        `,
      )
        .bind(rowId)
        .first<TravelRowRecord>();

      if (!row) return error("Travel row not found.", 404);

      return json({
        id: row.id,
        serialNo: row.serial_no,
        travelDate: row.travel_date,
        destination: row.destination,
        purpose: row.purpose ?? "",
        expectedOutput: row.expected_output ?? "",
        status: row.status,
      } satisfies TravelPlanRow);
    }

    if (travelUpdateMatch && request.method === "DELETE") {
      const [, planId, rowId] = travelUpdateMatch;
      const plan = await findPlanRecordById(env, planId, user.id);
      if (!plan) return error("Work plan not found.", 404);

      await env.DB.prepare(
        `
          DELETE FROM monthly_travel_plan_rows
          WHERE id = ? AND work_plan_id = ?
        `,
      )
        .bind(rowId, planId)
        .run();

      await resequenceTravelRows(env, planId);
      return json({ success: true });
    }

    const submitMatch = matchRoute(url.pathname, /^\/api\/work-plans\/([^/]+)\/submit$/);
    if (submitMatch && request.method === "POST") {
      const planId = submitMatch[1];
      const plan = await findPlanRecordById(env, planId, user.id);
      if (!plan) return error("Work plan not found.", 404);

      await env.DB.prepare(
        `
          UPDATE monthly_work_plans
          SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      )
        .bind(planId)
        .run();

      return json(
        await hydratePlan(
          env,
          {
            ...plan,
            status: "submitted",
          },
          user,
        ),
      );
    }

    return env.ASSETS.fetch(request);
  },
};
