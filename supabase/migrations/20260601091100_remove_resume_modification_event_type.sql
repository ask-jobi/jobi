-- Remove deprecated resume_modification event type.
-- tool_result events now capture the same information with richer metadata
-- (toolCallId, baseVersion, nextVersion, snapshotId).

-- Delete any existing resume_modification rows first.
DELETE FROM chat_events WHERE event_type = 'resume_modification';

-- Create new enum without the deprecated value.
CREATE TYPE chat_event_type_new AS ENUM (
  'summary_checkpoint',
  'rollback',
  'tool_call',
  'tool_result',
  'tool_failed'
);

-- Switch the column to the new type.
ALTER TABLE chat_events
  ALTER COLUMN event_type TYPE chat_event_type_new
  USING event_type::text::chat_event_type_new;

-- Drop the old type.
DROP TYPE chat_event_type;

-- Rename the new type to the original name.
ALTER TYPE chat_event_type_new RENAME TO chat_event_type;
