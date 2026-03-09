import { useEffect, useMemo, useState } from "react";
import { fetchReviewOverview, fetchReviewWorkspace, submitReviewAction } from "../../shared/api";
import type {
  ReviewAction,
  ReviewEntityType,
  ReviewQueueItem,
  ReviewScope,
  TeamMemberStatus,
  TeamOverviewPayload,
  TeamWorkspacePayload,
} from "../../shared/domain";
import { StatCard } from "../components/StatCard";

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

function titleByScope(scope: ReviewScope) {
  return scope === "admin" ? "Admin workspace" : "Manager workspace";
}

function descriptionByScope(scope: ReviewScope) {
  return scope === "admin"
    ? "Organization-wide visibility, review actions, and exception monitoring."
    : "Direct report review, approval queue handling, and submission compliance.";
}

interface ReviewWorkspacePageProps {
  scope: ReviewScope;
}

export function ReviewWorkspacePage({ scope }: ReviewWorkspacePageProps) {
  const [workDate, setWorkDate] = useState(todayInDhaka());
  const [monthValue, setMonthValue] = useState(monthFromDate(todayInDhaka()));
  const [overview, setOverview] = useState<TeamOverviewPayload | null>(null);
  const [workspace, setWorkspace] = useState<TeamWorkspacePayload | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const monthParts = useMemo(() => parseMonthValue(monthValue), [monthValue]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchReviewOverview(scope, monthParts.month, monthParts.year, workDate)
      .then((result) => {
        setOverview(result.data);
        setSelectedUserId((current) => {
          if (current && result.data.members.some((member) => member.userId === current)) {
            return current;
          }
          return result.data.members[0]?.userId ?? "";
        });
      })
      .catch(() => setError("Unable to load the review overview."))
      .finally(() => setLoading(false));
  }, [scope, monthParts.month, monthParts.year, workDate]);

  useEffect(() => {
    if (!selectedUserId) {
      setWorkspace(null);
      return;
    }

    setDetailLoading(true);
    setError(null);
    fetchReviewWorkspace(scope, selectedUserId, monthParts.month, monthParts.year, workDate)
      .then((result) => setWorkspace(result.data))
      .catch(() => setError("Unable to load the selected team member workspace."))
      .finally(() => setDetailLoading(false));
  }, [scope, selectedUserId, monthParts.month, monthParts.year, workDate]);

  async function handleReview(entityType: ReviewEntityType, entityId: string, targetUserId: string, action: ReviewAction) {
    setActing(true);
    setError(null);
    try {
      await submitReviewAction(scope, {
        entityType,
        entityId,
        targetUserId,
        action,
        comment,
      });

      const [overviewResult, workspaceResult] = await Promise.all([
        fetchReviewOverview(scope, monthParts.month, monthParts.year, workDate),
        fetchReviewWorkspace(scope, targetUserId, monthParts.month, monthParts.year, workDate),
      ]);
      setOverview(overviewResult.data);
      setWorkspace(workspaceResult.data);
      setComment("");
    } catch {
      setError("Unable to apply the selected review action.");
    } finally {
      setActing(false);
    }
  }

  function memberTone(member: TeamMemberStatus) {
    if (member.needsReview || member.overdueCount > 0) return "alert";
    if (member.pendingCount > 0) return "focus";
    return "calm";
  }

  function renderQueueItem(item: ReviewQueueItem) {
    return (
      <li key={`${item.entityType}:${item.entityId}`}>
        <strong>{item.title}</strong>
        <span>{item.meta}</span>
        <p>{item.hint}</p>
      </li>
    );
  }

  if (loading) {
    return <section className="page-card">Loading review workspace...</section>;
  }

  return (
    <div className="page-grid">
      <section className="page-card">
        <div className="page-toolbar">
          <div className="section-heading">
            <h3>{titleByScope(scope)}</h3>
            <p>{descriptionByScope(scope)}</p>
          </div>
          <div className="toolbar-actions">
            <label className="inline-field">
              <span>Month</span>
              <input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />
            </label>
            <label className="inline-field">
              <span>Date</span>
              <input type="date" value={workDate} onChange={(event) => setWorkDate(event.target.value)} />
            </label>
          </div>
        </div>
        {error ? <div className="error-banner">{error}</div> : null}
      </section>

      <section className="card-grid">
        {overview?.summary.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <div className="review-layout">
        <section className="page-card">
          <div className="section-heading">
            <h3>Team members</h3>
            <p>Status is calculated from current work plan, daily sheet, and monthly report.</p>
          </div>
          <div className="review-member-list">
            {(overview?.members ?? []).map((member) => (
              <button
                key={member.userId}
                type="button"
                className={`review-member-card tone-${memberTone(member)}${selectedUserId === member.userId ? " is-selected" : ""}`}
                onClick={() => setSelectedUserId(member.userId)}
              >
                <strong>{member.fullName}</strong>
                <span>{member.designation}</span>
                <small>{member.employeeCode}</small>
                <p>
                  Plan {member.planStatus} | Daily {member.dailyStatus} | Report {member.reportStatus}
                </p>
                <p>
                  Pending {member.pendingCount} | Overdue {member.overdueCount}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="page-card">
          <div className="section-heading">
            <h3>Approval queue</h3>
            <p>Submitted entities appear here first.</p>
          </div>
          <ul className="stack-list">{(overview?.queue ?? []).map(renderQueueItem)}</ul>
        </section>
      </div>

      {detailLoading ? <section className="page-card">Loading member details...</section> : null}

      {workspace ? (
        <>
          <section className="page-card">
            <div className="page-toolbar">
              <div className="section-heading">
                <h3>{workspace.member.fullName}</h3>
                <p>
                  {workspace.member.designation} | {workspace.member.projectName}
                </p>
              </div>
              <div className="toolbar-actions">
                <input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Optional review note"
                />
              </div>
            </div>

            <div className="review-status-grid">
              <article className="review-status-card">
                <span>Work plan</span>
                <strong>{workspace.workPlan.status}</strong>
                <div className="toolbar-actions">
                  <button
                    type="button"
                    className="primary-button"
                    disabled={acting || workspace.workPlan.status !== "submitted"}
                    onClick={() =>
                      handleReview("monthly_work_plan", workspace.workPlan.id, workspace.member.id, "approve")
                    }
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="ghost-button danger"
                    disabled={acting || workspace.workPlan.status === "approved"}
                    onClick={() =>
                      handleReview(
                        "monthly_work_plan",
                        workspace.workPlan.id,
                        workspace.member.id,
                        "revision_requested",
                      )
                    }
                  >
                    Request revision
                  </button>
                </div>
              </article>

              <article className="review-status-card">
                <span>Daily sheet</span>
                <strong>{workspace.dailySheet.status}</strong>
                <div className="toolbar-actions">
                  <button
                    type="button"
                    className="primary-button"
                    disabled={acting || workspace.dailySheet.status !== "submitted"}
                    onClick={() => handleReview("daily_sheet", workspace.dailySheet.id, workspace.member.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="ghost-button danger"
                    disabled={acting || workspace.dailySheet.status === "approved"}
                    onClick={() => handleReview("daily_sheet", workspace.dailySheet.id, workspace.member.id, "return")}
                  >
                    Return
                  </button>
                </div>
              </article>

              <article className="review-status-card">
                <span>Monthly report</span>
                <strong>{workspace.monthlyReport.status}</strong>
                <div className="toolbar-actions">
                  <button
                    type="button"
                    className="primary-button"
                    disabled={acting || workspace.monthlyReport.status !== "submitted"}
                    onClick={() =>
                      handleReview("monthly_report", workspace.monthlyReport.id, workspace.member.id, "approve")
                    }
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="ghost-button danger"
                    disabled={acting || workspace.monthlyReport.status === "approved"}
                    onClick={() =>
                      handleReview("monthly_report", workspace.monthlyReport.id, workspace.member.id, "revision_requested")
                    }
                  >
                    Request revision
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section className="page-card">
            <div className="section-heading">
              <h3>Open pending items</h3>
              <p>Manager can see carry-forward and overdue items before approving the report.</p>
            </div>
            <ul className="stack-list">
              {workspace.pendingItems.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  <span>
                    {item.status} | {item.workDate}
                  </span>
                  <p>{item.expectedOutput || item.meta}</p>
                </li>
              ))}
              {workspace.pendingItems.length === 0 ? <li>No pending items.</li> : null}
            </ul>
          </section>

          <div className="review-layout">
            <section className="page-card">
              <div className="section-heading">
                <h3>Current work plan rows</h3>
                <p>First 8 rows from the selected month.</p>
              </div>
              <ul className="stack-list">
                {workspace.workPlan.rows.slice(0, 8).map((row) => (
                  <li key={row.id}>
                    <strong>{row.activity}</strong>
                    <span>
                      {row.workDate} | {row.rowStatus}
                    </span>
                    <p>{row.expectedOutput}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="page-card">
              <div className="section-heading">
                <h3>Daily execution rows</h3>
                <p>Latest saved rows for the selected day.</p>
              </div>
              <ul className="stack-list">
                {workspace.dailySheet.rows.map((row) => (
                  <li key={row.id}>
                    <strong>{row.linkLabel ?? row.actualActivity}</strong>
                    <span>
                      {row.startTime} - {row.endTime} | {row.status}
                    </span>
                    <p>{row.actualOutput}</p>
                  </li>
                ))}
                {workspace.dailySheet.rows.length === 0 ? <li>No rows submitted for the selected day.</li> : null}
              </ul>
            </section>
          </div>

          <section className="page-card">
            <div className="section-heading">
              <h3>Report snapshot</h3>
              <p>Monthly report counts and latest approval actions.</p>
            </div>
            <div className="review-report-grid">
              <article className="stat-card tone-success">
                <span>Completed</span>
                <strong>{workspace.monthlyReport.summary.completedCount}</strong>
              </article>
              <article className="stat-card tone-focus">
                <span>Ongoing</span>
                <strong>{workspace.monthlyReport.summary.ongoingCount}</strong>
              </article>
              <article className="stat-card tone-calm">
                <span>Next Month</span>
                <strong>{workspace.monthlyReport.summary.nextMonthCount}</strong>
              </article>
              <article className="stat-card tone-alert">
                <span>Submitted Days</span>
                <strong>{workspace.monthlyReport.summary.submittedDayCount}</strong>
              </article>
            </div>
            <ul className="stack-list">
              {workspace.approvalHistory.map((entry) => (
                <li key={entry.id}>
                  <strong>
                    {entry.entityType} | {entry.action}
                  </strong>
                  <span>
                    {entry.actorName} | {entry.actedAt}
                  </span>
                  <p>{entry.comment || "No comment"}</p>
                </li>
              ))}
              {workspace.approvalHistory.length === 0 ? <li>No review history yet.</li> : null}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
