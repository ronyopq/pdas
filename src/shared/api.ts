import type { ApiResponse, DashboardPayload, NavigationItem } from "./domain";

async function getJson<T>(input: string): Promise<ApiResponse<T>> {
  const response = await fetch(input);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as ApiResponse<T>;
}

export function fetchNavigation() {
  return getJson<NavigationItem[]>("/api/meta/navigation");
}

export function fetchDashboard() {
  return getJson<DashboardPayload>("/api/dashboard/summary");
}

