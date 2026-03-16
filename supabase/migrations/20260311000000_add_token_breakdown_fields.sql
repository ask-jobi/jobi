-- Add token breakdown fields to chat messages table
ALTER TABLE public.resume_chat_messages 
ADD COLUMN IF NOT EXISTS input_tokens integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS output_tokens integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS cached_tokens integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS reasoning_tokens integer DEFAULT 0 NOT NULL;

-- Drop cost column from messages
ALTER TABLE public.resume_chat_messages DROP COLUMN IF EXISTS cost;

-- Add token breakdown fields to chat sessions table
ALTER TABLE public.resume_chat_sessions 
ADD COLUMN IF NOT EXISTS total_input_tokens integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_output_tokens integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_cached_tokens integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_reasoning_tokens integer DEFAULT 0 NOT NULL;

-- Drop total_cost column from sessions
ALTER TABLE public.resume_chat_sessions DROP COLUMN IF EXISTS total_cost;

-- Create index for efficient token aggregation queries
CREATE INDEX IF NOT EXISTS idx_resume_chat_messages_token_count
    ON public.resume_chat_messages(session_id, created_at asc)
    WHERE truncated = false;
