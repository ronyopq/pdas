import { useEffect, useMemo, useState } from "react";
import {
  addDailyActivityRow,
  ApiError,
  deleteDailyActivityRow,
  fetchCurrentDailySheet,
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  submitDailySheet,
  updateDailyActivityRow,
  updateDailySheet,
} from "../shared/api";
import type { DailyActivityRow, DailyActivityRowInput, DailySheet, UserSession } from "../shared/domain";

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

function shiftDate(date: string, offset: number) {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + offset);
  return base.toISOString().slice(0, 10);
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function emptyRow(): DailyActivityRowInput {
  return {
    linkedPlanRowId: null,
    linkedTravelRowId: null,
    startTime: "09:00",
    endTime: "10:00",
    actualActivity: "",
    actualOutput: "",
    status: "completed",
    deliveryRequired: false,
    deliveryDone: false,
    isAdHoc: true,
    adHocReason: "Direct entry",
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
      adHocReason: input.adHocReason.trim() || "Direct entry",
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

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<UserSession | null>(null);
  const [workDate, setWorkDate] = useState(todayInDhaka());
  const [sheet, setSheet] = useState<DailySheet | null>(null);
  const [note, setNote] = useState("");
  const [rowDraft, setRowDraft] = useState<DailyActivityRowInput>(emptyRow());
  const [draftSelection, setDraftSelection] = useState("adhoc");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ employeeCode: "", password: "" });

  useEffect(() => {
    fetchCurrentUser()
      .then((result) => setUser(result.data))
      .catch(() => setUser(null))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setSheet(null);
      return;
    }

    setBusy(true);
    setError(null);
    fetchCurrentDailySheet(workDate)
      .then((result) => {
        setSheet(result.data);
        setNote(result.data.note);
      })
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 401) {
          setUser(null);
          return;
        }

        setError("Unable to load this date.");
      })
      .finally(() => setBusy(false));
  }, [user, workDate]);

  const quickDates = useMemo(
    () => Array.from({ length: 6 }, (_, index) => shiftDate(todayInDhaka(), -index)),
    [],
  );

  const stats = useMemo(() => {
    const rows = sheet?.rows ?? [];
    return {
      total: rows.length,
      completed: rows.filter((row) => row.status === "completed").length,
      pending: rows.filter((row) => row.status !== "completed").length,
    };
  }, [sheet]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await loginRequest(loginForm);
      setUser(result.data);
      setLoginForm({ employeeCode: "", password: "" });
    } catch {
      setError("Login failed. Check employee code and password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError(null);
    try {
      await logoutRequest();
      setUser(null);
      setSheet(null);
    } catch {
      setError("Unable to logout right now.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!sheet) return;

    setBusy(true);
    setError(null);
    try {
      const result = await updateDailySheet(sheet.id, note);
      setSheet(result.data);
      setNote(result.data.note);
    } catch {
      setError("Unable to save note.");
    } finally {
      setBusy(false);
    }
  }

  async function addRow() {
    if (!sheet || !rowDraft.actualActivity.trim()) {
      setError("Write the activity first.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload = applySelection(rowDraft, draftSelection);
      const result = await addDailyActivityRow(sheet.id, payload);
      setSheet((current) =>
        current
          ? {
              ...current,
              rows: [...current.rows, result.data],
            }
          : current,
      );
      setRowDraft(emptyRow());
      setDraftSelection("adhoc");
    } catch {
      setError("Unable to add row.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRow(row: DailyActivityRow) {
    if (!sheet) return;

    setBusy(true);
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
              rows: current.rows.map((entry) => (entry.id === row.id ? result.data : entry)),
            }
          : current,
      );
    } catch {
      setError("Unable to save row.");
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(rowId: string) {
    if (!sheet) return;

    setBusy(true);
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
      setError("Unable to delete row.");
    } finally {
      setBusy(false);
    }
  }

  async function finalizeDay() {
    if (!sheet) return;

    setBusy(true);
    setError(null);
    try {
      const result = await submitDailySheet(sheet.id);
      setSheet(result.data);
    } catch {
      setError("Unable to finalize this day.");
    } finally {
      setBusy(false);
    }
  }

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

  if (booting) {
    return (
      <main className="daily-app-shell">
        <section className="panel loading-panel">Loading workspace...</section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="daily-app-shell">
        <section className="login-panel">
          <div className="login-copy">
            <span className="eyebrow">PRAAN Daily Entry</span>
            <h1>Simple daily activity entry</h1>
            <p>Login, choose a date, write daily work, save rows, and print the final sheet.</p>
            <div className="hint-box">
              <strong>Demo login</strong>
              <span>`rony001 / demo123`</span>
            </div>
          </div>

          <form className="login-form-simple" onSubmit={handleLogin}>
            <label>
              <span>Employee code</span>
              <input
                value={loginForm.employeeCode}
                onChange={(event) => setLoginForm((current) => ({ ...current, employeeCode: event.target.value }))}
                placeholder="rony001"
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="demo123"
              />
            </label>
            {error ? <div className="error-banner">{error}</div> : null}
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Open daily sheet"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="daily-app-shell">
      <section className="top-panel">
        <div>
          <span className="eyebrow">Daily Activity Register</span>
          <h1>Direct daily entry</h1>
          <p>
            Logged in as <strong>{user.fullName}</strong> ({user.employeeCode})
          </p>
        </div>

        <div className="top-actions">
          <button className="ghost-button" type="button" onClick={handleLogout} disabled={busy}>
            Logout
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => window.open(`/api/exports/daily-sheets/current.print?date=${workDate}`, "_blank", "noopener")}
          >
            Print
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => window.open(`/api/exports/daily-sheets/current.pdf?date=${workDate}`, "_blank", "noopener")}
          >
            PDF
          </button>
        </div>
      </section>

      <section className="workspace-grid">
        <aside className="panel side-panel">
          <label className="field">
            <span>Date</span>
            <input type="date" value={workDate} onChange={(event) => setWorkDate(event.target.value)} />
          </label>

          <div className="quick-date-list">
            {quickDates.map((date) => (
              <button
                key={date}
                type="button"
                className={`date-chip ${workDate === date ? "is-active" : ""}`}
                onClick={() => setWorkDate(date)}
              >
                {date === todayInDhaka() ? "Today" : formatDateLabel(date)}
              </button>
            ))}
          </div>

          <div className="stat-stack">
            <div className="stat-card-simple">
              <span>Status</span>
              <strong>{sheet?.status ?? "draft"}</strong>
            </div>
            <div className="stat-card-simple">
              <span>Total rows</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="stat-card-simple">
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
            <div className="stat-card-simple">
              <span>Open rows</span>
              <strong>{stats.pending}</strong>
            </div>
          </div>

          <div className="panel soft-panel">
            <strong>Plan-linked options</strong>
            <p>{sheet?.taskOptions.length ?? 0} task option available for this date.</p>
          </div>
        </aside>

        <section className="panel main-panel">
          <div className="section-head">
            <div>
              <h2>{formatDateLabel(workDate)}</h2>
              <p>Write your work row by row. Save each row or finalize the full day later.</p>
            </div>
            <div className="row-actions">
              <button className="ghost-button" type="button" onClick={saveNote} disabled={busy || !sheet}>
                Save note
              </button>
              <button className="primary-button" type="button" onClick={finalizeDay} disabled={busy || !sheet}>
                Finalize day
              </button>
            </div>
          </div>

          <label className="field">
            <span>Day note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write any summary or special note for this day."
            />
          </label>

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="entry-table">
            <div className="entry-row entry-head">
              <span>Time</span>
              <span>Task / Activity</span>
              <span>Output</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {sheet?.rows.map((row) => (
              <div className="entry-row" key={row.id}>
                <div className="time-stack">
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

                <div className="activity-stack">
                  <div className="linked-badge">{row.linkLabel ?? "Direct entry"}</div>
                  <textarea
                    value={row.actualActivity}
                    onChange={(event) => updateLocalRow(row.id, { actualActivity: event.target.value })}
                  />
                </div>

                <textarea
                  value={row.actualOutput}
                  onChange={(event) => updateLocalRow(row.id, { actualOutput: event.target.value })}
                />

                <select
                  value={row.status}
                  onChange={(event) =>
                    updateLocalRow(row.id, { status: event.target.value as DailyActivityRow["status"] })
                  }
                >
                  <option value="not_started">not_started</option>
                  <option value="in_progress">in_progress</option>
                  <option value="completed">completed</option>
                  <option value="deferred">deferred</option>
                  <option value="cancelled">cancelled</option>
                </select>

                <div className="row-actions vertical">
                  <button className="ghost-button" type="button" onClick={() => saveRow(row)} disabled={busy}>
                    Save
                  </button>
                  <button className="ghost-button danger" type="button" onClick={() => removeRow(row.id)} disabled={busy}>
                    Delete
                  </button>
                </div>
              </div>
            ))}

            <div className="entry-row draft-row">
              <div className="time-stack">
                <input
                  type="time"
                  value={rowDraft.startTime}
                  onChange={(event) => setRowDraft((current) => ({ ...current, startTime: event.target.value }))}
                />
                <input
                  type="time"
                  value={rowDraft.endTime}
                  onChange={(event) => setRowDraft((current) => ({ ...current, endTime: event.target.value }))}
                />
              </div>

              <div className="activity-stack">
                <select value={draftSelection} onChange={(event) => setDraftSelection(event.target.value)}>
                  <option value="adhoc">Direct entry</option>
                  {(sheet?.taskOptions ?? []).map((option) => (
                    <option key={`${option.kind}:${option.id}`} value={`${option.kind}:${option.id}`}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {draftSelection === "adhoc" ? (
                  <input
                    value={rowDraft.adHocReason}
                    onChange={(event) => setRowDraft((current) => ({ ...current, adHocReason: event.target.value }))}
                    placeholder="Reason for direct entry"
                  />
                ) : null}

                <textarea
                  value={rowDraft.actualActivity}
                  onChange={(event) => setRowDraft((current) => ({ ...current, actualActivity: event.target.value }))}
                  placeholder="What did you do?"
                />
              </div>

              <textarea
                value={rowDraft.actualOutput}
                onChange={(event) => setRowDraft((current) => ({ ...current, actualOutput: event.target.value }))}
                placeholder="What was the output?"
              />

              <select
                value={rowDraft.status}
                onChange={(event) =>
                  setRowDraft((current) => ({
                    ...current,
                    status: event.target.value as DailyActivityRow["status"],
                  }))
                }
              >
                <option value="not_started">not_started</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="deferred">deferred</option>
                <option value="cancelled">cancelled</option>
              </select>

              <div className="row-actions vertical">
                <button className="primary-button" type="button" onClick={addRow} disabled={busy}>
                  Add row
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
