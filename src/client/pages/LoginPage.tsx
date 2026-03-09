import type { FormEvent } from "react";
import { useState } from "react";
import { ApiError } from "../../shared/api";
import type { LoginInput } from "../../shared/domain";

interface LoginPageProps {
  onLogin: (input: LoginInput) => Promise<void>;
}

const demoAccounts = [
  { code: "rony001", role: "Employee" },
  { code: "manager001", role: "Manager" },
  { code: "admin001", role: "Admin" },
];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [employeeCode, setEmployeeCode] = useState("rony001");
  const [password, setPassword] = useState("demo123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onLogin({ employeeCode, password });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Unable to sign in right now.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card">
        <span className="brand-mark">PRAAN</span>
        <h1>Work Plan and Reporting Workspace</h1>
        <p>
          Start with the monthly work plan, then continue into daily execution, reporting and KPI
          review.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Employee Code</span>
            <input value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <div className="error-banner">{error}</div> : null}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="demo-panel">
          <strong>Demo accounts</strong>
          <ul className="stack-list">
            {demoAccounts.map((account) => (
              <li key={account.code}>
                <strong>{account.code}</strong>
                <span>{account.role}</span>
                <p>Password: demo123</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
