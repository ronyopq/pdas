import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { NavigationItem } from "../../shared/domain";

interface AppShellProps {
  navItems: NavigationItem[];
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AppShell({ navItems, title, subtitle, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <span className="brand-mark">PRAAN</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Work plan to daily activity to report to KPI</p>
            <h2>Operational scaffold</h2>
          </div>
          <div className="topbar-pills">
            <span>Mobile ready</span>
            <span>Cloudflare Worker</span>
            <span>D1 + R2 ready</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
