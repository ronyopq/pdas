import type { DashboardPayload } from "../../shared/domain";
import { StatCard } from "../components/StatCard";

interface DashboardPageProps {
  dashboard: DashboardPayload | null;
}

export function DashboardPage({ dashboard }: DashboardPageProps) {
  if (!dashboard) {
    return <section className="page-card">Loading dashboard blueprint...</section>;
  }

  return (
    <div className="page-grid">
      <section className="card-grid">
        {dashboard.summary.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="page-card">
        <div className="section-heading">
          <h3>Today's execution queue</h3>
          <p>Approved plan rows, carry-forward tasks and travel outputs surface here.</p>
        </div>
        <ul className="stack-list">
          {dashboard.todayPlan.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
              <p>{item.hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-card">
        <div className="section-heading">
          <h3>Pending and overdue</h3>
          <p>Carry-forward actions and overdue risk become visible here first.</p>
        </div>
        <ul className="stack-list">
          {dashboard.pending.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
              <p>{item.hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="page-card">
        <div className="section-heading">
          <h3>Approval and snapshot rules</h3>
          <p>The worker already exposes placeholder endpoints for the review flow.</p>
        </div>
        <ul className="stack-list">
          {dashboard.approvals.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
              <p>{item.hint}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

