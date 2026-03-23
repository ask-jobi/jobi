ALTER TABLE public.resume_chat_messages
DROP COLUMN IF EXISTS token_count;

ALTER TABLE public.resume_chat_sessions
DROP COLUMN IF EXISTS total_tokens;

DROP INDEX IF EXISTS public.idx_resume_chat_messages_token_count;

CREATE INDEX IF NOT EXISTS idx_resume_chat_messages_active_session_created_at
    ON public.resume_chat_messages(session_id, created_at asc)
    WHERE truncated = false;
