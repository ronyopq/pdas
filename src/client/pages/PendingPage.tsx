import { useEffect, useState } from "react";
import { applyPendingAction, fetchPendingItems } from "../../shared/api";
import type { PendingItem } from "../../shared/domain";

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

export function PendingPage() {
  const [workDate, setWorkDate] = useState(todayInDhaka());
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function loadItems(date: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPendingItems(date);
      setItems(result.data);
    } catch {
      setError("Unable to load pending items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems(workDate);
  }, [workDate]);

  async function handleAction(itemId: string, action: "continue_next_day" | "move_next_month" | "cancel") {
    setSaving(true);
    setError(null);
    try {
      await applyPendingAction(itemId, {
        action,
        note: notes[itemId] ?? "",
      });
      await loadItems(workDate);
    } catch {
      setError("Unable to apply the selected pending action.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className="page-card">Loading pending items...</section>;
  }

  return (
    <div className="page-grid">
      <section className="page-card">
        <div className="page-toolbar">
          <div className="section-heading">
            <h3>Pending board</h3>
            <p>Open items from the work plan and travel plan are managed here.</p>
          </div>
          <label className="inline-field">
            <span>Date</span>
            <input type="date" value={workDate} onChange={(event) => setWorkDate(event.target.value)} />
          </label>
        </div>
        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      <section className="page-card">
        <div className="section-heading">
          <h3>Open items</h3>
          <p>Continue, move, or cancel items. Notes are stored on plan rows where available.</p>
        </div>
        <div className="pending-grid">
          {items.length === 0 ? (
            <article className="pending-card empty-state">
              <strong>No pending items</strong>
              <p>All linked work items are clear for the selected date.</p>
            </article>
          ) : null}
          {items.map((item) => (
            <article key={item.id} className={`pending-card status-${item.status}`}>
              <strong>{item.title}</strong>
              <span>
                {item.kind} | {item.workDate}
              </span>
              <p>{item.expectedOutput || item.meta}</p>
              <textarea
                value={notes[item.id] ?? item.remarks}
                placeholder="Note for carry-forward or cancellation"
                onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
              />
              <div className="toolbar-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleAction(item.id, "continue_next_day")}
                  disabled={saving}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleAction(item.id, "move_next_month")}
                  disabled={saving}
                >
                  Move next month
                </button>
                <button
                  type="button"
                  className="ghost-button danger"
                  onClick={() => handleAction(item.id, "cancel")}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
