PRAGMA foreign_keys = ON;

CREATE TABLE jobs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name TEXT,
  company TEXT,
  description TEXT NOT NULL
) STRICT;

CREATE INDEX jobs_user_id_idx ON jobs(user_id);

CREATE TABLE resumes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resume_json TEXT CHECK (resume_json IS NULL OR json_valid(resume_json)),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'zh')),
  evaluation_report TEXT CHECK (evaluation_report IS NULL OR json_valid(evaluation_report)),
  evaluation_report_refresh_flag INTEGER NOT NULL DEFAULT 0 CHECK (evaluation_report_refresh_flag IN (0, 1)),
  current_revision INTEGER NOT NULL DEFAULT 1 CHECK (current_revision >= 1)
) STRICT;

CREATE INDEX resumes_user_id_idx ON resumes(user_id);
CREATE INDEX resumes_job_id_idx ON resumes(job_id);

CREATE TABLE job_applications (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX job_applications_user_created_idx ON job_applications(user_id, created_at);
CREATE UNIQUE INDEX job_applications_resume_unique ON job_applications(resume_id);
CREATE UNIQUE INDEX job_applications_job_unique ON job_applications(job_id);

CREATE TABLE resume_chat_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  title TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  conversation_summary TEXT
) STRICT;

CREATE UNIQUE INDEX resume_chat_sessions_resume_unique ON resume_chat_sessions(resume_id);
CREATE INDEX resume_chat_sessions_user_updated_idx ON resume_chat_sessions(user_id, updated_at);

CREATE TABLE resume_chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES resume_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  parts TEXT NOT NULL CHECK (json_valid(parts)),
  truncated INTEGER NOT NULL DEFAULT 0 CHECK (truncated IN (0, 1)),
  has_tools INTEGER NOT NULL DEFAULT 0 CHECK (has_tools IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX resume_chat_messages_session_created_idx ON resume_chat_messages(session_id, created_at);
CREATE INDEX resume_chat_messages_active_idx ON resume_chat_messages(session_id, created_at) WHERE truncated = 0;

CREATE TABLE chat_events (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES resume_chat_sessions(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES resume_chat_messages(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('summary_checkpoint', 'rollback', 'tool_call', 'tool_result', 'tool_failed')),
  event_data TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(event_data)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX chat_events_session_created_idx ON chat_events(session_id, created_at);
CREATE INDEX chat_events_message_idx ON chat_events(message_id);

CREATE TABLE resumes_snapshot (
  id TEXT PRIMARY KEY NOT NULL,
  resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  resume_json TEXT NOT NULL CHECK (json_valid(resume_json)),
  event_id TEXT REFERENCES chat_events(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE UNIQUE INDEX resumes_snapshot_resume_revision_unique ON resumes_snapshot(resume_id, revision);
CREATE INDEX resumes_snapshot_event_idx ON resumes_snapshot(event_id);
