interface SimplePageProps {
  title: string;
  description: string;
  bullets: string[];
}

export function SimplePage({ title, description, bullets }: SimplePageProps) {
  return (
    <section className="page-card">
      <div className="section-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <ul className="stack-list">
        {bullets.map((bullet) => (
          <li key={bullet}>
            <strong>{bullet}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

