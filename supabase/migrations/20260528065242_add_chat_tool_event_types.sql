ALTER TYPE chat_event_type ADD VALUE IF NOT EXISTS 'tool_call';
ALTER TYPE chat_event_type ADD VALUE IF NOT EXISTS 'tool_result';
ALTER TYPE chat_event_type ADD VALUE IF NOT EXISTS 'tool_failed';
