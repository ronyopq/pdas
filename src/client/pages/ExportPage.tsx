import { useEffect, useState } from "react";
import { fetchCurrentDailySheet, fetchCurrentMonthlyReport, fetchCurrentWorkPlan } from "../../shared/api";

function todayInDhaka() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "03";
  const day = parts.find((part) => part.type === "day")?.value ?? "09";
  return `${year}-${month}-${day}`;
}

function monthFromDate(dateValue: string) {
  return dateValue.slice(0, 7);
}

function parseMonthValue(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  return { month, year };
}

export function ExportPage() {
  const [workDate, setWorkDate] = useState(todayInDhaka());
  const [monthValue, setMonthValue] = useState(monthFromDate(todayInDhaka()));
  const [reportStatus, setReportStatus] = useState<string>("-");
  const [planStatus, setPlanStatus] = useState<string>("-");
  const [dailyStatus, setDailyStatus] = useState<string>("-");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { month, year } = parseMonthValue(monthValue);
    setError(null);
    Promise.all([
      fetchCurrentWorkPlan(month, year),
      fetchCurrentMonthlyReport(month, year),
      fetchCurrentDailySheet(workDate),
    ])
      .then(([planResult, reportResult, dailyResult]) => {
        setPlanStatus(planResult.data.status);
        setReportStatus(reportResult.data.status);
        setDailyStatus(dailyResult.data.status);
      })
      .catch(() => setError("Unable to load export readiness status."));
  }, [monthValue, workDate]);

  const { month, year } = parseMonthValue(monthValue);

  return (
    <div className="page-grid">
      <section className="page-card">
        <div className="section-heading">
          <h3>Export center</h3>
          <p>Generate Excel, Word, PDF, and print-ready outputs directly from the current data.</p>
        </div>

        <div className="form-grid compact-grid">
          <label>
            <span>Month</span>
            <input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />
          </label>
          <label>
            <span>Daily Date</span>
            <input type="date" value={workDate} onChange={(event) => setWorkDate(event.target.value)} />
          </label>
          <label>
            <span>Work Plan Status</span>
            <input value={planStatus} disabled />
          </label>
          <label>
            <span>Monthly Report Status</span>
            <input value={reportStatus} disabled />
          </label>
          <label>
            <span>Daily Sheet Status</span>
            <input value={dailyStatus} disabled />
          </label>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      <div className="export-grid">
        <section className="page-card export-card">
          <div className="section-heading">
            <h3>Monthly work plan</h3>
            <p>Excel export aligned to the work plan table structure.</p>
          </div>
          <a className="primary-button" href={`/api/exports/work-plans/current.xlsx?month=${month}&year=${year}`}>
            Download Excel
          </a>
        </section>

        <section className="page-card export-card">
          <div className="section-heading">
            <h3>Monthly report</h3>
            <p>Word, PDF, and print outputs generated from the editable monthly report draft.</p>
          </div>
          <div className="toolbar-actions">
            <a className="primary-button" href={`/api/exports/monthly-reports/current.docx?month=${month}&year=${year}`}>
              Download Word
            </a>
            <a className="ghost-button" href={`/api/exports/monthly-reports/current.pdf?month=${month}&year=${year}`}>
              Download PDF
            </a>
            <a className="ghost-button" href={`/api/exports/monthly-reports/current.print?month=${month}&year=${year}`} target="_blank" rel="noreferrer">
              Open Print View
            </a>
          </div>
        </section>

        <section className="page-card export-card">
          <div className="section-heading">
            <h3>Daily activity register</h3>
            <p>PDF and print views follow the daily register layout with note and delivery blocks.</p>
          </div>
          <div className="toolbar-actions">
            <a className="primary-button" href={`/api/exports/daily-sheets/current.pdf?date=${workDate}`}>
              Download PDF
            </a>
            <a className="ghost-button" href={`/api/exports/daily-sheets/current.print?date=${workDate}`} target="_blank" rel="noreferrer">
              Open Print View
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
