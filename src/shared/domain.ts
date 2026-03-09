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
  status: "planned" | "completed" | "pending" | "overdue" | "cancelled";
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

export type DailySheetStatus = "draft" | "submitted" | "approved" | "returned" | "locked";

export type DailyActivityStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "deferred"
  | "cancelled";

export type CarryForwardAction =
  | "none"
  | "continue_next_day"
  | "reschedule_current_month"
  | "move_next_month"
  | "cancel";

export interface TaskLinkOption {
  id: string;
  kind: "plan" | "travel";
  label: string;
  meta: string;
  expectedOutput: string;
}

export interface DailyActivityRow {
  id: string;
  lineNo: number;
  linkedPlanRowId: string | null;
  linkedTravelRowId: string | null;
  linkLabel: string | null;
  startTime: string;
  endTime: string;
  actualActivity: string;
  actualOutput: string;
  status: DailyActivityStatus;
  deliveryRequired: boolean;
  deliveryDone: boolean;
  isAdHoc: boolean;
  adHocReason: string;
  carryForwardAction: CarryForwardAction;
  rowNote: string;
  followUpPerson: string;
  followUpDate: string;
  followUpNote: string;
  followUpGeneratedRowId: string | null;
  followUpSourceRowId: string | null;
  followUpSourceDate: string | null;
  followUpSourceActivity: string | null;
  isFollowUpGenerated: boolean;
  attachments: DailyAttachment[];
}

export interface DailySheet {
  id: string;
  userId: string;
  workDate: string;
  status: DailySheetStatus;
  note: string;
  rows: DailyActivityRow[];
  taskOptions: TaskLinkOption[];
}

export interface DailyActivityRowInput {
  linkedPlanRowId: string | null;
  linkedTravelRowId: string | null;
  startTime: string;
  endTime: string;
  actualActivity: string;
  actualOutput: string;
  status: DailyActivityStatus;
  deliveryRequired: boolean;
  deliveryDone: boolean;
  isAdHoc: boolean;
  adHocReason: string;
  carryForwardAction: CarryForwardAction;
  rowNote: string;
  followUpPerson: string;
  followUpDate: string;
  followUpNote: string;
}

export interface DailyAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  downloadUrl: string;
}

export interface PendingItem {
  id: string;
  kind: "plan" | "travel";
  workDate: string;
  title: string;
  expectedOutput: string;
  status: "pending" | "overdue";
  meta: string;
  remarks: string;
}

export interface PendingActionInput {
  action: CarryForwardAction;
  note: string;
}

export type MonthlyReportStatus = "draft" | "submitted" | "approved" | "revision_requested" | "locked";

export interface MonthlyReportItem {
  id: string;
  title: string;
  output: string;
  referenceDate: string;
  remarks: string;
  source: "plan" | "travel" | "adhoc" | "carry_forward";
}

export interface MonthlyReportSummary {
  completedCount: number;
  ongoingCount: number;
  nextMonthCount: number;
  submittedDayCount: number;
  adHocCount: number;
}

export interface MonthlyReport {
  id: string;
  userId: string;
  month: number;
  year: number;
  versionNo: number;
  status: MonthlyReportStatus;
  employeeName: string;
  designation: string;
  projectName: string;
  submissionDate: string;
  completedTasks: MonthlyReportItem[];
  ongoingTasks: MonthlyReportItem[];
  nextMonthTasks: MonthlyReportItem[];
  lessonsLearned: string;
  comments: string;
  summary: MonthlyReportSummary;
}

export interface MonthlyReportUpdateInput {
  submissionDate: string;
  completedTasks: MonthlyReportItem[];
  ongoingTasks: MonthlyReportItem[];
  nextMonthTasks: MonthlyReportItem[];
  lessonsLearned: string;
  comments: string;
}

export type ReviewScope = "team" | "admin";

export type ReviewEntityType = "monthly_work_plan" | "daily_sheet" | "monthly_report";

export type ReviewAction = "approve" | "return" | "revision_requested";

export interface TeamMemberStatus {
  userId: string;
  employeeCode: string;
  fullName: string;
  designation: string;
  role: UserRole;
  planStatus: PlanStatus;
  dailyStatus: DailySheetStatus;
  reportStatus: MonthlyReportStatus;
  pendingCount: number;
  overdueCount: number;
  needsReview: boolean;
}

export interface ReviewQueueItem {
  entityType: ReviewEntityType;
  entityId: string;
  userId: string;
  title: string;
  meta: string;
  hint: string;
}

export interface TeamOverviewPayload {
  scope: ReviewScope;
  summary: SummaryCard[];
  members: TeamMemberStatus[];
  queue: ReviewQueueItem[];
}

export interface ApprovalHistoryItem {
  id: string;
  entityType: ReviewEntityType;
  action: string;
  actorName: string;
  comment: string;
  actedAt: string;
}

export interface TeamWorkspacePayload {
  scope: ReviewScope;
  member: UserSession;
  workPlan: MonthlyWorkPlan;
  dailySheet: DailySheet;
  monthlyReport: MonthlyReport;
  pendingItems: PendingItem[];
  approvalHistory: ApprovalHistoryItem[];
}

export interface ReviewActionInput {
  entityType: ReviewEntityType;
  entityId: string;
  targetUserId: string;
  action: ReviewAction;
  comment: string;
}

export interface ApiResponse<T> {
  data: T;
  generatedAt: string;
}
