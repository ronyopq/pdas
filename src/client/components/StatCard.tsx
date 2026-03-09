import type { SummaryCard } from "../../shared/domain";

export function StatCard({ label, value, tone }: SummaryCard) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

