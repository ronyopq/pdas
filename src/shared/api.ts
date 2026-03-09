import type {
  ApiResponse,
  DailyActivityRow,
  DailyActivityRowInput,
  DailySheet,
  DashboardPayload,
  LoginInput,
  MonthlyReport,
  MonthlyReportUpdateInput,
  MonthlyWorkPlan,
  NavigationItem,
  PendingActionInput,
  PendingItem,
  TravelPlanRow,
  TravelPlanRowInput,
  UserSession,
  WorkPlanRow,
  WorkPlanRowInput,
} from "./domain";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(input, {
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Ignore invalid JSON error bodies.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as ApiResponse<T>;
}

export function fetchNavigation() {
  return requestJson<NavigationItem[]>("/api/meta/navigation");
}

export function fetchDashboard() {
  return requestJson<DashboardPayload>("/api/dashboard/summary");
}

export function fetchCurrentUser() {
  return requestJson<UserSession>("/api/auth/me");
}

export function login(input: LoginInput) {
  return requestJson<UserSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return requestJson<{ success: true }>("/api/auth/logout", {
    method: "POST",
  });
}

export function fetchCurrentWorkPlan(month: number, year: number) {
  return requestJson<MonthlyWorkPlan>(`/api/work-plans/current?month=${month}&year=${year}`);
}

export function updateWorkPlan(planId: string, preparedDate: string) {
  return requestJson<MonthlyWorkPlan>(`/api/work-plans/${planId}`, {
    method: "PATCH",
    body: JSON.stringify({ preparedDate }),
  });
}

export function addWorkPlanRow(planId: string, input: WorkPlanRowInput) {
  return requestJson<WorkPlanRow>(`/api/work-plans/${planId}/rows`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateWorkPlanRow(planId: string, rowId: string, input: WorkPlanRowInput) {
  return requestJson<WorkPlanRow>(`/api/work-plans/${planId}/rows/${rowId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteWorkPlanRow(planId: string, rowId: string) {
  return requestJson<{ success: true }>(`/api/work-plans/${planId}/rows/${rowId}`, {
    method: "DELETE",
  });
}

export function addTravelRow(planId: string, input: TravelPlanRowInput) {
  return requestJson<TravelPlanRow>(`/api/work-plans/${planId}/travel-rows`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTravelRow(planId: string, rowId: string, input: TravelPlanRowInput) {
  return requestJson<TravelPlanRow>(`/api/work-plans/${planId}/travel-rows/${rowId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTravelRow(planId: string, rowId: string) {
  return requestJson<{ success: true }>(`/api/work-plans/${planId}/travel-rows/${rowId}`, {
    method: "DELETE",
  });
}

export function submitWorkPlan(planId: string) {
  return requestJson<MonthlyWorkPlan>(`/api/work-plans/${planId}/submit`, {
    method: "POST",
  });
}

export function fetchCurrentDailySheet(workDate: string) {
  return requestJson<DailySheet>(`/api/daily-sheets/current?date=${workDate}`);
}

export function updateDailySheet(sheetId: string, note: string) {
  return requestJson<DailySheet>(`/api/daily-sheets/${sheetId}`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export function addDailyActivityRow(sheetId: string, input: DailyActivityRowInput) {
  return requestJson<DailyActivityRow>(`/api/daily-sheets/${sheetId}/rows`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDailyActivityRow(sheetId: string, rowId: string, input: DailyActivityRowInput) {
  return requestJson<DailyActivityRow>(`/api/daily-sheets/${sheetId}/rows/${rowId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteDailyActivityRow(sheetId: string, rowId: string) {
  return requestJson<{ success: true }>(`/api/daily-sheets/${sheetId}/rows/${rowId}`, {
    method: "DELETE",
  });
}

export function submitDailySheet(sheetId: string) {
  return requestJson<DailySheet>(`/api/daily-sheets/${sheetId}/submit`, {
    method: "POST",
  });
}

export function fetchPendingItems(workDate: string) {
  return requestJson<PendingItem[]>(`/api/pending?date=${workDate}`);
}

export function applyPendingAction(itemId: string, input: PendingActionInput) {
  return requestJson<{ success: true }>(`/api/pending/${itemId}/action`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchCurrentMonthlyReport(month: number, year: number) {
  return requestJson<MonthlyReport>(`/api/monthly-reports/current?month=${month}&year=${year}`);
}

export function updateMonthlyReport(reportId: string, input: MonthlyReportUpdateInput) {
  return requestJson<MonthlyReport>(`/api/monthly-reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function regenerateMonthlyReport(reportId: string) {
  return requestJson<MonthlyReport>(`/api/monthly-reports/${reportId}/regenerate`, {
    method: "POST",
  });
}

export function submitMonthlyReport(reportId: string) {
  return requestJson<MonthlyReport>(`/api/monthly-reports/${reportId}/submit`, {
    method: "POST",
  });
}
