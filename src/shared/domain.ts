export type AppRoute =
  | "/"
  | "/plan"
  | "/today"
  | "/pending"
  | "/report"
  | "/kpi"
  | "/team"
  | "/admin"
  | "/exports";

export interface NavigationItem {
  label: string;
  href: AppRoute;
  description: string;
}

export interface SummaryCard {
  label: string;
  value: string;
  tone: "calm" | "focus" | "alert" | "success";
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

export interface ApiResponse<T> {
  data: T;
  generatedAt: string;
}

