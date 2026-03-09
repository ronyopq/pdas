PRAGMA foreign_keys = ON;

ALTER TABLE daily_activity_rows ADD COLUMN follow_up_person TEXT;
ALTER TABLE daily_activity_rows ADD COLUMN follow_up_date TEXT;
ALTER TABLE daily_activity_rows ADD COLUMN follow_up_note TEXT;
ALTER TABLE daily_activity_rows ADD COLUMN follow_up_generated_row_id TEXT;
ALTER TABLE daily_activity_rows ADD COLUMN follow_up_source_row_id TEXT;
ALTER TABLE daily_activity_rows ADD COLUMN is_follow_up_generated INTEGER NOT NULL DEFAULT 0 CHECK (is_follow_up_generated IN (0, 1));

CREATE TABLE IF NOT EXISTS daily_row_attachments (
  id TEXT PRIMARY KEY,
  daily_activity_row_id TEXT NOT NULL REFERENCES daily_activity_rows(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_blob BLOB NOT NULL,
  uploaded_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_activity_follow_up_date ON daily_activity_rows(follow_up_date, is_follow_up_generated);
CREATE INDEX IF NOT EXISTS idx_daily_activity_follow_up_generated ON daily_activity_rows(follow_up_generated_row_id);
CREATE INDEX IF NOT EXISTS idx_daily_row_attachments_row ON daily_row_attachments(daily_activity_row_id, uploaded_at);
