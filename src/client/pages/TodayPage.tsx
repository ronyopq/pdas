import { useEffect, useMemo, useState } from "react";
import {
  addDailyActivityRow,
  deleteDailyActivityRow,
  fetchCurrentDailySheet,
  fetchPendingItems,
  submitDailySheet,
  updateDailyActivityRow,
  updateDailySheet,
} from "../../shared/api";
import type {
  CarryForwardAction,
  DailyActivityRow,
  DailyActivityRowInput,
  DailySheet,
  PendingItem,
} from "../../shared/domain";

const carryForwardOptions: CarryForwardAction[] = [
  "none",
  "continue_next_day",
  "reschedule_current_month",
  "move_next_month",
  "cancel",
];

const activityStatusOptions: DailyActivityRow["status"][] = [
  "not_started",
  "in_progress",
  "completed",
  "deferred",
  "cancelled",
];

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

function emptyNewRow(): DailyActivityRowInput {
  return {
    linkedPlanRowId: null,
    linkedTravelRowId: null,
    startTime: "10:00",
    endTime: "11:00",
    actualActivity: "",
    actualOutput: "",
    status: "in_progress",
    deliveryRequired: false,
    deliveryDone: false,
    isAdHoc: true,
    adHocReason: "",
    carryForwardAction: "none",
    rowNote: "",
  };
}

function buildSelection(row: DailyActivityRow) {
  if (row.linkedPlanRowId) return `plan:${row.linkedPlanRowId}`;
  if (row.linkedTravelRowId) return `travel:${row.linkedTravelRowId}`;
  return "adhoc";
}

function applySelection(input: DailyActivityRowInput, selection: string): DailyActivityRowInput {
  if (selection === "adhoc") {
    return {
      ...input,
      linkedPlanRowId: null,
      linkedTravelRowId: null,
      isAdHoc: true,
    };
  }

  if (selection.startsWith("plan:")) {
    return {
      ...input,
      linkedPlanRowId: selection.slice(5),
      linkedTravelRowId: null,
      isAdHoc: false,
      adHocReason: "",
    };
  }

  return {
    ...input,
    linkedPlanRowId: null,
    linkedTravelRowId: selection.slice(7),
    isAdHoc: false,
    adHocReason: "",
  };
}

