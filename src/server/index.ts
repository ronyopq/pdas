/// <reference types="@cloudflare/workers-types" />

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type {
  ApiResponse,
  DailyActivityRow,
  DailyActivityRowInput,
  DailyActivityStatus,
  DailySheet,
  DashboardPayload,
  LoginInput,
  MonthlyReport,
  MonthlyReportItem,
  MonthlyReportStatus,
  MonthlyWorkPlan,
  NavigationItem,
  PendingActionInput,
  PendingItem,
  TaskLinkOption,
  TravelPlanRow,
  TravelPlanRowInput,
  UserRole,
  UserSession,
  WorkPlanRow,
  WorkPlanRowInput,
} from "../shared/domain";
import * as XLSX from "xlsx";

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
  remarks?: string | null;
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

interface DailySheetRecord {
  id: string;
  user_id: string;
  work_date: string;
  status: DailySheet["status"];
  note: string | null;
}

interface DailyRowRecord {
  id: string;
  line_no: number;
  linked_plan_row_id: string | null;
  linked_travel_row_id: string | null;
  start_time: string | null;
  end_time: string | null;
  actual_activity: string;
  actual_output: string | null;
  status: DailyActivityRow["status"];
  delivery_required: number;
  delivery_done: number;
  is_ad_hoc: number;
  ad_hoc_reason: string | null;
  carry_forward_action: DailyActivityRow["carryForwardAction"];
  row_note: string | null;
  plan_activity: string | null;
  travel_destination: string | null;
}

interface MonthlyReportRecord {
  id: string;
  user_id: string;
  month: number;
  year: number;
  version_no: number;
  report_status: MonthlyReportStatus;
  project_name_snapshot: string | null;
  designation_snapshot: string | null;
  submission_date: string | null;
  completed_tasks_snapshot_json: string;
  ongoing_tasks_snapshot_json: string;
  next_month_tasks_snapshot_json: string;
  lessons_learned: string | null;
  comments: string | null;
}

interface ReportDailyRecord {
  id: string;
  work_date: string;
  actual_activity: string;
  actual_output: string | null;
  status: DailyActivityRow["status"];
  is_ad_hoc: number;
  ad_hoc_reason: string | null;
  plan_activity: string | null;
  plan_output: string | null;
  travel_destination: string | null;
  travel_output: string | null;
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

function currentDateInTimeZone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "03";
  const day = parts.find((part) => part.type === "day")?.value ?? "09";

  return `${year}-${month}-${day}`;
}

function monthYearFromDate(workDate: string) {
  const [year, month] = workDate.split("-").map(Number);
  return { month, year };
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
      workDate: "2026-03-09",
      activity: "KHANI Women's Day event preparation and blog post",
      expectedOutput: "KHANI event plan finalized",
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

function mapDailyStatusToPlanStatus(status: DailyActivityStatus): WorkPlanRow["rowStatus"] {
  switch (status) {
    case "completed":
      return "completed";
    case "in_progress":
      return "in_progress";
    case "deferred":
      return "pending";
    case "cancelled":
      return "cancelled";
    default:
      return "planned";
  }
}

function mapStatusesToPlanStatus(statuses: DailyActivityStatus[]): WorkPlanRow["rowStatus"] {
  if (statuses.includes("completed")) return "completed";
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.includes("deferred")) return "pending";
  if (statuses.includes("cancelled")) return "cancelled";
  return "planned";
}

