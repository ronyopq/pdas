export type AppRoute =
  | "/"
  | "/login"
  | "/plan"
  | "/today"
  | "/pending"
  | "/report"
  | "/kpi"
  | "/team"
  | "/admin"
  | "/exports";

export type UserRole = "employee" | "manager" | "admin" | "super_admin";

export type Tone = "calm" | "focus" | "alert" | "success";

export type PlanStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "revision_requested"
  | "rejected"
  | "locked";

export interface NavigationItem {
  label: string;
  href: AppRoute;
  description: string;
}

export interface SummaryCard {
  label: string;
  value: string;
  tone: Tone;
}

export interface QueueItem {
  title: string;
  meta: string;
  hint: string;
}

export interface DashboardPayload {
  summary: SummaryCard[];
  todayPlan: QueueItem[];
  pending: QueueItem[];
  approvals: QueueItem[];
}

export interface UserSession {
  id: string;
  employeeCode: string;
  fullName: string;
  designation: string;
  projectName: string;
  managerName: string;
  role: UserRole;
}

export interface LoginInput {
  employeeCode: string;
  password: string;
}

export interface WorkPlanRow {
  id: string;
  serialNo: number;
  workDate: string;
  activity: string;
  expectedOutput: string;
  rowType: "regular_work" | "meeting" | "field_visit" | "travel" | "holiday" | "weekend" | "leave" | "reserved";
  rowStatus: "planned" | "in_progress" | "completed" | "pending" | "overdue" | "cancelled";
}

export interface TravelPlanRow {
  id: string;
  serialNo: number;
  travelDate: string;
  destination: string;
  purpose: string;
  expectedOutput: string;
  status: "planned" | "completed" | "pending";
}

export interface MonthlyWorkPlan {
  id: string;
  userId: string;
  month: number;
  year: number;
  preparedDate: string;
  status: PlanStatus;
  employeeName: string;
  designation: string;
  projectName: string;
  supervisorName: string;
  rows: WorkPlanRow[];
  travelRows: TravelPlanRow[];
}

export interface WorkPlanUpdateInput {
  preparedDate: string;
}

export interface WorkPlanRowInput {
  workDate: string;
  activity: string;
  expectedOutput: string;
  rowType: WorkPlanRow["rowType"];
}

export interface TravelPlanRowInput {
  travelDate: string;
  destination: string;
  purpose: string;
  expectedOutput: string;
}

export interface ApiResponse<T> {
  data: T;
  generatedAt: string;
}
