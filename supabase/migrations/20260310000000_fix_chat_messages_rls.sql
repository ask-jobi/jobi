-- Fix RLS policies for resume_chat_messages
-- 1. Ensure UPDATE policy exists
-- 2. Remove truncated filter from SELECT policy (filtering should be done in application code)

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view messages from their own sessions" ON public.resume_chat_messages;

-- Create new SELECT policy without truncated filter
CREATE POLICY "Users can view messages from their own sessions"
    ON public.resume_chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.resume_chat_sessions
            WHERE id = session_id AND user_id = (select auth.uid())
        )
    );

-- Drop existing UPDATE policy if exists
DROP POLICY IF EXISTS "Users can update their own messages" ON public.resume_chat_messages;

-- Create UPDATE policy
CREATE POLICY "Users can update their own messages"
    ON public.resume_chat_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.resume_chat_sessions
            WHERE id = session_id AND user_id = (select auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.resume_chat_sessions
            WHERE id = session_id AND user_id = (select auth.uid())
        )
    );
