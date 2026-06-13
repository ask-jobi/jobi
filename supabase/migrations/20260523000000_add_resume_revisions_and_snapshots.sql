ALTER TABLE public.resumes
ADD COLUMN IF NOT EXISTS current_revision integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.resumes_snapshot (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    resume_id uuid REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    revision integer NOT NULL,
    resume_json jsonb NOT NULL,
    event_id uuid REFERENCES public.chat_events(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS resumes_snapshot_resume_id_revision_key
    ON public.resumes_snapshot(resume_id, revision);

CREATE INDEX IF NOT EXISTS resumes_snapshot_event_id_idx
    ON public.resumes_snapshot(event_id);

INSERT INTO public.resumes_snapshot (
    resume_id,
    revision,
    resume_json,
    event_id,
    created_at
)
SELECT
    resumes.id,
    resumes.current_revision,
    resumes.resume_json,
    NULL,
    resumes.created_at
FROM public.resumes
WHERE resumes.resume_json IS NOT NULL
ON CONFLICT (resume_id, revision) DO NOTHING;

ALTER TABLE public.resumes_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume snapshots"
    ON public.resumes_snapshot
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.resumes
            WHERE resumes.id = resumes_snapshot.resume_id
              AND resumes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert resume snapshots for their own resumes"
    ON public.resumes_snapshot
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.resumes
            WHERE resumes.id = resumes_snapshot.resume_id
              AND resumes.user_id = auth.uid()
        )
    );