export function TodayPage() {
  const [workDate, setWorkDate] = useState(todayInDhaka());
  const [sheet, setSheet] = useState<DailySheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetNote, setSheetNote] = useState("");
  const [newRow, setNewRow] = useState<DailyActivityRowInput>(emptyNewRow());
  const [newSelection, setNewSelection] = useState("adhoc");
  const [pending, setPending] = useState<PendingItem[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCurrentDailySheet(workDate), fetchPendingItems(workDate)])
      .then(([sheetResult, pendingResult]) => {
        setSheet(sheetResult.data);
        setSheetNote(sheetResult.data.note);
        setPending(pendingResult.data);
      })
      .catch(() => setError("Unable to load the daily workspace."))
      .finally(() => setLoading(false));
  }, [workDate]);

  const stats = useMemo(() => {
    const rowCount = sheet?.rows.length ?? 0;
    const linkedCount =
      sheet?.rows.filter((row) => Boolean(row.linkedPlanRowId) || Boolean(row.linkedTravelRowId)).length ?? 0;

    return {
      rowCount,
      linkedCount,
      optionCount: sheet?.taskOptions.length ?? 0,
    };
  }, [sheet]);

  async function saveNote() {
    if (!sheet) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateDailySheet(sheet.id, sheetNote);
      setSheet(result.data);
    } catch {
      setError("Unable to save the daily note.");
    } finally {
      setSaving(false);
    }
  }

  async function createRow() {
    if (!sheet || !newRow.actualActivity.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = applySelection(newRow, newSelection);
      const result = await addDailyActivityRow(sheet.id, payload);
      setSheet((current) =>
        current
          ? {
              ...current,
              rows: [...current.rows, result.data],
            }
          : current,
      );
      setNewRow(emptyNewRow());
      setNewSelection("adhoc");
    } catch {
      setError("Unable to add the daily activity row.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRow(row: DailyActivityRow) {
    if (!sheet) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateDailyActivityRow(sheet.id, row.id, {
        linkedPlanRowId: row.linkedPlanRowId,
        linkedTravelRowId: row.linkedTravelRowId,
        startTime: row.startTime,
        endTime: row.endTime,
        actualActivity: row.actualActivity,
        actualOutput: row.actualOutput,
        status: row.status,
        deliveryRequired: row.deliveryRequired,
        deliveryDone: row.deliveryDone,
        isAdHoc: row.isAdHoc,
        adHocReason: row.adHocReason,
        carryForwardAction: row.carryForwardAction,
        rowNote: row.rowNote,
      });
      setSheet((current) =>
        current
          ? {
              ...current,
              rows: current.rows.map((entry) => (entry.id === result.data.id ? result.data : entry)),
            }
          : current,
      );
    } catch {
      setError("Unable to save the selected activity row.");
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(rowId: string) {
    if (!sheet) return;
    setSaving(true);
    setError(null);
    try {
      await deleteDailyActivityRow(sheet.id, rowId);
      setSheet((current) =>
        current
          ? {
              ...current,
              rows: current.rows.filter((entry) => entry.id !== rowId),
            }
          : current,
      );
    } catch {
      setError("Unable to delete the selected row.");
    } finally {
      setSaving(false);
    }
  }

  async function submitSheet() {
    if (!sheet) return;
    setSaving(true);
    setError(null);
    try {
      const result = await submitDailySheet(sheet.id);
      setSheet(result.data);
      setPending((await fetchPendingItems(workDate)).data);
    } catch {
      setError("Unable to submit the daily sheet.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className="page-card">Loading daily sheet...</section>;
  }

  if (!sheet) {
    return <section className="page-card">No daily sheet available.</section>;
  }

  return (
    <div className="page-grid">
      <section className="page-card">
        <div className="page-toolbar">
          <div className="section-heading">
            <h3>Daily activity</h3>
            <p>
              Link daily work to today&apos;s planned tasks and pending items. Status:{" "}
              <strong>{sheet.status}</strong>
            </p>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="ghost-button" onClick={saveNote} disabled={saving}>
              Save note
            </button>
            <button type="button" className="primary-button" onClick={submitSheet} disabled={saving}>
              {saving ? "Working..." : "Submit day"}
            </button>
          </div>
        </div>

        <div className="form-grid compact-grid">
          <label>
            <span>Work Date</span>
            <input type="date" value={workDate} onChange={(event) => setWorkDate(event.target.value)} />
          </label>
          <label>
            <span>Rows</span>
            <input value={String(stats.rowCount)} disabled />
          </label>
          <label>
            <span>Linked Rows</span>
            <input value={String(stats.linkedCount)} disabled />
          </label>
          <label>
            <span>Available Task Links</span>
            <input value={String(stats.optionCount)} disabled />
          </label>
          <label>
            <span>Pending Count</span>
            <input value={String(pending.length)} disabled />
          </label>
        </div>

        <label className="block-field">
          <span>Day Note</span>
          <textarea value={sheetNote} onChange={(event) => setSheetNote(event.target.value)} />
        </label>

        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      <section className="page-card">
        <div className="section-heading">
          <h3>Task options</h3>
          <p>These come from today&apos;s plan rows, open carry-forward items and travel tasks.</p>
        </div>
        <ul className="stack-list">
          {sheet.taskOptions.map((option) => (
            <li key={`${option.kind}:${option.id}`}>
              <strong>{option.label}</strong>
              <span>{option.meta}</span>
              <p>{option.expectedOutput}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-card">
        <div className="section-heading">
          <h3>Daily rows</h3>
          <p>Each row saves directly to D1 through the Worker API.</p>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Linked Task</th>
                <th>Actual Activity</th>
                <th>Output</th>
                <th>Status</th>
                <th>Flags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="stack-field">
                      <input
                        type="time"
                        value={row.startTime}
                        onChange={(event) =>
                          setSheet((current) =>
                            current
                              ? {
                                  ...current,
                                  rows: current.rows.map((entry) =>
                                    entry.id === row.id ? { ...entry, startTime: event.target.value } : entry,
                                  ),
                                }
                              : current,
                          )
                        }
                      />
                      <input
                        type="time"
                        value={row.endTime}
                        onChange={(event) =>
                          setSheet((current) =>
                            current
                              ? {
                                  ...current,
                                  rows: current.rows.map((entry) =>
                                    entry.id === row.id ? { ...entry, endTime: event.target.value } : entry,
                                  ),
                                }
                              : current,
                          )
                        }
                      />
                    </div>
                  </td>
                  <td>
                    <textarea value={row.linkLabel ?? "Ad hoc"} disabled />
                  </td>
                  <td>
                    <textarea
                      value={row.actualActivity}
                      onChange={(event) =>
                        setSheet((current) =>
                          current
                            ? {
                                ...current,
                                rows: current.rows.map((entry) =>
                                  entry.id === row.id ? { ...entry, actualActivity: event.target.value } : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.actualOutput}
                      onChange={(event) =>
                        setSheet((current) =>
                          current
                            ? {
                                ...current,
                                rows: current.rows.map((entry) =>
                                  entry.id === row.id ? { ...entry, actualOutput: event.target.value } : entry,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                  </td>
                  <td>
                    <div className="stack-field">
                      <select
                        value={row.status}
                        onChange={(event) =>
                          setSheet((current) =>
                            current
                              ? {
                                  ...current,
                                  rows: current.rows.map((entry) =>
                                    entry.id === row.id
                                      ? { ...entry, status: event.target.value as DailyActivityRow["status"] }
                                      : entry,
                                  ),
                                }
                              : current,
                          )
                        }
                      >
                        {activityStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <select
                        value={row.carryForwardAction}
                        onChange={(event) =>
                          setSheet((current) =>
                            current
                              ? {
                                  ...current,
                                  rows: current.rows.map((entry) =>
                                    entry.id === row.id
                                      ? {
                                          ...entry,
                                          carryForwardAction: event.target.value as DailyActivityRow["carryForwardAction"],
                                        }
                                      : entry,
                                  ),
                                }
                              : current,
                          )
                        }
                      >
                        {carryForwardOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <div className="check-stack">
                      <label>
                        <input
                          type="checkbox"
                          checked={row.deliveryRequired}
                          onChange={(event) =>
                            setSheet((current) =>
                              current
                                ? {
                                    ...current,
                                    rows: current.rows.map((entry) =>
                                      entry.id === row.id
                                        ? { ...entry, deliveryRequired: event.target.checked }
                                        : entry,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                        Delivery needed
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={row.deliveryDone}
                          onChange={(event) =>
                            setSheet((current) =>
                              current
                                ? {
                                    ...current,
                                    rows: current.rows.map((entry) =>
                                      entry.id === row.id ? { ...entry, deliveryDone: event.target.checked } : entry,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                        Delivered
                      </label>
                    </div>
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
                <td>
                  <div className="stack-field">
                    <input
                      type="time"
                      value={newRow.startTime}
                      onChange={(event) => setNewRow((current) => ({ ...current, startTime: event.target.value }))}
                    />
                    <input
                      type="time"
                      value={newRow.endTime}
                      onChange={(event) => setNewRow((current) => ({ ...current, endTime: event.target.value }))}
                    />
                  </div>
                </td>
                <td>
                  <select value={newSelection} onChange={(event) => setNewSelection(event.target.value)}>
                    <option value="adhoc">Ad hoc</option>
                    {sheet.taskOptions.map((option) => (
                      <option key={`${option.kind}:${option.id}`} value={`${option.kind}:${option.id}`}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {newSelection === "adhoc" ? (
                    <input
                      value={newRow.adHocReason}
                      placeholder="Ad hoc reason"
                      onChange={(event) =>
                        setNewRow((current) => ({ ...current, adHocReason: event.target.value, isAdHoc: true }))
                      }
                    />
                  ) : null}
                </td>
                <td>
                  <textarea
                    value={newRow.actualActivity}
                    placeholder="What did you do?"
                    onChange={(event) => setNewRow((current) => ({ ...current, actualActivity: event.target.value }))}
                  />
                </td>
                <td>
                  <textarea
                    value={newRow.actualOutput}
                    placeholder="What was the output?"
                    onChange={(event) => setNewRow((current) => ({ ...current, actualOutput: event.target.value }))}
                  />
                </td>
                <td>
                  <div className="stack-field">
                    <select
                      value={newRow.status}
                      onChange={(event) =>
                        setNewRow((current) => ({
                          ...current,
                          status: event.target.value as DailyActivityRow["status"],
                        }))
                      }
                    >
                      {activityStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newRow.carryForwardAction}
                      onChange={(event) =>
                        setNewRow((current) => ({
                          ...current,
                          carryForwardAction: event.target.value as CarryForwardAction,
                        }))
                      }
                    >
                      {carryForwardOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>
                  <div className="check-stack">
                    <label>
                      <input
                        type="checkbox"
                        checked={newRow.deliveryRequired}
                        onChange={(event) =>
                          setNewRow((current) => ({ ...current, deliveryRequired: event.target.checked }))
                        }
                      />
                      Delivery needed
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={newRow.deliveryDone}
                        onChange={(event) =>
                          setNewRow((current) => ({ ...current, deliveryDone: event.target.checked }))
                        }
                      />
                      Delivered
                    </label>
                  </div>
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
    </div>
  );
}
