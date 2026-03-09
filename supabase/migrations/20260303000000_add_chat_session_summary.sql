-- Add conversation_summary field to resume_chat_sessions
ALTER TABLE public.resume_chat_sessions 
ADD COLUMN IF NOT EXISTS conversation_summary TEXT;
