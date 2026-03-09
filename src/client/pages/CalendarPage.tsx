import { useEffect, useMemo, useState } from "react";
import { fetchCurrentWorkPlan } from "../../shared/api";
import type { MonthlyWorkPlan } from "../../shared/domain";

function currentMonthInDhaka() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "03";
  return `${year}-${month}`;
}

function parseMonthValue(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  return { month, year };
}

function buildCalendarDays(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  return Array.from({ length: totalDays }, (_, index) => `${monthValue}-${String(index + 1).padStart(2, "0")}`);
}

function monthLabel(monthValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${monthValue}-01`));
}

export function CalendarPage() {
  const [monthValue, setMonthValue] = useState(currentMonthInDhaka());
  const [plan, setPlan] = useState<MonthlyWorkPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { month, year } = parseMonthValue(monthValue);
    setLoading(true);
    setError(null);
    fetchCurrentWorkPlan(month, year)
      .then((result) => setPlan(result.data))
      .catch(() => setError("Unable to load calendar view."))
      .finally(() => setLoading(false));
  }, [monthValue]);

  const days = useMemo(() => buildCalendarDays(monthValue), [monthValue]);

  if (loading) {
    return <section className="page-card">Loading calendar...</section>;
  }

  return (
    <div className="page-grid">
      <section className="page-card">
        <div className="page-toolbar">
          <div className="section-heading">
            <h3>Calendar view</h3>
            <p>{monthLabel(monthValue)} plan and travel rows in a date-based layout.</p>
          </div>
          <label className="inline-field">
            <span>Month</span>
            <input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />
          </label>
        </div>
        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      <section className="page-card">
        <div className="calendar-grid">
          {days.map((day) => {
            const planRows = plan?.rows.filter((row) => row.workDate === day) ?? [];
            const travelRows = plan?.travelRows.filter((row) => row.travelDate === day) ?? [];
            const hasPending = planRows.some((row) => row.rowStatus === "pending" || row.rowStatus === "overdue");
            return (
              <article key={day} className={`calendar-cell${hasPending ? " has-pending" : ""}`}>
                <div className="calendar-day-head">
                  <strong>{day.slice(-2)}</strong>
                  <span>{planRows.length + travelRows.length} item</span>
                </div>
                <div className="calendar-list">
                  {planRows.slice(0, 3).map((row) => (
                    <div key={row.id} className={`calendar-item tone-${row.rowStatus === "overdue" ? "alert" : row.rowStatus === "pending" ? "focus" : "calm"}`}>
                      <strong>{row.activity}</strong>
                      <span>{row.expectedOutput || "No output set"}</span>
                    </div>
                  ))}
                  {travelRows.slice(0, 2).map((row) => (
                    <div key={row.id} className={`calendar-item tone-${row.status === "overdue" ? "alert" : row.status === "pending" ? "focus" : "calm"}`}>
                      <strong>Travel: {row.destination}</strong>
                      <span>{row.expectedOutput || "Travel item"}</span>
                    </div>
                  ))}
                  {planRows.length === 0 && travelRows.length === 0 ? (
                    <div className="calendar-empty">No planned item</div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
