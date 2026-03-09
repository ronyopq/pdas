INSERT INTO users (
  id,
  employee_code,
  full_name,
  designation,
  role,
  status,
  created_at,
  updated_at
) VALUES
  ('user-rony', 'rony001', 'Nure Alam Siddiqi', 'Media & Communication Officer', 'employee', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manager-us', 'manager001', 'Umme Salma', 'Programme Coordinator', 'manager', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('admin-root', 'admin001', 'PRAAN Admin', 'System Administrator', 'admin', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('user-sadia', 'sadia001', 'Sadia Rahman', 'Programme Associate', 'employee', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET
  employee_code = excluded.employee_code,
  full_name = excluded.full_name,
  designation = excluded.designation,
  role = excluded.role,
  status = excluded.status,
  updated_at = CURRENT_TIMESTAMP;
