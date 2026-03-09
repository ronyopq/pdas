-- PRAAN Daily Activity App
-- Cloudflare D1 / SQLite-compatible schema
-- Source: daily-activity-app-srs-v3-final-bn.md

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organization_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  organization_name TEXT NOT NULL,
  short_name TEXT,
  logo_file_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
  default_locale TEXT NOT NULL DEFAULT 'bn-BD',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_templates (
  id TEXT PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  output_type TEXT NOT NULL CHECK (output_type IN ('xlsx', 'docx', 'pdf', 'print')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  header_config_json TEXT NOT NULL DEFAULT '{}',
  footer_config_json TEXT NOT NULL DEFAULT '{}',
  body_config_json TEXT NOT NULL DEFAULT '{}',
  created_by_user_id TEXT,
  updated_by_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  display_name_bn TEXT,
  email TEXT UNIQUE,
  mobile TEXT,
  designation TEXT NOT NULL,
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  manager_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  password_hash TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_work_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2025),
  prepared_date TEXT,
  submit_deadline TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'submitted', 'under_review', 'approved', 'revision_requested', 'rejected', 'locked')
  ),
  version_no INTEGER NOT NULL DEFAULT 1 CHECK (version_no >= 1),
  submitted_at TEXT,
  approved_at TEXT,
  approved_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  revision_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, year, month, version_no)
);

CREATE TABLE IF NOT EXISTS monthly_work_plan_rows (
  id TEXT PRIMARY KEY,
  work_plan_id TEXT NOT NULL REFERENCES monthly_work_plans(id) ON DELETE CASCADE,
  serial_no INTEGER NOT NULL,
  work_date TEXT NOT NULL,
  row_type TEXT NOT NULL DEFAULT 'regular_work' CHECK (
    row_type IN ('regular_work', 'meeting', 'field_visit', 'travel', 'holiday', 'weekend', 'leave', 'reserved')
  ),
  planned_activity TEXT,
  expected_output TEXT,
  row_status TEXT NOT NULL DEFAULT 'planned' CHECK (
    row_status IN ('planned', 'in_progress', 'completed', 'pending', 'overdue', 'cancelled', 'moved_next_month', 'holiday', 'weekend', 'leave')
  ),
  is_required INTEGER NOT NULL DEFAULT 1 CHECK (is_required IN (0, 1)),
  remarks TEXT,
  project_tag TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (work_plan_id, serial_no)
);

CREATE TABLE IF NOT EXISTS monthly_travel_plan_rows (
  id TEXT PRIMARY KEY,
  work_plan_id TEXT NOT NULL REFERENCES monthly_work_plans(id) ON DELETE CASCADE,
  serial_no INTEGER NOT NULL,
  travel_date TEXT NOT NULL,
  destination TEXT NOT NULL,
  purpose TEXT,
  expected_output TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (
    status IN ('planned', 'in_progress', 'completed', 'pending', 'overdue', 'cancelled')
  ),
  linked_plan_row_id TEXT REFERENCES monthly_work_plan_rows(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (work_plan_id, serial_no)
);

CREATE TABLE IF NOT EXISTS daily_sheets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'submitted', 'approved', 'returned', 'locked')
  ),
  note TEXT,
  submitted_at TEXT,
  approved_at TEXT,
  approved_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, work_date)
);

CREATE TABLE IF NOT EXISTS daily_activity_rows (
  id TEXT PRIMARY KEY,
  daily_sheet_id TEXT NOT NULL REFERENCES daily_sheets(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  linked_plan_row_id TEXT REFERENCES monthly_work_plan_rows(id) ON DELETE SET NULL,
  linked_travel_row_id TEXT REFERENCES monthly_travel_plan_rows(id) ON DELETE SET NULL,
  start_time TEXT,
  end_time TEXT,
  actual_activity TEXT NOT NULL,
  actual_output TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (
    status IN ('not_started', 'in_progress', 'completed', 'deferred', 'cancelled')
  ),
  delivery_required INTEGER NOT NULL DEFAULT 0 CHECK (delivery_required IN (0, 1)),
  delivery_done INTEGER NOT NULL DEFAULT 0 CHECK (delivery_done IN (0, 1)),
  is_ad_hoc INTEGER NOT NULL DEFAULT 0 CHECK (is_ad_hoc IN (0, 1)),
  ad_hoc_reason TEXT,
  carry_forward_action TEXT NOT NULL DEFAULT 'none' CHECK (
    carry_forward_action IN ('none', 'continue_next_day', 'reschedule_current_month', 'move_next_month', 'cancel')
  ),
  row_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (daily_sheet_id, line_no)
);

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date TEXT NOT NULL,
  week_end_date TEXT NOT NULL,
  achievements TEXT,
  unresolved_items TEXT,
  support_required TEXT,
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, week_start_date, week_end_date)
);

