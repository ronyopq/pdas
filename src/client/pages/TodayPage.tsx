import { useEffect, useMemo, useState } from "react";
import {
  addDailyActivityRow,
  deleteDailyActivityRow,
  deleteDailyRowAttachment,
  fetchCurrentDailySheet,
  fetchPendingItems,
  submitDailySheet,
  updateDailyActivityRow,
  updateDailySheet,
  uploadDailyRowAttachment,
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
    followUpPerson: "",
    followUpDate: "",
    followUpNote: "",
  };
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
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);
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
    const rows = sheet?.rows ?? [];
    return {
      rowCount: rows.length,
      followUpCount: rows.filter((row) => row.isFollowUpGenerated || Boolean(row.followUpDate)).length,
      attachmentCount: rows.reduce((sum, row) => sum + row.attachments.length, 0),
    };
  }, [sheet]);

  function updateLocalRow(rowId: string, patch: Partial<DailyActivityRow>) {
    setSheet((current) =>
      current
        ? {
            ...current,
            rows: current.rows.map((entry) => (entry.id === rowId ? { ...entry, ...patch } : entry)),
          }
        : current,
    );
  }

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
        followUpPerson: row.followUpPerson,
        followUpDate: row.followUpDate,
        followUpNote: row.followUpNote,
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

  async function uploadAttachment(rowId: string, file: File | null) {
    if (!sheet || !file) return;

    setUploadingRowId(rowId);
    setError(null);
    try {
      const result = await uploadDailyRowAttachment(sheet.id, rowId, file);
      updateLocalRow(rowId, {
        attachments: [...(sheet.rows.find((row) => row.id === rowId)?.attachments ?? []), result.data],
      });
    } catch {
      setError("Unable to upload attachment. Only .docx and .xlsx are allowed.");
    } finally {
      setUploadingRowId(null);
    }
  }

  async function removeAttachment(rowId: string, attachmentId: string) {
    setUploadingRowId(rowId);
    setError(null);
    try {
      await deleteDailyRowAttachment(attachmentId);
      updateLocalRow(rowId, {
        attachments: (sheet?.rows.find((row) => row.id === rowId)?.attachments ?? []).filter(
          (attachment) => attachment.id !== attachmentId,
        ),
      });
    } catch {
      setError("Unable to delete attachment.");
    } finally {
      setUploadingRowId(null);
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
              Record each activity with time, note, follow-up, and office document support. Status:{" "}
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
            <span>Follow-ups</span>
            <input value={String(stats.followUpCount)} disabled />
          </label>
          <label>
            <span>Attachments</span>
            <input value={String(stats.attachmentCount)} disabled />
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
          <p>These come from today&apos;s work plan and open carry-forward items.</p>
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
          <h3>Activity rows</h3>
          <p>Follow-up dates auto-create a new row on the due date and appear in the sticky reminder area.</p>
        </div>

        <div className="daily-row-stack">
          {sheet.rows.map((row) => (
            <article key={row.id} className="daily-row-card">
              <div className="daily-row-head">
                <div>
                  <strong>{row.linkLabel ?? "Direct activity"}</strong>
                  <span>
                    {row.startTime} - {row.endTime}
                  </span>
                </div>
                <div className="toolbar-actions">
                  {row.isFollowUpGenerated ? (
                    <span className="badge-chip">
                      Follow-up from {row.followUpSourceDate ?? "previous day"}
                    </span>
                  ) : null}
                  <select
                    value={row.status}
                    onChange={(event) =>
                      updateLocalRow(row.id, { status: event.target.value as DailyActivityRow["status"] })
                    }
                  >
                    {activityStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="daily-row-grid">
                <label className="stack-field">
                  <span>Start / End</span>
                  <div className="inline-pair">
                    <input
                      type="time"
                      value={row.startTime}
                      onChange={(event) => updateLocalRow(row.id, { startTime: event.target.value })}
                    />
                    <input
                      type="time"
                      value={row.endTime}
                      onChange={(event) => updateLocalRow(row.id, { endTime: event.target.value })}
                    />
                  </div>
                </label>

                <label className="stack-field">
                  <span>Activity</span>
                  <textarea
                    value={row.actualActivity}
                    onChange={(event) => updateLocalRow(row.id, { actualActivity: event.target.value })}
                  />
                </label>

                <label className="stack-field">
                  <span>Output</span>
                  <textarea
                    value={row.actualOutput}
                    onChange={(event) => updateLocalRow(row.id, { actualOutput: event.target.value })}
                  />
                </label>

                <label className="stack-field">
                  <span>Notes</span>
                  <textarea
                    value={row.rowNote}
                    onChange={(event) => updateLocalRow(row.id, { rowNote: event.target.value })}
                  />
                </label>
              </div>

              <div className="daily-row-grid details-grid">
                <label className="stack-field">
                  <span>Carry forward</span>
                  <select
                    value={row.carryForwardAction}
                    onChange={(event) =>
                      updateLocalRow(row.id, {
                        carryForwardAction: event.target.value as DailyActivityRow["carryForwardAction"],
                      })
                    }
                  >
                    {carryForwardOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="stack-field">
                  <span>Follow-up person</span>
                  <input
                    value={row.followUpPerson}
                    onChange={(event) => updateLocalRow(row.id, { followUpPerson: event.target.value })}
                    placeholder="Person responsible"
                  />
                </label>

                <label className="stack-field">
                  <span>Follow-up date</span>
                  <input
                    type="date"
                    value={row.followUpDate}
                    onChange={(event) => updateLocalRow(row.id, { followUpDate: event.target.value })}
                  />
                </label>

                <label className="stack-field">
                  <span>Follow-up note</span>
                  <textarea
                    value={row.followUpNote}
                    onChange={(event) => updateLocalRow(row.id, { followUpNote: event.target.value })}
                    placeholder="This will be referenced in the auto-created follow-up activity."
                  />
                </label>
              </div>

              <div className="attachment-panel">
                <div className="attachment-header">
                  <strong>Supporting files</strong>
                  <span>Allowed: .docx, .xlsx</span>
                </div>
                <div className="attachment-list">
                  {row.attachments.map((attachment) => (
                    <div key={attachment.id} className="attachment-chip">
                      <a href={attachment.downloadUrl}>{attachment.fileName}</a>
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() => removeAttachment(row.id, attachment.id)}
                        disabled={uploadingRowId === row.id}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {row.attachments.length === 0 ? <span className="attachment-empty">No file uploaded.</span> : null}
                </div>
                <input
                  type="file"
                  accept=".docx,.xlsx"
                  onChange={(event) => uploadAttachment(row.id, event.target.files?.[0] ?? null)}
                  disabled={uploadingRowId === row.id}
                />
              </div>

              <div className="toolbar-actions">
                <label className="check-inline">
                  <input
                    type="checkbox"
                    checked={row.deliveryRequired}
                    onChange={(event) => updateLocalRow(row.id, { deliveryRequired: event.target.checked })}
                  />
                  Delivery needed
                </label>
                <label className="check-inline">
                  <input
                    type="checkbox"
                    checked={row.deliveryDone}
                    onChange={(event) => updateLocalRow(row.id, { deliveryDone: event.target.checked })}
                  />
                  Delivered
                </label>
                <button type="button" className="ghost-button" onClick={() => saveRow(row)} disabled={saving}>
                  Save row
                </button>
                <button type="button" className="ghost-button" onClick={() => saveRow(row)} disabled={saving}>
                  Save follow-up
                </button>
                <button type="button" className="ghost-button danger" onClick={() => removeRow(row.id)} disabled={saving}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-card">
        <div className="section-heading">
          <h3>Add new activity</h3>
          <p>Create a new time-based row and optionally schedule a follow-up immediately.</p>
        </div>

        <div className="daily-row-grid">
          <label className="stack-field">
            <span>Task source</span>
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
                onChange={(event) => setNewRow((current) => ({ ...current, adHocReason: event.target.value, isAdHoc: true }))}
              />
            ) : null}
          </label>

          <label className="stack-field">
            <span>Start / End</span>
            <div className="inline-pair">
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
          </label>

          <label className="stack-field">
            <span>Activity</span>
            <textarea
              value={newRow.actualActivity}
              onChange={(event) => setNewRow((current) => ({ ...current, actualActivity: event.target.value }))}
              placeholder="What did you do?"
            />
          </label>

          <label className="stack-field">
            <span>Output</span>
            <textarea
              value={newRow.actualOutput}
              onChange={(event) => setNewRow((current) => ({ ...current, actualOutput: event.target.value }))}
              placeholder="What was the output?"
            />
          </label>

          <label className="stack-field">
            <span>Notes</span>
            <textarea
              value={newRow.rowNote}
              onChange={(event) => setNewRow((current) => ({ ...current, rowNote: event.target.value }))}
            />
          </label>

          <label className="stack-field">
            <span>Status</span>
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
          </label>
        </div>

        <div className="daily-row-grid details-grid">
          <label className="stack-field">
            <span>Follow-up person</span>
            <input
              value={newRow.followUpPerson}
              onChange={(event) => setNewRow((current) => ({ ...current, followUpPerson: event.target.value }))}
            />
          </label>
          <label className="stack-field">
            <span>Follow-up date</span>
            <input
              type="date"
              value={newRow.followUpDate}
              onChange={(event) => setNewRow((current) => ({ ...current, followUpDate: event.target.value }))}
            />
          </label>
          <label className="stack-field">
            <span>Follow-up note</span>
            <textarea
              value={newRow.followUpNote}
              onChange={(event) => setNewRow((current) => ({ ...current, followUpNote: event.target.value }))}
            />
          </label>
          <label className="stack-field">
            <span>Carry forward</span>
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
          </label>
        </div>

        <div className="toolbar-actions">
          <label className="check-inline">
            <input
              type="checkbox"
              checked={newRow.deliveryRequired}
              onChange={(event) => setNewRow((current) => ({ ...current, deliveryRequired: event.target.checked }))}
            />
            Delivery needed
          </label>
          <label className="check-inline">
            <input
              type="checkbox"
              checked={newRow.deliveryDone}
              onChange={(event) => setNewRow((current) => ({ ...current, deliveryDone: event.target.checked }))}
            />
            Delivered
          </label>
          <button type="button" className="primary-button" onClick={createRow} disabled={saving}>
            Add activity
          </button>
        </div>
      </section>
    </div>
  );
}
