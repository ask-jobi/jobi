-- Add evaluation_report column to resumes table
alter table public.resumes 
  add column if not exists evaluation_report jsonb;

-- Add index for evaluation_report queries (optional, for performance)
create index if not exists idx_resumes_evaluation_report 
  on public.resumes(evaluation_report) 
  where evaluation_report is not null;