CREATE TABLE IF NOT EXISTS monthly_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2025),
  version_no INTEGER NOT NULL DEFAULT 1 CHECK (version_no >= 1),
  report_status TEXT NOT NULL DEFAULT 'draft' CHECK (
    report_status IN ('draft', 'submitted', 'approved', 'revision_requested', 'locked')
  ),
  project_name_snapshot TEXT,
  designation_snapshot TEXT,
  submission_date TEXT,
  completed_tasks_snapshot_json TEXT NOT NULL DEFAULT '[]',
  ongoing_tasks_snapshot_json TEXT NOT NULL DEFAULT '[]',
  next_month_tasks_snapshot_json TEXT NOT NULL DEFAULT '[]',
  lessons_learned TEXT,
  comments TEXT,
  submitted_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  approved_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, year, month, version_no)
);

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  owner_scope TEXT NOT NULL DEFAULT 'global' CHECK (
    owner_scope IN ('global', 'department', 'project', 'employee')
  ),
  cycle_type TEXT NOT NULL CHECK (cycle_type IN ('monthly', 'quarterly', 'yearly')),
  measurement_unit TEXT,
  target_direction TEXT NOT NULL DEFAULT 'higher_is_better' CHECK (
    target_direction IN ('higher_is_better', 'lower_is_better', 'boolean', 'manual')
  ),
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'derived', 'hybrid')),
  weight_default REAL NOT NULL DEFAULT 0,
  formula_config_json TEXT NOT NULL DEFAULT '{}',
  applies_to_role TEXT,
  applies_to_department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  applies_to_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_type TEXT NOT NULL CHECK (cycle_type IN ('monthly', 'quarterly', 'yearly')),
  cycle_key TEXT NOT NULL,
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL CHECK (year >= 2025),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'submitted', 'under_review', 'finalized', 'locked')
  ),
  submitted_at TEXT,
  approved_at TEXT,
  approved_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, cycle_type, cycle_key)
);

CREATE TABLE IF NOT EXISTS kpi_items (
  id TEXT PRIMARY KEY,
  kpi_plan_id TEXT NOT NULL REFERENCES kpi_plans(id) ON DELETE CASCADE,
  kpi_definition_id TEXT REFERENCES kpi_definitions(id) ON DELETE SET NULL,
  line_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  measurement_unit TEXT,
  target_value REAL,
  achieved_value REAL,
  weight REAL NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'derived', 'hybrid')),
  formula_config_json TEXT NOT NULL DEFAULT '{}',
  auto_score REAL,
  manual_score REAL,
  final_score REAL,
  employee_comment TEXT,
  manager_comment TEXT,
  final_status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    final_status IN ('not_started', 'in_progress', 'achieved', 'partially_achieved', 'not_achieved', 'waived')
  ),
  evidence_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (kpi_plan_id, line_no)
);

CREATE TABLE IF NOT EXISTS approval_actions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('monthly_work_plan', 'daily_sheet', 'monthly_report', 'kpi_plan')
  ),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (
    action IN ('submit', 'approve', 'reject', 'revision_requested', 'lock', 'unlock', 'return')
  ),
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  row_reference_id TEXT,
  comment TEXT,
  acted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('daily_activity_row', 'monthly_work_plan_row', 'monthly_travel_plan_row', 'monthly_report', 'kpi_item')
  ),
  entity_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_project ON users(project_id);
CREATE INDEX IF NOT EXISTS idx_work_plans_user_period ON monthly_work_plans(user_id, year, month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_work_plan_per_month
  ON monthly_work_plans(user_id, year, month)
  WHERE status IN ('approved', 'locked');
CREATE INDEX IF NOT EXISTS idx_plan_rows_work_date ON monthly_work_plan_rows(work_date);
CREATE INDEX IF NOT EXISTS idx_plan_rows_status ON monthly_work_plan_rows(row_status, work_date);
CREATE INDEX IF NOT EXISTS idx_travel_rows_date ON monthly_travel_plan_rows(travel_date, status);
CREATE INDEX IF NOT EXISTS idx_daily_sheets_user_date ON daily_sheets(user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_plan_row ON daily_activity_rows(linked_plan_row_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_travel_row ON daily_activity_rows(linked_travel_row_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_user_period ON monthly_reports(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_kpi_plans_user_cycle ON kpi_plans(user_id, cycle_type, cycle_key);
CREATE INDEX IF NOT EXISTS idx_kpi_items_plan ON kpi_items(kpi_plan_id, final_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, sent_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at);

CREATE VIEW IF NOT EXISTS v_pending_plan_rows AS
SELECT
  pr.id AS plan_row_id,
  p.user_id,
  u.full_name,
  p.year,
  p.month,
  pr.work_date,
  pr.row_type,
  pr.planned_activity,
  pr.expected_output,
  pr.row_status
FROM monthly_work_plan_rows pr
JOIN monthly_work_plans p ON p.id = pr.work_plan_id
JOIN users u ON u.id = p.user_id
WHERE p.status IN ('approved', 'locked')
  AND pr.row_status IN ('planned', 'in_progress', 'pending', 'overdue');

CREATE VIEW IF NOT EXISTS v_plan_vs_actual_summary AS
SELECT
  p.id AS work_plan_id,
  p.user_id,
  p.year,
  p.month,
  COUNT(DISTINCT pr.id) AS planned_row_count,
  COUNT(DISTINCT CASE WHEN pr.row_status = 'completed' THEN pr.id END) AS completed_row_count,
  COUNT(DISTINCT CASE WHEN pr.row_status IN ('pending', 'overdue') THEN pr.id END) AS open_row_count,
  COUNT(DISTINCT CASE WHEN da.is_ad_hoc = 1 THEN da.id END) AS ad_hoc_activity_count
FROM monthly_work_plans p
LEFT JOIN monthly_work_plan_rows pr ON pr.work_plan_id = p.id
LEFT JOIN daily_activity_rows da ON da.linked_plan_row_id = pr.id
GROUP BY p.id, p.user_id, p.year, p.month;

INSERT OR IGNORE INTO organization_settings (id, organization_name, short_name)
VALUES (1, 'Participatory Research and Action Network', 'PRAAN');
