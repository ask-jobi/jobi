-- Add chat_events table for tracking resume modifications, summary checkpoints, and rollback events
-- This table is append-only (no updates or deletes)

-- Create enum for event types
CREATE TYPE chat_event_type AS ENUM ('resume_modification', 'summary_checkpoint', 'rollback');

-- Create chat_events table
CREATE TABLE IF NOT EXISTS public.chat_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid REFERENCES public.resume_chat_sessions(id) ON DELETE CASCADE NOT NULL,
    message_id uuid,
    event_type chat_event_type NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_chat_events_session_id
    ON public.chat_events(session_id);

-- Create index for event_type filtering
CREATE INDEX IF NOT EXISTS idx_chat_events_event_type
    ON public.chat_events(event_type);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_chat_events_created_at
    ON public.chat_events(created_at ASC);

-- Create composite index for session + event_type queries
CREATE INDEX IF NOT EXISTS idx_chat_events_session_type
    ON public.chat_events(session_id, event_type);

-- Enable row level security
ALTER TABLE public.chat_events ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_events
-- Users can view events from their own sessions
CREATE POLICY "Users can view events from their own sessions"
    ON public.chat_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.resume_chat_sessions
            WHERE id = session_id AND user_id = (select auth.uid())
        )
    );

-- Users can insert events to their own sessions
CREATE POLICY "Users can insert events to their own sessions"
    ON public.chat_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.resume_chat_sessions
            WHERE id = session_id AND user_id = (select auth.uid())
        )
    );

-- No update or delete policies needed - append-only

-- Add DELETE policy for resume_chat_messages (needed for truncation)
CREATE POLICY "Users can delete messages from their own sessions"
    ON public.resume_chat_messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.resume_chat_sessions
            WHERE id = session_id AND user_id = (select auth.uid())
        )
    );
