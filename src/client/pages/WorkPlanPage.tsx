import { useEffect, useMemo, useState } from "react";
import type {
  MonthlyWorkPlan,
  TravelPlanRow,
  TravelPlanRowInput,
  WorkPlanRow,
  WorkPlanRowInput,
} from "../../shared/domain";
import {
  addTravelRow,
  addWorkPlanRow,
  deleteTravelRow,
  deleteWorkPlanRow,
  fetchCurrentWorkPlan,
  submitWorkPlan,
  updateTravelRow,
  updateWorkPlan,
  updateWorkPlanRow,
} from "../../shared/api";

const workTypeOptions: WorkPlanRow["rowType"][] = [
  "regular_work",
  "meeting",
  "field_visit",
  "travel",
  "holiday",
  "weekend",
  "leave",
  "reserved",
];

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

function monthLabel(monthValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${monthValue}-01`));
}

function defaultDateForMonth(monthValue: string) {
  return `${monthValue}-01`;
}

function emptyPlanRow(workDate: string): WorkPlanRowInput {
  return {
    workDate,
    activity: "",
    expectedOutput: "",
    rowType: "regular_work",
  };
}

function emptyTravelRow(travelDate: string): TravelPlanRowInput {
  return {
    travelDate,
    destination: "",
    purpose: "",
    expectedOutput: "",
  };
}

export function WorkPlanPage() {
  const [monthValue, setMonthValue] = useState(currentMonthInDhaka());
  const [plan, setPlan] = useState<MonthlyWorkPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparedDate, setPreparedDate] = useState(defaultDateForMonth(currentMonthInDhaka()));
  const [newRow, setNewRow] = useState<WorkPlanRowInput>(emptyPlanRow(defaultDateForMonth(currentMonthInDhaka())));
  const [newTravelRow, setNewTravelRow] = useState<TravelPlanRowInput>(
    emptyTravelRow(defaultDateForMonth(currentMonthInDhaka())),
  );

  useEffect(() => {
    const { month, year } = parseMonthValue(monthValue);
    const monthStart = defaultDateForMonth(monthValue);
    setLoading(true);
    fetchCurrentWorkPlan(month, year)
      .then((result) => {
        setPlan(result.data);
        setPreparedDate(result.data.preparedDate);
        setNewRow(emptyPlanRow(monthStart));
        setNewTravelRow(emptyTravelRow(monthStart));
      })
      .catch(() => setError("Unable to load the current work plan."))
      .finally(() => setLoading(false));
  }, [monthValue]);

  const pendingCount = useMemo(
    () =>
      plan?.rows.filter((row) => row.rowStatus === "pending" || row.rowStatus === "overdue").length ?? 0,
    [plan],
  );

  async function savePreparedDate() {
    if (!plan) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateWorkPlan(plan.id, preparedDate);
      setPlan(result.data);
    } catch {
      setError("Unable to save the prepared date.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRow(row: WorkPlanRow) {
    if (!plan) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateWorkPlanRow(plan.id, row.id, {
        workDate: row.workDate,
        activity: row.activity,
        expectedOutput: row.expectedOutput,
        rowType: row.rowType,
      });

      setPlan((current) =>
        current
          ? {
              ...current,
              rows: current.rows.map((entry) => (entry.id === result.data.id ? result.data : entry)),
            }
          : current,
      );
    } catch {
      setError("Unable to update the selected row.");
    } finally {
      setSaving(false);
    }
  }

  async function createRow() {
    if (!plan || !newRow.activity.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const result = await addWorkPlanRow(plan.id, newRow);
      setPlan((current) =>
        current
          ? {
              ...current,
              rows: [...current.rows, result.data],
            }
          : current,
      );
      setNewRow(emptyPlanRow(defaultDateForMonth(monthValue)));
    } catch {
      setError("Unable to add a new plan row.");
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(rowId: string) {
    if (!plan) return;
    setSaving(true);
    setError(null);
    try {
      await deleteWorkPlanRow(plan.id, rowId);
      setPlan((current) =>
        current
          ? {
              ...current,
              rows: current.rows
                .filter((entry) => entry.id !== rowId)
                .map((entry, index) => ({ ...entry, serialNo: index + 1 })),
            }
          : current,
      );
    } catch {
      setError("Unable to delete the selected row.");
    } finally {
      setSaving(false);
    }
  }

  async function saveTravelRow(row: TravelPlanRow) {
    if (!plan) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateTravelRow(plan.id, row.id, {
        travelDate: row.travelDate,
        destination: row.destination,
        purpose: row.purpose,
        expectedOutput: row.expectedOutput,
      });

      setPlan((current) =>
        current
          ? {
              ...current,
              travelRows: current.travelRows.map((entry) =>
                entry.id === result.data.id ? result.data : entry,
              ),
            }
          : current,
      );
    } catch {
      setError("Unable to update the selected travel row.");
    } finally {
      setSaving(false);
    }
  }

  async function createTravelRow() {
    if (!plan || !newTravelRow.destination.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const result = await addTravelRow(plan.id, newTravelRow);
      setPlan((current) =>
        current
          ? {
              ...current,
              travelRows: [...current.travelRows, result.data],
            }
          : current,
      );
      setNewTravelRow(emptyTravelRow(defaultDateForMonth(monthValue)));
    } catch {
      setError("Unable to add a new travel row.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTravelRow(rowId: string) {
    if (!plan) return;
    setSaving(true);
    setError(null);
    try {
      await deleteTravelRow(plan.id, rowId);
      setPlan((current) =>
        current
          ? {
              ...current,
              travelRows: current.travelRows
                .filter((entry) => entry.id !== rowId)
                .map((entry, index) => ({ ...entry, serialNo: index + 1 })),
            }
          : current,
      );
    } catch {
      setError("Unable to delete the selected travel row.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!plan) return;
    setSaving(true);
    setError(null);
    try {
      const result = await submitWorkPlan(plan.id);
      setPlan(result.data);
    } catch {
      setError("Unable to submit the work plan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className="page-card">Loading current work plan...</section>;
  }

  if (!plan) {
    return <section className="page-card">No work plan available.</section>;
  }

  return (
    <div className="page-grid">
      <section className="page-card">
        <div className="page-toolbar">
          <div className="section-heading">
            <h3>Monthly work plan</h3>
            <p>
              {monthLabel(monthValue)} for {plan.employeeName}. Status: <strong>{plan.status}</strong>
            </p>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="ghost-button" onClick={savePreparedDate} disabled={saving}>
              Save header
            </button>
            <button type="button" className="primary-button" onClick={handleSubmit} disabled={saving}>
              {saving ? "Working..." : "Submit for review"}
            </button>
          </div>
        </div>

        <div className="form-grid compact-grid">
          <label>
            <span>Month</span>
            <input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />
          </label>
          <label>
            <span>Prepared Date</span>
            <input
              type="date"
              value={preparedDate}
              onChange={(event) => setPreparedDate(event.target.value)}
            />
          </label>
          <label>
            <span>Employee</span>
            <input value={plan.employeeName} disabled />
          </label>
          <label>
            <span>Designation</span>
            <input value={plan.designation} disabled />
          </label>
          <label>
            <span>Project</span>
            <input value={plan.projectName} disabled />
          </label>
          <label>
            <span>Supervisor</span>
            <input value={plan.supervisorName} disabled />
          </label>
          <label>
            <span>Pending rows</span>
            <input value={String(pendingCount)} disabled />
          </label>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      <section className="page-card">
        <div className="section-heading">
          <h3>Plan rows</h3>
          <p>Edit the date-wise rows here. Each save call already hits the Worker API.</p>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sl</th>
                <th>Date</th>
                <th>Activity</th>
                <th>Expected Output</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plan.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.serialNo}</td>
                  <td>
                    <input
                      type="date"
                      value={row.workDate}
                      onChange={(event) =>
                        setPlan((current) =>
                          current
                            ? {
                                ...current,
                                rows: current.rows.map((entry) =>
                                  entry.id === row.id ? { ...entry, workDate: event.target.value } : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.activity}
                      onChange={(event) =>
                        setPlan((current) =>
                          current
                            ? {
                                ...current,
                                rows: current.rows.map((entry) =>
                                  entry.id === row.id ? { ...entry, activity: event.target.value } : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.expectedOutput}
                      onChange={(event) =>
                        setPlan((current) =>
                          current
                            ? {
                                ...current,
                                rows: current.rows.map((entry) =>
                                  entry.id === row.id
                                    ? { ...entry, expectedOutput: event.target.value }
                                    : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={row.rowType}
                      onChange={(event) =>
                        setPlan((current) =>
                          current
                            ? {
                                ...current,
                                rows: current.rows.map((entry) =>
                                  entry.id === row.id
                                    ? { ...entry, rowType: event.target.value as WorkPlanRow["rowType"] }
                                    : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    >
                      {workTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="action-cell">
                    <button type="button" className="ghost-button" onClick={() => saveRow(row)} disabled={saving}>
                      Save
                    </button>
                    <button type="button" className="ghost-button danger" onClick={() => removeRow(row.id)} disabled={saving}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td>+</td>
                <td>
                  <input
                    type="date"
                    value={newRow.workDate}
                    onChange={(event) => setNewRow((current) => ({ ...current, workDate: event.target.value }))}
                  />
                </td>
                <td>
                  <textarea
                    value={newRow.activity}
                    onChange={(event) => setNewRow((current) => ({ ...current, activity: event.target.value }))}
                    placeholder="Add a new planned activity"
                  />
                </td>
                <td>
                  <textarea
                    value={newRow.expectedOutput}
                    onChange={(event) =>
                      setNewRow((current) => ({ ...current, expectedOutput: event.target.value }))
                    }
                    placeholder="Expected output"
                  />
                </td>
                <td>
                  <select
                    value={newRow.rowType}
                    onChange={(event) =>
                      setNewRow((current) => ({
                        ...current,
                        rowType: event.target.value as WorkPlanRow["rowType"],
                      }))
                    }
                  >
                    {workTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="action-cell">
                  <button type="button" className="primary-button" onClick={createRow} disabled={saving}>
                    Add row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="page-card">
        <div className="section-heading">
          <h3>Travel plan</h3>
          <p>This section stays in the same monthly plan because the export format expects it.</p>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sl</th>
                <th>Date</th>
                <th>Destination</th>
                <th>Purpose</th>
                <th>Expected Output</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plan.travelRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.serialNo}</td>
                  <td>
                    <input
                      type="date"
                      value={row.travelDate}
                      onChange={(event) =>
                        setPlan((current) =>
                          current
                            ? {
                                ...current,
                                travelRows: current.travelRows.map((entry) =>
                                  entry.id === row.id ? { ...entry, travelDate: event.target.value } : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.destination}
                      onChange={(event) =>
                        setPlan((current) =>
                          current
                            ? {
                                ...current,
                                travelRows: current.travelRows.map((entry) =>
                                  entry.id === row.id ? { ...entry, destination: event.target.value } : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.purpose}
                      onChange={(event) =>
                        setPlan((current) =>
                          current
                            ? {
                                ...current,
                                travelRows: current.travelRows.map((entry) =>
                                  entry.id === row.id ? { ...entry, purpose: event.target.value } : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.expectedOutput}
                      onChange={(event) =>
                        setPlan((current) =>
                          current
                            ? {
                                ...current,
                                travelRows: current.travelRows.map((entry) =>
                                  entry.id === row.id
                                    ? { ...entry, expectedOutput: event.target.value }
                                    : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                  </td>
                  <td className="action-cell">
                    <button type="button" className="ghost-button" onClick={() => saveTravelRow(row)} disabled={saving}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="ghost-button danger"
                      onClick={() => removeTravelRow(row.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td>+</td>
                <td>
                  <input
                    type="date"
                    value={newTravelRow.travelDate}
                    onChange={(event) =>
                      setNewTravelRow((current) => ({ ...current, travelDate: event.target.value }))
                    }
                  />
                </td>
                <td>
                  <textarea
                    value={newTravelRow.destination}
                    onChange={(event) =>
                      setNewTravelRow((current) => ({ ...current, destination: event.target.value }))
                    }
                  />
                </td>
                <td>
                  <textarea
                    value={newTravelRow.purpose}
                    onChange={(event) =>
                      setNewTravelRow((current) => ({ ...current, purpose: event.target.value }))
                    }
                  />
                </td>
                <td>
                  <textarea
                    value={newTravelRow.expectedOutput}
                    onChange={(event) =>
                      setNewTravelRow((current) => ({ ...current, expectedOutput: event.target.value }))
                    }
                  />
                </td>
                <td className="action-cell">
                  <button type="button" className="primary-button" onClick={createTravelRow} disabled={saving}>
                    Add travel
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
