import { useEffect, useState } from "react";
import {
  fetchCurrentMonthlyReport,
  regenerateMonthlyReport,
  submitMonthlyReport,
  updateMonthlyReport,
} from "../../shared/api";
import type { MonthlyReport, MonthlyReportItem } from "../../shared/domain";

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

function emptyItem(source: MonthlyReportItem["source"]): MonthlyReportItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    output: "",
    referenceDate: "",
    remarks: "",
    source,
  };
}

type SectionKey = "completedTasks" | "ongoingTasks" | "nextMonthTasks";

export function ReportPage() {
  const [monthValue, setMonthValue] = useState(currentMonthInDhaka());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { month, year } = parseMonthValue(monthValue);
    setLoading(true);
    setError(null);
    fetchCurrentMonthlyReport(month, year)
      .then((result) => setReport(result.data))
      .catch(() => setError("Unable to load the monthly report draft."))
      .finally(() => setLoading(false));
  }, [monthValue]);

  function updateSection(section: SectionKey, updater: (items: MonthlyReportItem[]) => MonthlyReportItem[]) {
    setReport((current) => (current ? { ...current, [section]: updater(current[section]) } : current));
  }

  function updateItem(section: SectionKey, itemId: string, field: keyof MonthlyReportItem, value: string) {
    updateSection(section, (items) =>
      items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    );
  }

  async function saveReport() {
    if (!report) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateMonthlyReport(report.id, {
        submissionDate: report.submissionDate,
        completedTasks: report.completedTasks,
        ongoingTasks: report.ongoingTasks,
        nextMonthTasks: report.nextMonthTasks,
        lessonsLearned: report.lessonsLearned,
        comments: report.comments,
      });
      setReport(result.data);
    } catch {
      setError("Unable to save the monthly report.");
    } finally {
      setSaving(false);
    }
  }

  async function regenerateReport() {
    if (!report) return;
    setSaving(true);
    setError(null);
    try {
      const result = await regenerateMonthlyReport(report.id);
      setReport(result.data);
    } catch {
      setError("Unable to regenerate the report snapshots.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!report) return;
    setSaving(true);
    setError(null);
    try {
      const result = await submitMonthlyReport(report.id);
      setReport(result.data);
    } catch {
      setError("Unable to submit the monthly report.");
    } finally {
      setSaving(false);
    }
  }

  function renderSection(
    section: SectionKey,
    title: string,
    description: string,
    source: MonthlyReportItem["source"],
    referenceLabel: string,
  ) {
    if (!report) return null;

    return (
      <section className="page-card">
        <div className="page-toolbar">
          <div className="section-heading">
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => updateSection(section, (items) => [...items, emptyItem(source)])}
            disabled={saving}
          >
            Add row
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Output</th>
                <th>{referenceLabel}</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {report[section].map((item) => (
                <tr key={item.id}>
                  <td>
                    <textarea
                      value={item.title}
                      onChange={(event) => updateItem(section, item.id, "title", event.target.value)}
                    />
                  </td>
                  <td>
                    <textarea
                      value={item.output}
                      onChange={(event) => updateItem(section, item.id, "output", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={item.referenceDate}
                      onChange={(event) => updateItem(section, item.id, "referenceDate", event.target.value)}
                    />
                  </td>
                  <td>
                    <textarea
                      value={item.remarks}
                      onChange={(event) => updateItem(section, item.id, "remarks", event.target.value)}
                    />
                  </td>
                  <td className="action-cell">
                    <button
                      type="button"
                      className="ghost-button danger"
                      onClick={() => updateSection(section, (items) => items.filter((entry) => entry.id !== item.id))}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {report[section].length === 0 ? (
                <tr>
                  <td colSpan={5}>No items yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (loading) {
    return <section className="page-card">Loading monthly report...</section>;
  }

  if (!report) {
    return <section className="page-card">No monthly report available.</section>;
  }

  return (
    <div className="page-grid">
      <section className="page-card">
        <div className="page-toolbar">
          <div className="section-heading">
            <h3>Monthly report</h3>
            <p>Auto-draft comes from daily execution, pending tasks, and the next work plan cycle.</p>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="ghost-button" onClick={regenerateReport} disabled={saving}>
              Regenerate
            </button>
            <button type="button" className="ghost-button" onClick={saveReport} disabled={saving}>
              Save
            </button>
            <button type="button" className="primary-button" onClick={handleSubmit} disabled={saving}>
              {saving ? "Working..." : "Submit report"}
            </button>
          </div>
        </div>

        <div className="form-grid compact-grid">
          <label>
            <span>Month</span>
            <input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />
          </label>
          <label>
            <span>Status</span>
            <input value={report.status} disabled />
          </label>
          <label>
            <span>Submission Date</span>
            <input
              type="date"
              value={report.submissionDate}
              onChange={(event) => setReport((current) => (current ? { ...current, submissionDate: event.target.value } : current))}
            />
          </label>
          <label>
            <span>Employee</span>
            <input value={report.employeeName} disabled />
          </label>
          <label>
            <span>Designation</span>
            <input value={report.designation} disabled />
          </label>
          <label>
            <span>Project</span>
            <input value={report.projectName} disabled />
          </label>
        </div>

        <div className="card-grid report-summary-grid">
          <article className="stat-card tone-success">
            <span>Completed Tasks</span>
            <strong>{report.summary.completedCount}</strong>
          </article>
          <article className="stat-card tone-focus">
            <span>Ongoing Tasks</span>
            <strong>{report.summary.ongoingCount}</strong>
          </article>
          <article className="stat-card tone-calm">
            <span>Next Month Tasks</span>
            <strong>{report.summary.nextMonthCount}</strong>
          </article>
          <article className="stat-card tone-alert">
            <span>Ad hoc Rows</span>
            <strong>{report.summary.adHocCount}</strong>
          </article>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      {renderSection(
        "completedTasks",
        "Completed tasks",
        "These rows will go to the completed task section of the report and Word/PDF exports.",
        "plan",
        "Date",
      )}

      {renderSection(
        "ongoingTasks",
        "Ongoing tasks",
        "These items are still open or in progress at month end.",
        "carry_forward",
        "Deadline",
      )}

      {renderSection(
        "nextMonthTasks",
        "Tasks for next month",
        "These rows prepare the manager-facing next month commitments section.",
        "carry_forward",
        "Date",
      )}

      <section className="page-card">
        <div className="section-heading">
          <h3>Reflection</h3>
          <p>These text areas map to the lesson learned and comment blocks in the report template.</p>
        </div>
        <label className="block-field">
          <span>Lessons learned</span>
          <textarea
            value={report.lessonsLearned}
            onChange={(event) => setReport((current) => (current ? { ...current, lessonsLearned: event.target.value } : current))}
          />
        </label>
        <label className="block-field">
          <span>Comments</span>
          <textarea
            value={report.comments}
            onChange={(event) => setReport((current) => (current ? { ...current, comments: event.target.value } : current))}
          />
        </label>
      </section>
    </div>
  );
}
