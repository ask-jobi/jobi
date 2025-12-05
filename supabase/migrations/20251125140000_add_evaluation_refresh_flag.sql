-- Add evaluation_report refresh flag to resumes table
alter table public.resumes
  add column if not exists evaluation_report_refresh_flag boolean default false;