function mapStatusesToTravelStatus(statuses: DailyActivityStatus[]): TravelPlanRow["status"] {
  if (statuses.includes("completed")) return "completed";
  if (statuses.includes("cancelled")) return "cancelled";
  if (statuses.includes("in_progress") || statuses.includes("deferred") || statuses.includes("not_started")) {
    return "pending";
  }
  return "planned";
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

async function syncOverdueStatuses(env: Env, planId: string, workDate: string) {
  await env.DB.batch([
    env.DB.prepare(
      `
        UPDATE monthly_work_plan_rows
        SET row_status = 'overdue', updated_at = CURRENT_TIMESTAMP
        WHERE work_plan_id = ?
          AND work_date < ?
          AND row_status IN ('planned', 'in_progress', 'pending')
      `,
    ).bind(planId, workDate),
    env.DB.prepare(
      `
        UPDATE monthly_travel_plan_rows
        SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
        WHERE work_plan_id = ?
          AND travel_date < ?
          AND status IN ('planned', 'pending')
      `,
    ).bind(planId, workDate),
  ]);
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
        row.workDate < "2026-03-09" ? "pending" : "planned",
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
  const referenceDate = currentDateInTimeZone(env.APP_TIMEZONE ?? "Asia/Dhaka");

  if (existing) {
    await syncOverdueStatuses(env, existing.id, referenceDate);
    return hydratePlan(env, existing, user);
  }

  const plan = await createSeedPlan(env, user, month, year);
  await syncOverdueStatuses(env, plan.id, referenceDate);
  return plan;
}

async function summarizeDashboard(env: Env, user: UserSession): Promise<DashboardPayload> {
  const today = currentDateInTimeZone(env.APP_TIMEZONE ?? "Asia/Dhaka");
  const { month, year } = monthYearFromDate(today);
  const plan = await ensurePlan(env, user, month, year);
  const pendingRows = plan.rows.filter((row) => row.rowStatus === "pending" || row.rowStatus === "overdue");
  const submittedText = plan.status === "submitted" ? "Submitted for review" : "Draft ready for manager review";

  return {
    summary: [
      { label: "Plan Status", value: submittedText, tone: plan.status === "submitted" ? "success" : "focus" },
      { label: "Daily Submission", value: "21/24 working days submitted", tone: "success" },
      { label: "Pending Tasks", value: `${pendingRows.length} open items`, tone: pendingRows.length ? "alert" : "calm" },
      { label: "KPI Snapshot", value: "73/100 provisional score", tone: "calm" },
    ],
    todayPlan: plan.rows
      .filter((row) => row.workDate === today || row.rowStatus === "pending" || row.rowStatus === "overdue")
      .slice(0, 3)
      .map((row) => ({
        title: row.activity,
        meta: row.workDate === today ? "Due today" : `Open from ${row.workDate}`,
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

async function findDailySheetRecord(env: Env, userId: string, workDate: string) {
  return env.DB.prepare(
    `
      SELECT id, user_id, work_date, status, note
      FROM daily_sheets
      WHERE user_id = ? AND work_date = ?
      LIMIT 1
    `,
  )
    .bind(userId, workDate)
    .first<DailySheetRecord>();
}

async function ensureDailySheetRecord(env: Env, user: UserSession, workDate: string) {
  const existing = await findDailySheetRecord(env, user.id, workDate);
  if (existing) return existing;

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `
      INSERT INTO daily_sheets (id, user_id, work_date, status, note)
      VALUES (?, ?, ?, 'draft', '')
    `,
  )
    .bind(id, user.id, workDate)
    .run();

  const record = await findDailySheetRecord(env, user.id, workDate);
  if (!record) throw new Error("Unable to create daily sheet.");
  return record;
}

async function fetchTaskOptions(env: Env, planId: string, workDate: string): Promise<TaskLinkOption[]> {
  const [planRows, travelRows] = await Promise.all([
    env.DB.prepare(
      `
        SELECT id, work_date, planned_activity, expected_output, row_status
        FROM monthly_work_plan_rows
        WHERE work_plan_id = ?
          AND (
            work_date = ?
            OR row_status IN ('pending', 'overdue', 'in_progress')
          )
          AND row_status NOT IN ('completed', 'cancelled', 'moved_next_month')
        ORDER BY work_date ASC, serial_no ASC
      `,
    )
      .bind(planId, workDate)
      .all<{
        id: string;
        work_date: string;
        planned_activity: string | null;
        expected_output: string | null;
      }>(),
    env.DB.prepare(
      `
        SELECT id, travel_date, destination, expected_output, status
        FROM monthly_travel_plan_rows
        WHERE work_plan_id = ?
          AND (
            travel_date = ?
            OR status IN ('pending', 'overdue')
          )
          AND status NOT IN ('completed', 'cancelled')
        ORDER BY travel_date ASC, serial_no ASC
      `,
    )
      .bind(planId, workDate)
      .all<{
        id: string;
        travel_date: string;
        destination: string;
        expected_output: string | null;
      }>(),
  ]);

  return [
    ...planRows.results.map((row) => ({
      id: row.id,
      kind: "plan" as const,
      label: row.planned_activity ?? "Untitled plan row",
      meta: row.work_date === workDate ? "Planned today" : `Open from ${row.work_date}`,
      expectedOutput: row.expected_output ?? "",
    })),
    ...travelRows.results.map((row) => ({
      id: row.id,
      kind: "travel" as const,
      label: `Travel: ${row.destination}`,
      meta: row.travel_date === workDate ? "Travel due today" : `Travel open from ${row.travel_date}`,
      expectedOutput: row.expected_output ?? "",
    })),
  ];
}

async function fetchDailyRows(env: Env, sheetId: string): Promise<DailyActivityRow[]> {
  const rows = await env.DB.prepare(
    `
      SELECT
        dar.id,
        dar.line_no,
        dar.linked_plan_row_id,
        dar.linked_travel_row_id,
        dar.start_time,
        dar.end_time,
        dar.actual_activity,
        dar.actual_output,
        dar.status,
        dar.delivery_required,
        dar.delivery_done,
        dar.is_ad_hoc,
        dar.ad_hoc_reason,
        dar.carry_forward_action,
        dar.row_note,
        pr.planned_activity AS plan_activity,
        tr.destination AS travel_destination
      FROM daily_activity_rows dar
      LEFT JOIN monthly_work_plan_rows pr ON pr.id = dar.linked_plan_row_id
      LEFT JOIN monthly_travel_plan_rows tr ON tr.id = dar.linked_travel_row_id
      WHERE dar.daily_sheet_id = ?
      ORDER BY dar.line_no ASC
    `,
  )
    .bind(sheetId)
    .all<DailyRowRecord>();

  return rows.results.map((row) => ({
    id: row.id,
    lineNo: row.line_no,
    linkedPlanRowId: row.linked_plan_row_id,
    linkedTravelRowId: row.linked_travel_row_id,
    linkLabel: row.plan_activity ?? (row.travel_destination ? `Travel: ${row.travel_destination}` : null),
    startTime: row.start_time ?? "",
    endTime: row.end_time ?? "",
    actualActivity: row.actual_activity,
    actualOutput: row.actual_output ?? "",
    status: row.status,
    deliveryRequired: row.delivery_required === 1,
    deliveryDone: row.delivery_done === 1,
    isAdHoc: row.is_ad_hoc === 1,
    adHocReason: row.ad_hoc_reason ?? "",
    carryForwardAction: row.carry_forward_action,
    rowNote: row.row_note ?? "",
  }));
}

async function hydrateDailySheet(env: Env, record: DailySheetRecord, user: UserSession): Promise<DailySheet> {
  const { month, year } = monthYearFromDate(record.work_date);
  const plan = await ensurePlan(env, user, month, year);
  const [rows, taskOptions] = await Promise.all([
    fetchDailyRows(env, record.id),
    fetchTaskOptions(env, plan.id, record.work_date),
  ]);

  return {
    id: record.id,
    userId: record.user_id,
    workDate: record.work_date,
    status: record.status,
    note: record.note ?? "",
    rows,
    taskOptions,
  };
}

async function recomputePlanRowStatus(env: Env, planRowId: string) {
  const result = await env.DB.prepare(
    `
      SELECT status
      FROM daily_activity_rows
      WHERE linked_plan_row_id = ?
    `,
  )
    .bind(planRowId)
    .all<{ status: DailyActivityStatus }>();

  const nextStatus = mapStatusesToPlanStatus(result.results.map((row) => row.status));

  await env.DB.prepare(
    `
      UPDATE monthly_work_plan_rows
      SET row_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  )
    .bind(nextStatus, planRowId)
    .run();
}

async function recomputeTravelRowStatus(env: Env, travelRowId: string) {
  const result = await env.DB.prepare(
    `
      SELECT status
      FROM daily_activity_rows
      WHERE linked_travel_row_id = ?
    `,
  )
    .bind(travelRowId)
    .all<{ status: DailyActivityStatus }>();

  const nextStatus = mapStatusesToTravelStatus(result.results.map((row) => row.status));

  await env.DB.prepare(
    `
      UPDATE monthly_travel_plan_rows
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  )
    .bind(nextStatus, travelRowId)
    .run();
}

async function resyncLinkedTargets(
  env: Env,
  target: { oldPlanId: string | null; newPlanId: string | null; oldTravelId: string | null; newTravelId: string | null },
) {
  const planIds = new Set([target.oldPlanId, target.newPlanId].filter((value): value is string => Boolean(value)));
  const travelIds = new Set(
    [target.oldTravelId, target.newTravelId].filter((value): value is string => Boolean(value)),
  );

  for (const planId of planIds) {
    await recomputePlanRowStatus(env, planId);
  }

  for (const travelId of travelIds) {
    await recomputeTravelRowStatus(env, travelId);
  }
}

async function markOpenRowsAsPending(env: Env, user: UserSession, workDate: string) {
  const { month, year } = monthYearFromDate(workDate);
  const plan = await ensurePlan(env, user, month, year);

  await env.DB.batch([
    env.DB.prepare(
      `
        UPDATE monthly_work_plan_rows
        SET row_status = 'pending', updated_at = CURRENT_TIMESTAMP
        WHERE work_plan_id = ?
          AND work_date = ?
          AND row_status IN ('planned', 'in_progress')
      `,
    ).bind(plan.id, workDate),
    env.DB.prepare(
      `
        UPDATE monthly_travel_plan_rows
        SET status = 'pending', updated_at = CURRENT_TIMESTAMP
        WHERE work_plan_id = ?
          AND travel_date = ?
          AND status = 'planned'
      `,
    ).bind(plan.id, workDate),
  ]);

  await syncOverdueStatuses(env, plan.id, workDate);
}

async function fetchPendingItemsForDate(env: Env, user: UserSession, workDate: string): Promise<PendingItem[]> {
  const { month, year } = monthYearFromDate(workDate);
  const plan = await ensurePlan(env, user, month, year);

  const [planRows, travelRows] = await Promise.all([
    env.DB.prepare(
      `
        SELECT id, work_date, planned_activity, expected_output, row_status, remarks
        FROM monthly_work_plan_rows
        WHERE work_plan_id = ?
          AND row_status IN ('pending', 'overdue')
        ORDER BY work_date ASC, serial_no ASC
      `,
    )
      .bind(plan.id)
      .all<PlanRowRecord>(),
    env.DB.prepare(
      `
        SELECT id, travel_date, destination, expected_output, status
        FROM monthly_travel_plan_rows
        WHERE work_plan_id = ?
          AND status IN ('pending', 'overdue')
        ORDER BY travel_date ASC, serial_no ASC
      `,
    )
      .bind(plan.id)
      .all<TravelRowRecord>(),
  ]);

  return [
    ...planRows.results.map<PendingItem>((row) => ({
      id: `plan:${row.id}`,
      kind: "plan" as const,
      workDate: row.work_date,
      title: row.planned_activity ?? "Untitled task",
      expectedOutput: row.expected_output ?? "",
      status: row.row_status === "overdue" ? "overdue" : "pending",
      meta: row.row_status === "overdue" ? "Planned date already passed" : "Awaiting follow-up",
      remarks: row.remarks ?? "",
    })),
    ...travelRows.results.map<PendingItem>((row) => ({
      id: `travel:${row.id}`,
      kind: "travel" as const,
      workDate: row.travel_date,
      title: `Travel: ${row.destination}`,
      expectedOutput: row.expected_output ?? "",
      status: row.status === "overdue" ? "overdue" : "pending",
      meta: row.status === "overdue" ? "Travel date already passed" : "Travel output still open",
      remarks: "",
    })),
  ];
}

async function applyPendingActionToItem(env: Env, user: UserSession, itemId: string, input: PendingActionInput) {
  const [kind, rawId] = itemId.split(":");
  if (!kind || !rawId) {
    throw new Error("Invalid pending item id.");
  }

  if (kind === "plan") {
    const row = await env.DB.prepare(
      `
        SELECT mpr.id
        FROM monthly_work_plan_rows mpr
        JOIN monthly_work_plans mp ON mp.id = mpr.work_plan_id
        WHERE mpr.id = ? AND mp.user_id = ?
        LIMIT 1
      `,
    )
      .bind(rawId, user.id)
      .first<{ id: string }>();

    if (!row) throw new Error("Pending plan row not found.");

    const nextStatus =
      input.action === "cancel"
        ? "cancelled"
        : input.action === "move_next_month"
          ? "moved_next_month"
          : "pending";

    await env.DB.prepare(
      `
        UPDATE monthly_work_plan_rows
        SET row_status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    )
      .bind(nextStatus, input.note, rawId)
      .run();

    return;
  }

  if (kind === "travel") {
    const row = await env.DB.prepare(
      `
        SELECT mtr.id
        FROM monthly_travel_plan_rows mtr
        JOIN monthly_work_plans mp ON mp.id = mtr.work_plan_id
        WHERE mtr.id = ? AND mp.user_id = ?
        LIMIT 1
      `,
    )
      .bind(rawId, user.id)
      .first<{ id: string }>();

    if (!row) throw new Error("Pending travel row not found.");

    const nextStatus = input.action === "cancel" ? "cancelled" : "pending";
    await env.DB.prepare(
      `
        UPDATE monthly_travel_plan_rows
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    )
      .bind(nextStatus, rawId)
      .run();
  }
}

function monthKey(month: number, year: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function nextMonthParts(month: number, year: number) {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }

  return { month: month + 1, year };
}

function safeParseReportItems(jsonText: string): MonthlyReportItem[] {
  try {
    const parsed = JSON.parse(jsonText) as MonthlyReportItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function summarizeReport(report: Pick<MonthlyReport, "completedTasks" | "ongoingTasks" | "nextMonthTasks">, submittedDayCount: number, adHocCount: number) {
  return {
    completedCount: report.completedTasks.length,
    ongoingCount: report.ongoingTasks.length,
    nextMonthCount: report.nextMonthTasks.length,
    submittedDayCount,
    adHocCount,
  };
}

function reportTitleFromDailyRow(row: ReportDailyRecord) {
  if (row.is_ad_hoc) {
    return row.actual_activity;
  }

  if (row.plan_activity) {
    return row.plan_activity;
  }

  if (row.travel_destination) {
    return `Travel: ${row.travel_destination}`;
  }

  return row.actual_activity;
}

async function findMonthlyReportRecord(env: Env, userId: string, month: number, year: number) {
  return env.DB.prepare(
    `
      SELECT
        id,
        user_id,
        month,
        year,
        version_no,
        report_status,
        project_name_snapshot,
        designation_snapshot,
        submission_date,
        completed_tasks_snapshot_json,
        ongoing_tasks_snapshot_json,
        next_month_tasks_snapshot_json,
        lessons_learned,
        comments
      FROM monthly_reports
      WHERE user_id = ? AND month = ? AND year = ?
      ORDER BY version_no DESC
      LIMIT 1
    `,
  )
    .bind(userId, month, year)
    .first<MonthlyReportRecord>();
}

async function buildMonthlyReportDraft(env: Env, user: UserSession, month: number, year: number) {
  const currentPlan = await ensurePlan(env, user, month, year);
  const currentMonthKey = monthKey(month, year);
  const nextCycle = nextMonthParts(month, year);
  const nextPlanRecord = await findPlanRecord(env, user.id, nextCycle.month, nextCycle.year);
  const nextPlanRows = nextPlanRecord ? await fetchPlanRows(env, nextPlanRecord.id) : [];
  const nextTravelRows = nextPlanRecord ? await fetchTravelRows(env, nextPlanRecord.id) : [];

  const dailyRowsResult = await env.DB.prepare(
    `
      SELECT
        dar.id,
        ds.work_date,
        dar.actual_activity,
        dar.actual_output,
        dar.status,
        dar.is_ad_hoc,
        dar.ad_hoc_reason,
        mpr.planned_activity AS plan_activity,
        mpr.expected_output AS plan_output,
        mtr.destination AS travel_destination,
        mtr.expected_output AS travel_output
      FROM daily_activity_rows dar
      JOIN daily_sheets ds ON ds.id = dar.daily_sheet_id
      LEFT JOIN monthly_work_plan_rows mpr ON mpr.id = dar.linked_plan_row_id
      LEFT JOIN monthly_travel_plan_rows mtr ON mtr.id = dar.linked_travel_row_id
      WHERE ds.user_id = ?
        AND substr(ds.work_date, 1, 7) = ?
      ORDER BY ds.work_date ASC, dar.line_no ASC
    `,
  )
    .bind(user.id, currentMonthKey)
    .all<ReportDailyRecord>();

  const submissionStats = await env.DB.prepare(
    `
      SELECT
        COUNT(DISTINCT CASE WHEN status = 'submitted' THEN work_date END) AS submitted_days,
        COUNT(*) AS total_days
      FROM daily_sheets
      WHERE user_id = ?
        AND substr(work_date, 1, 7) = ?
    `,
  )
    .bind(user.id, currentMonthKey)
    .first<{ submitted_days: number; total_days: number }>();

  const adHocStats = await env.DB.prepare(
    `
      SELECT COUNT(*) AS ad_hoc_count
      FROM daily_activity_rows dar
      JOIN daily_sheets ds ON ds.id = dar.daily_sheet_id
      WHERE ds.user_id = ?
        AND substr(ds.work_date, 1, 7) = ?
        AND dar.is_ad_hoc = 1
    `,
  )
    .bind(user.id, currentMonthKey)
    .first<{ ad_hoc_count: number }>();

  const completedTasks = dailyRowsResult.results
    .filter((row) => row.status === "completed")
    .map<MonthlyReportItem>((row) => ({
      id: row.id,
      title: reportTitleFromDailyRow(row),
      output: row.actual_output ?? row.plan_output ?? row.travel_output ?? "",
      referenceDate: row.work_date,
      remarks: row.is_ad_hoc ? `Ad hoc: ${row.ad_hoc_reason ?? ""}` : row.actual_activity,
      source: row.is_ad_hoc ? "adhoc" : row.travel_destination ? "travel" : "plan",
    }));

  const ongoingTasks: MonthlyReportItem[] = [
    ...currentPlan.rows
      .filter((row) => row.rowStatus === "in_progress" || row.rowStatus === "pending" || row.rowStatus === "overdue")
      .filter((row) => row.rowType !== "holiday" && row.rowType !== "weekend" && row.rowType !== "leave")
      .map((row) => ({
        id: row.id,
        title: row.activity,
        output: row.expectedOutput,
        referenceDate: row.workDate,
        remarks: row.rowStatus === "overdue" ? "Overdue" : "In progress",
        source: "plan" as const,
      })),
    ...currentPlan.travelRows
      .filter((row) => row.status === "pending" || row.status === "overdue")
      .map((row) => ({
        id: row.id,
        title: `Travel: ${row.destination}`,
        output: row.expectedOutput,
        referenceDate: row.travelDate,
        remarks: row.status === "overdue" ? "Overdue" : "Pending",
        source: "travel" as const,
      })),
  ];

  const nextMonthTasks: MonthlyReportItem[] =
    nextPlanRows.length > 0 || nextTravelRows.length > 0
      ? [
          ...nextPlanRows
            .filter((row) => row.rowType !== "holiday" && row.rowType !== "weekend" && row.rowType !== "leave")
            .map((row) => ({
              id: row.id,
              title: row.activity,
              output: row.expectedOutput,
              referenceDate: row.workDate,
              remarks: "Planned next month",
              source: "plan" as const,
            })),
          ...nextTravelRows.map((row) => ({
            id: row.id,
            title: `Travel: ${row.destination}`,
            output: row.expectedOutput,
            referenceDate: row.travelDate,
            remarks: "Travel plan",
            source: "travel" as const,
          })),
        ]
      : [
          ...currentPlan.rows
            .filter((row) => row.rowStatus === "pending" || row.rowStatus === "overdue")
            .map((row) => ({
              id: row.id,
              title: row.activity,
              output: row.expectedOutput,
              referenceDate: row.workDate,
              remarks: "Carry forward from current month",
              source: "carry_forward" as const,
            })),
          ...currentPlan.travelRows
            .filter((row) => row.status === "pending" || row.status === "overdue")
            .map((row) => ({
              id: row.id,
              title: `Travel: ${row.destination}`,
              output: row.expectedOutput,
              referenceDate: row.travelDate,
              remarks: "Carry forward travel item",
              source: "carry_forward" as const,
            })),
        ];

  const submittedDayCount = submissionStats?.submitted_days ?? 0;
  const adHocCount = adHocStats?.ad_hoc_count ?? 0;

  return {
    submissionDate: currentDateInTimeZone(env.APP_TIMEZONE ?? "Asia/Dhaka"),
    completedTasks,
    ongoingTasks,
    nextMonthTasks,
    lessonsLearned: "",
    comments: "",
    summary: summarizeReport(
      {
        completedTasks,
        ongoingTasks,
        nextMonthTasks,
      },
      submittedDayCount,
      adHocCount,
    ),
  };
}

async function hydrateMonthlyReport(env: Env, record: MonthlyReportRecord, user: UserSession): Promise<MonthlyReport> {
  const submittedDayStats = await env.DB.prepare(
    `
      SELECT COUNT(DISTINCT work_date) AS submitted_days
      FROM daily_sheets
      WHERE user_id = ?
        AND substr(work_date, 1, 7) = ?
        AND status = 'submitted'
    `,
  )
    .bind(user.id, monthKey(record.month, record.year))
    .first<{ submitted_days: number }>();

  const adHocStats = await env.DB.prepare(
    `
      SELECT COUNT(*) AS ad_hoc_count
      FROM daily_activity_rows dar
      JOIN daily_sheets ds ON ds.id = dar.daily_sheet_id
      WHERE ds.user_id = ?
        AND substr(ds.work_date, 1, 7) = ?
        AND dar.is_ad_hoc = 1
    `,
  )
    .bind(user.id, monthKey(record.month, record.year))
    .first<{ ad_hoc_count: number }>();

  const completedTasks = safeParseReportItems(record.completed_tasks_snapshot_json);
  const ongoingTasks = safeParseReportItems(record.ongoing_tasks_snapshot_json);
  const nextMonthTasks = safeParseReportItems(record.next_month_tasks_snapshot_json);

  return {
    id: record.id,
    userId: record.user_id,
    month: record.month,
    year: record.year,
    versionNo: record.version_no,
    status: record.report_status,
    employeeName: user.fullName,
    designation: record.designation_snapshot ?? user.designation,
    projectName: record.project_name_snapshot ?? user.projectName,
    submissionDate: record.submission_date ?? currentDateInTimeZone(env.APP_TIMEZONE ?? "Asia/Dhaka"),
    completedTasks,
    ongoingTasks,
    nextMonthTasks,
    lessonsLearned: record.lessons_learned ?? "",
    comments: record.comments ?? "",
    summary: summarizeReport(
      {
        completedTasks,
        ongoingTasks,
        nextMonthTasks,
      },
      submittedDayStats?.submitted_days ?? 0,
      adHocStats?.ad_hoc_count ?? 0,
    ),
  };
}

async function ensureMonthlyReport(env: Env, user: UserSession, month: number, year: number) {
  const existing = await findMonthlyReportRecord(env, user.id, month, year);
  if (existing) {
    return hydrateMonthlyReport(env, existing, user);
  }

  const draft = await buildMonthlyReportDraft(env, user, month, year);
  const reportId = crypto.randomUUID();
  await env.DB.prepare(
    `
      INSERT INTO monthly_reports (
        id,
        user_id,
        month,
        year,
        version_no,
        report_status,
        project_name_snapshot,
        designation_snapshot,
        submission_date,
        completed_tasks_snapshot_json,
        ongoing_tasks_snapshot_json,
        next_month_tasks_snapshot_json,
        lessons_learned,
        comments
      ) VALUES (?, ?, ?, ?, 1, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      reportId,
      user.id,
      month,
      year,
      user.projectName,
      user.designation,
      draft.submissionDate,
      JSON.stringify(draft.completedTasks),
      JSON.stringify(draft.ongoingTasks),
      JSON.stringify(draft.nextMonthTasks),
      draft.lessonsLearned,
      draft.comments,
    )
    .run();

  const latest = await findMonthlyReportRecord(env, user.id, month, year);
  if (!latest) {
    throw new Error("Unable to create monthly report.");
  }

  return hydrateMonthlyReport(env, latest, user);
}

function fileResponse(body: BodyInit | Uint8Array, contentType: string, fileName: string) {
  return new Response(body as BodyInit, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderReportSectionRows(items: MonthlyReportItem[]) {
  if (!items.length) {
    return `<tr><td colspan="4">No items</td></tr>`;
  }

  return items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.title)}</td>
          <td>${escapeHtml(item.output)}</td>
          <td>${escapeHtml(item.referenceDate || item.remarks)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderMonthlyReportPrintHtml(report: MonthlyReport) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Monthly Report ${report.year}-${String(report.month).padStart(2, "0")}</title>
      <style>
        body { font-family: "Segoe UI", sans-serif; margin: 28px; color: #16363d; }
        h1, h2, h3, p { margin: 0; }
        .header { display: grid; gap: 10px; margin-bottom: 18px; }
        .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 18px; }
        .meta div, .panel { border: 1px solid #c9d7d5; border-radius: 10px; padding: 10px 12px; }
        .panel { margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #d4dfdd; padding: 8px; vertical-align: top; text-align: left; }
        th { background: #e5f4f1; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media print { body { margin: 14px; } }
      </style>
    </head>
    <body>
      <section class="header">
        <h1>PRAAN Monthly Report</h1>
        <p>${escapeHtml(report.projectName)}</p>
      </section>
      <section class="meta">
        <div><strong>Name:</strong> ${escapeHtml(report.employeeName)}</div>
        <div><strong>Designation:</strong> ${escapeHtml(report.designation)}</div>
        <div><strong>Reporting Month:</strong> ${String(report.month).padStart(2, "0")}/${report.year}</div>
        <div><strong>Submission Date:</strong> ${escapeHtml(report.submissionDate)}</div>
      </section>
      <section class="panel">
        <h3>Completed Tasks</h3>
        <table>
          <thead><tr><th>#</th><th>Name of the Task</th><th>Output</th><th>Remark / Date</th></tr></thead>
          <tbody>${renderReportSectionRows(report.completedTasks)}</tbody>
        </table>
      </section>
      <section class="panel">
        <h3>Ongoing Tasks</h3>
        <table>
          <thead><tr><th>#</th><th>Name of the Task</th><th>Output</th><th>Deadline</th></tr></thead>
          <tbody>${renderReportSectionRows(report.ongoingTasks)}</tbody>
        </table>
      </section>
      <section class="panel">
        <h3>Tasks for Next Month</h3>
        <table>
          <thead><tr><th>#</th><th>Name of the Task</th><th>Output</th><th>Date</th></tr></thead>
          <tbody>${renderReportSectionRows(report.nextMonthTasks)}</tbody>
        </table>
      </section>
      <section class="two-col">
        <div class="panel"><h3>Lesson Learned</h3><p>${escapeHtml(report.lessonsLearned || "")}</p></div>
        <div class="panel"><h3>Comments</h3><p>${escapeHtml(report.comments || "")}</p></div>
      </section>
    </body>
  </html>`;
}

function renderDailyRowsPrint(rows: DailyActivityRow[]) {
  const content = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(`${row.startTime} - ${row.endTime}`)}</td>
              <td>${escapeHtml(row.linkLabel ?? row.actualActivity)}</td>
              <td>${escapeHtml(row.actualOutput)}</td>
              <td>${row.deliveryDone ? "Done" : row.deliveryRequired ? "Pending" : ""}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="4">No rows</td></tr>';

  return content;
}

function renderDailySheetPrintHtml(sheet: DailySheet, user: UserSession) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Daily Activity ${sheet.workDate}</title>
      <style>
        body { font-family: "Segoe UI", sans-serif; margin: 24px; color: #15353b; }
        h1, h2, h3, p { margin: 0; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #1c5b62; padding: 10px; vertical-align: top; }
        th { background: #26b2aa; color: #05191d; }
        .panel { border: 1px solid #1c5b62; margin-top: 18px; }
        .panel h3 { background: #26b2aa; padding: 8px 10px; }
        .panel div { min-height: 120px; padding: 12px; }
      </style>
    </head>
    <body>
      <section class="header">
        <div>
          <h1>Daily Activity Register</h1>
          <p>${escapeHtml(user.fullName)} | ${escapeHtml(user.designation)}</p>
        </div>
        <div><strong>Date:</strong> ${escapeHtml(sheet.workDate)}</div>
      </section>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Task's Description</th>
            <th>Output</th>
            <th>Delivery</th>
          </tr>
        </thead>
        <tbody>${renderDailyRowsPrint(sheet.rows)}</tbody>
      </table>
      <section class="panel">
        <h3>Note</h3>
        <div>${escapeHtml(sheet.note)}</div>
      </section>
    </body>
  </html>`;
}

async function exportWorkPlanWorkbook(plan: MonthlyWorkPlan) {
  const rows = [
    ["PRAAN Monthly Work Plan"],
    [],
    ["Employee Name", plan.employeeName, "Designation", plan.designation],
    ["Project", plan.projectName, "Supervisor", plan.supervisorName],
    ["Prepared Date", plan.preparedDate, "Status", plan.status],
    [],
    ["#", "Date", "Planned Activity", "Expected Output", "Type", "Status"],
    ...plan.rows.map((row) => [
      row.serialNo,
      row.workDate,
      row.activity,
      row.expectedOutput,
      row.rowType,
      row.rowStatus,
    ]),
    [],
    ["Travel Plan"],
    ["#", "Travel Date", "Destination", "Purpose", "Expected Output", "Status"],
    ...plan.travelRows.map((row) => [
      row.serialNo,
      row.travelDate,
      row.destination,
      row.purpose,
      row.expectedOutput,
      row.status,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 42 },
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
  ];
  worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Work Plan");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

function createDocTable(title: string, headers: string[], items: MonthlyReportItem[]) {
  return [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 120 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map(
            (header) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
          ),
        }),
        ...(items.length
          ? items.map(
              (item, index) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(String(index + 1))] }),
                    new TableCell({ children: [new Paragraph(item.title)] }),
                    new TableCell({ children: [new Paragraph(item.output)] }),
                    new TableCell({ children: [new Paragraph(item.referenceDate || item.remarks)] }),
                  ],
                }),
            )
          : [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("No items")], columnSpan: 4 }),
                  new TableCell({ children: [] }),
                  new TableCell({ children: [] }),
                  new TableCell({ children: [] }),
                ],
              }),
            ]),
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "A7C6C0" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "A7C6C0" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "A7C6C0" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "A7C6C0" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D5E3E0" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D5E3E0" },
      },
    }),
  ];
}

async function exportMonthlyReportDocx(report: MonthlyReport) {
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "PRAAN Monthly Report",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Project: ", bold: true }),
              new TextRun(report.projectName),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Name: ", bold: true }),
              new TextRun(report.employeeName),
              new TextRun({ text: "    Designation: ", bold: true }),
              new TextRun(report.designation),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Reporting Month: ", bold: true }),
              new TextRun(`${String(report.month).padStart(2, "0")}/${report.year}`),
              new TextRun({ text: "    Submission Date: ", bold: true }),
              new TextRun(report.submissionDate),
            ],
            spacing: { after: 200 },
          }),
          ...createDocTable("Completed Tasks", ["#", "Name of the Task", "Output", "Remark / Date"], report.completedTasks),
          ...createDocTable("Ongoing Tasks", ["#", "Name of the Task", "Output", "Deadline"], report.ongoingTasks),
          ...createDocTable("Tasks for Next Month", ["#", "Name of the Task", "Output", "Date"], report.nextMonthTasks),
          new Paragraph({
            text: "Lesson Learned",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 80 },
          }),
          new Paragraph(report.lessonsLearned || ""),
          new Paragraph({
            text: "Comments",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 80 },
          }),
          new Paragraph(report.comments || ""),
        ],
      },
    ],
  });

  return Packer.toArrayBuffer(document);
}

function wrapText(text: string, maxChars: number) {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

async function exportMonthlyReportPdf(report: MonthlyReport) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 805;
  const x = 40;
  const fontSize = 10;
  const lineHeight = 14;
  const maxChars = 78;

  const addPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 805;
  };

  const ensureSpace = (lines = 1) => {
    if (y - lines * lineHeight < 40) {
      addPage();
    }
  };

  const drawLine = (text: string, font = regular, size = fontSize, color = rgb(0.09, 0.21, 0.24)) => {
    ensureSpace();
    page.drawText(text, { x, y, size, font, color });
    y -= lineHeight;
  };

  const drawBlock = (title: string, items: MonthlyReportItem[]) => {
    ensureSpace(3);
    drawLine(title, bold, 12);
    if (!items.length) {
      drawLine("No items");
      y -= 4;
      return;
    }

    items.forEach((item, index) => {
      const text = `${index + 1}. ${item.title} | ${item.output} | ${item.referenceDate || item.remarks}`;
      for (const line of wrapText(text, maxChars)) {
        drawLine(line);
      }
      y -= 2;
    });
  };

  drawLine("PRAAN Monthly Report", bold, 16);
  drawLine(`Project: ${report.projectName}`);
  drawLine(`Name: ${report.employeeName}`);
  drawLine(`Designation: ${report.designation}`);
  drawLine(`Reporting Month: ${String(report.month).padStart(2, "0")}/${report.year}`);
  drawLine(`Submission Date: ${report.submissionDate}`);
  y -= 4;

  drawBlock("Completed Tasks", report.completedTasks);
  drawBlock("Ongoing Tasks", report.ongoingTasks);
  drawBlock("Tasks for Next Month", report.nextMonthTasks);
  drawLine("Lesson Learned", bold, 12);
  wrapText(report.lessonsLearned || "", maxChars).forEach((line) => drawLine(line));
  drawLine("Comments", bold, 12);
  wrapText(report.comments || "", maxChars).forEach((line) => drawLine(line));

  return pdf.save();
}

async function exportDailySheetPdf(sheet: DailySheet, user: UserSession) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 805;
  const x = 36;
  const lineHeight = 14;

  const addPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 805;
  };

  const draw = (text: string, font = regular, size = 10) => {
    if (y < 50) addPage();
    page.drawText(text, { x, y, size, font, color: rgb(0.07, 0.21, 0.24) });
    y -= lineHeight;
  };

  draw("PRAAN Daily Activity Register", bold, 16);
  draw(`${user.fullName} | ${user.designation}`);
  draw(`Date: ${sheet.workDate}`);
  y -= 4;
  draw("Time | Task | Output | Delivery", bold, 11);
  sheet.rows.forEach((row) => {
    const line = `${row.startTime}-${row.endTime} | ${row.linkLabel ?? row.actualActivity} | ${row.actualOutput} | ${
      row.deliveryDone ? "Done" : row.deliveryRequired ? "Pending" : "-"
    }`;
    wrapText(line, 84).forEach((part) => draw(part));
    y -= 2;
  });
  y -= 4;
  draw("Note", bold, 11);
  wrapText(sheet.note || "", 84).forEach((part) => draw(part));

  return pdf.save();
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

    if (url.pathname === "/api/monthly-reports/current" && request.method === "GET") {
      const month = Number(url.searchParams.get("month") ?? 3);
      const year = Number(url.searchParams.get("year") ?? 2026);
      return json(await ensureMonthlyReport(env, user, month, year));
    }

    const monthlyReportMatch = matchRoute(url.pathname, /^\/api\/monthly-reports\/([^/]+)$/);
    if (monthlyReportMatch && request.method === "PATCH") {
      const reportId = monthlyReportMatch[1];
      const report = await env.DB.prepare(
        `
          SELECT
            id,
            user_id,
            month,
            year,
            version_no,
            report_status,
            project_name_snapshot,
            designation_snapshot,
            submission_date,
            completed_tasks_snapshot_json,
            ongoing_tasks_snapshot_json,
            next_month_tasks_snapshot_json,
            lessons_learned,
            comments
          FROM monthly_reports
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
      )
        .bind(reportId, user.id)
        .first<MonthlyReportRecord>();

      if (!report) return error("Monthly report not found.", 404);

      const body = await parseJson<{
        submissionDate: string;
        completedTasks: MonthlyReportItem[];
        ongoingTasks: MonthlyReportItem[];
        nextMonthTasks: MonthlyReportItem[];
        lessonsLearned: string;
        comments: string;
      }>(request);

      await env.DB.prepare(
        `
          UPDATE monthly_reports
          SET
            submission_date = ?,
            completed_tasks_snapshot_json = ?,
            ongoing_tasks_snapshot_json = ?,
            next_month_tasks_snapshot_json = ?,
            lessons_learned = ?,
            comments = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      )
        .bind(
          body.submissionDate,
          JSON.stringify(body.completedTasks),
          JSON.stringify(body.ongoingTasks),
          JSON.stringify(body.nextMonthTasks),
          body.lessonsLearned,
          body.comments,
          reportId,
        )
        .run();

      const latest = await findMonthlyReportRecord(env, user.id, report.month, report.year);
      if (!latest) return error("Unable to reload monthly report.", 500);
      return json(await hydrateMonthlyReport(env, latest, user));
    }

    const regenerateReportMatch = matchRoute(url.pathname, /^\/api\/monthly-reports\/([^/]+)\/regenerate$/);
    if (regenerateReportMatch && request.method === "POST") {
      const reportId = regenerateReportMatch[1];
      const report = await env.DB.prepare(
        `
          SELECT
            id,
            user_id,
            month,
            year,
            version_no,
            report_status,
            project_name_snapshot,
            designation_snapshot,
            submission_date,
            completed_tasks_snapshot_json,
            ongoing_tasks_snapshot_json,
            next_month_tasks_snapshot_json,
            lessons_learned,
            comments
          FROM monthly_reports
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
      )
        .bind(reportId, user.id)
        .first<MonthlyReportRecord>();

      if (!report) return error("Monthly report not found.", 404);

      const draft = await buildMonthlyReportDraft(env, user, report.month, report.year);
      await env.DB.prepare(
        `
          UPDATE monthly_reports
          SET
            submission_date = ?,
            completed_tasks_snapshot_json = ?,
            ongoing_tasks_snapshot_json = ?,
            next_month_tasks_snapshot_json = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      )
        .bind(
          draft.submissionDate,
          JSON.stringify(draft.completedTasks),
          JSON.stringify(draft.ongoingTasks),
          JSON.stringify(draft.nextMonthTasks),
          reportId,
        )
        .run();

      const latest = await findMonthlyReportRecord(env, user.id, report.month, report.year);
      if (!latest) return error("Unable to reload monthly report.", 500);
      return json(await hydrateMonthlyReport(env, latest, user));
    }

    const submitReportMatch = matchRoute(url.pathname, /^\/api\/monthly-reports\/([^/]+)\/submit$/);
    if (submitReportMatch && request.method === "POST") {
      const reportId = submitReportMatch[1];
      const report = await env.DB.prepare(
        `
          SELECT
            id,
            user_id,
            month,
            year,
            version_no,
            report_status,
            project_name_snapshot,
            designation_snapshot,
            submission_date,
            completed_tasks_snapshot_json,
            ongoing_tasks_snapshot_json,
            next_month_tasks_snapshot_json,
            lessons_learned,
            comments
          FROM monthly_reports
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
      )
        .bind(reportId, user.id)
        .first<MonthlyReportRecord>();

      if (!report) return error("Monthly report not found.", 404);

      await env.DB.prepare(
        `
          UPDATE monthly_reports
          SET report_status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      )
        .bind(reportId)
        .run();

      const latest = await findMonthlyReportRecord(env, user.id, report.month, report.year);
      if (!latest) return error("Unable to reload monthly report.", 500);
      return json(await hydrateMonthlyReport(env, latest, user));
    }

    if (url.pathname === "/api/daily-sheets/current" && request.method === "GET") {
      const workDate = url.searchParams.get("date") ?? currentDateInTimeZone(env.APP_TIMEZONE ?? "Asia/Dhaka");
      const record = await ensureDailySheetRecord(env, user, workDate);
      return json(await hydrateDailySheet(env, record, user));
    }

    const sheetMatch = matchRoute(url.pathname, /^\/api\/daily-sheets\/([^/]+)$/);
    if (sheetMatch && request.method === "PATCH") {
      const sheetId = sheetMatch[1];
      const sheet = await env.DB.prepare(
        `
          SELECT id, user_id, work_date, status, note
          FROM daily_sheets
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
      )
        .bind(sheetId, user.id)
        .first<DailySheetRecord>();

      if (!sheet) return error("Daily sheet not found.", 404);

      const body = await parseJson<{ note?: string }>(request);
      await env.DB.prepare(
        `
          UPDATE daily_sheets
          SET note = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      )
        .bind(body.note ?? sheet.note ?? "", sheetId)
        .run();

      return json(await hydrateDailySheet(env, { ...sheet, note: body.note ?? sheet.note ?? "" }, user));
    }

    const createDailyRowMatch = matchRoute(url.pathname, /^\/api\/daily-sheets\/([^/]+)\/rows$/);
    if (createDailyRowMatch && request.method === "POST") {
      const sheetId = createDailyRowMatch[1];
      const sheet = await env.DB.prepare(
        `
          SELECT id, user_id, work_date, status, note
          FROM daily_sheets
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
      )
        .bind(sheetId, user.id)
        .first<DailySheetRecord>();

      if (!sheet) return error("Daily sheet not found.", 404);

      const body = await parseJson<DailyActivityRowInput>(request);
      if (body.isAdHoc && !body.adHocReason.trim()) {
        return error("Ad hoc activities require a reason.", 400);
      }

      const serialResult = await env.DB.prepare(
        `
          SELECT COALESCE(MAX(line_no), 0) AS last_line
          FROM daily_activity_rows
          WHERE daily_sheet_id = ?
        `,
      )
        .bind(sheetId)
        .first<{ last_line: number }>();

      const rowId = crypto.randomUUID();
      const lineNo = (serialResult?.last_line ?? 0) + 1;

      await env.DB.prepare(
        `
          INSERT INTO daily_activity_rows (
            id,
            daily_sheet_id,
            line_no,
            linked_plan_row_id,
            linked_travel_row_id,
            start_time,
            end_time,
            actual_activity,
            actual_output,
            status,
            delivery_required,
            delivery_done,
            is_ad_hoc,
            ad_hoc_reason,
            carry_forward_action,
            row_note
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
        .bind(
          rowId,
          sheetId,
          lineNo,
          body.linkedPlanRowId,
          body.linkedTravelRowId,
          body.startTime,
          body.endTime,
          body.actualActivity,
          body.actualOutput,
          body.status,
          body.deliveryRequired ? 1 : 0,
          body.deliveryDone ? 1 : 0,
          body.isAdHoc ? 1 : 0,
          body.adHocReason,
          body.carryForwardAction,
          body.rowNote,
        )
        .run();

      await resyncLinkedTargets(env, {
        oldPlanId: null,
        newPlanId: body.linkedPlanRowId,
        oldTravelId: null,
        newTravelId: body.linkedTravelRowId,
      });

      const rows = await fetchDailyRows(env, sheetId);
      const row = rows.find((entry) => entry.id === rowId);
      if (!row) return error("Unable to load saved activity row.", 500);
      return json(row, { status: 201 });
    }

    const dailyRowMatch = matchRoute(url.pathname, /^\/api\/daily-sheets\/([^/]+)\/rows\/([^/]+)$/);
    if (dailyRowMatch && request.method === "PATCH") {
      const [, sheetId, rowId] = dailyRowMatch;
      const sheet = await env.DB.prepare(
        `
          SELECT id, user_id, work_date, status, note
          FROM daily_sheets
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
      )
        .bind(sheetId, user.id)
        .first<DailySheetRecord>();

      if (!sheet) return error("Daily sheet not found.", 404);

      const existing = await env.DB.prepare(
        `
          SELECT linked_plan_row_id, linked_travel_row_id
          FROM daily_activity_rows
          WHERE id = ? AND daily_sheet_id = ?
          LIMIT 1
        `,
      )
        .bind(rowId, sheetId)
        .first<{ linked_plan_row_id: string | null; linked_travel_row_id: string | null }>();

      if (!existing) return error("Daily activity row not found.", 404);

      const body = await parseJson<DailyActivityRowInput>(request);
      if (body.isAdHoc && !body.adHocReason.trim()) {
        return error("Ad hoc activities require a reason.", 400);
      }

      await env.DB.prepare(
        `
          UPDATE daily_activity_rows
          SET
            linked_plan_row_id = ?,
            linked_travel_row_id = ?,
            start_time = ?,
            end_time = ?,
            actual_activity = ?,
            actual_output = ?,
            status = ?,
            delivery_required = ?,
            delivery_done = ?,
            is_ad_hoc = ?,
            ad_hoc_reason = ?,
            carry_forward_action = ?,
            row_note = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND daily_sheet_id = ?
        `,
      )
        .bind(
          body.linkedPlanRowId,
          body.linkedTravelRowId,
          body.startTime,
          body.endTime,
          body.actualActivity,
          body.actualOutput,
          body.status,
          body.deliveryRequired ? 1 : 0,
          body.deliveryDone ? 1 : 0,
          body.isAdHoc ? 1 : 0,
          body.adHocReason,
          body.carryForwardAction,
          body.rowNote,
          rowId,
          sheetId,
        )
        .run();

      await resyncLinkedTargets(env, {
        oldPlanId: existing.linked_plan_row_id,
        newPlanId: body.linkedPlanRowId,
        oldTravelId: existing.linked_travel_row_id,
        newTravelId: body.linkedTravelRowId,
      });

      const rows = await fetchDailyRows(env, sheetId);
      const row = rows.find((entry) => entry.id === rowId);
      if (!row) return error("Daily activity row not found after update.", 404);
      return json(row);
    }

    if (dailyRowMatch && request.method === "DELETE") {
      const [, sheetId, rowId] = dailyRowMatch;
      const sheet = await env.DB.prepare(
        `
          SELECT id, user_id, work_date, status, note
          FROM daily_sheets
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
      )
        .bind(sheetId, user.id)
        .first<DailySheetRecord>();

      if (!sheet) return error("Daily sheet not found.", 404);

      const existing = await env.DB.prepare(
        `
          SELECT linked_plan_row_id, linked_travel_row_id
          FROM daily_activity_rows
          WHERE id = ? AND daily_sheet_id = ?
          LIMIT 1
        `,
      )
        .bind(rowId, sheetId)
        .first<{ linked_plan_row_id: string | null; linked_travel_row_id: string | null }>();

      if (!existing) return error("Daily activity row not found.", 404);

      await env.DB.prepare(
        `
          DELETE FROM daily_activity_rows
          WHERE id = ? AND daily_sheet_id = ?
        `,
      )
        .bind(rowId, sheetId)
        .run();

      await resyncLinkedTargets(env, {
        oldPlanId: existing.linked_plan_row_id,
        newPlanId: null,
        oldTravelId: existing.linked_travel_row_id,
        newTravelId: null,
      });

      return json({ success: true });
    }

    const submitSheetMatch = matchRoute(url.pathname, /^\/api\/daily-sheets\/([^/]+)\/submit$/);
    if (submitSheetMatch && request.method === "POST") {
      const sheetId = submitSheetMatch[1];
      const sheet = await env.DB.prepare(
        `
          SELECT id, user_id, work_date, status, note
          FROM daily_sheets
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
      )
        .bind(sheetId, user.id)
        .first<DailySheetRecord>();

      if (!sheet) return error("Daily sheet not found.", 404);

      await env.DB.prepare(
        `
          UPDATE daily_sheets
          SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
      )
        .bind(sheetId)
        .run();

      await markOpenRowsAsPending(env, user, sheet.work_date);
      const latest = await findDailySheetRecord(env, user.id, sheet.work_date);
      if (!latest) return error("Unable to reload daily sheet.", 500);
      return json(await hydrateDailySheet(env, latest, user));
    }

    if (url.pathname === "/api/pending" && request.method === "GET") {
      const workDate = url.searchParams.get("date") ?? currentDateInTimeZone(env.APP_TIMEZONE ?? "Asia/Dhaka");
      return json(await fetchPendingItemsForDate(env, user, workDate));
    }

    const pendingActionMatch = matchRoute(url.pathname, /^\/api\/pending\/([^/]+)\/action$/);
    if (pendingActionMatch && request.method === "POST") {
      const itemId = decodeURIComponent(pendingActionMatch[1]);
      const body = await parseJson<PendingActionInput>(request);

      try {
        await applyPendingActionToItem(env, user, itemId, body);
      } catch (caught) {
        return error(caught instanceof Error ? caught.message : "Unable to apply pending action.", 400);
      }

      return json({ success: true });
    }

    if (url.pathname === "/api/exports/work-plans/current.xlsx" && request.method === "GET") {
      const month = Number(url.searchParams.get("month") ?? 3);
      const year = Number(url.searchParams.get("year") ?? 2026);
      const plan = await ensurePlan(env, user, month, year);
      const workbook = await exportWorkPlanWorkbook(plan);
      return fileResponse(
        workbook,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `work-plan-${year}-${String(month).padStart(2, "0")}.xlsx`,
      );
    }

    if (url.pathname === "/api/exports/monthly-reports/current.docx" && request.method === "GET") {
      const month = Number(url.searchParams.get("month") ?? 3);
      const year = Number(url.searchParams.get("year") ?? 2026);
      const report = await ensureMonthlyReport(env, user, month, year);
      const buffer = await exportMonthlyReportDocx(report);
      return fileResponse(
        buffer,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        `monthly-report-${year}-${String(month).padStart(2, "0")}.docx`,
      );
    }

    if (url.pathname === "/api/exports/monthly-reports/current.pdf" && request.method === "GET") {
      const month = Number(url.searchParams.get("month") ?? 3);
      const year = Number(url.searchParams.get("year") ?? 2026);
      const report = await ensureMonthlyReport(env, user, month, year);
      const pdf = await exportMonthlyReportPdf(report);
      return fileResponse(pdf, "application/pdf", `monthly-report-${year}-${String(month).padStart(2, "0")}.pdf`);
    }

    if (url.pathname === "/api/exports/monthly-reports/current.print" && request.method === "GET") {
      const month = Number(url.searchParams.get("month") ?? 3);
      const year = Number(url.searchParams.get("year") ?? 2026);
      const report = await ensureMonthlyReport(env, user, month, year);
      return new Response(renderMonthlyReportPrintHtml(report), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname === "/api/exports/daily-sheets/current.pdf" && request.method === "GET") {
      const workDate = url.searchParams.get("date") ?? currentDateInTimeZone(env.APP_TIMEZONE ?? "Asia/Dhaka");
      const record = await ensureDailySheetRecord(env, user, workDate);
      const sheet = await hydrateDailySheet(env, record, user);
      const pdf = await exportDailySheetPdf(sheet, user);
      return fileResponse(pdf, "application/pdf", `daily-sheet-${workDate}.pdf`);
    }

    if (url.pathname === "/api/exports/daily-sheets/current.print" && request.method === "GET") {
      const workDate = url.searchParams.get("date") ?? currentDateInTimeZone(env.APP_TIMEZONE ?? "Asia/Dhaka");
      const record = await ensureDailySheetRecord(env, user, workDate);
      const sheet = await hydrateDailySheet(env, record, user);
      return new Response(renderDailySheetPrintHtml(sheet, user), {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
