-- Create chat sessions and messages tables for resume optimization agent

-- Create enum for chat session status
create type chat_session_status as enum ('active', 'completed', 'archived');

-- Create resume_chat_sessions table
create table if not exists public.resume_chat_sessions (
                                                           id uuid default gen_random_uuid() primary key,
                                                           user_id uuid references auth.users(id) on delete cascade not null,
                                                           resume_id uuid references public.resumes(id) on delete cascade not null,
                                                           status chat_session_status default 'active' not null,
                                                           title text,
                                                           total_tokens integer default 0 not null,
                                                           total_cost integer default 0 not null,
                                                           created_at timestamptz default now() not null,
                                                           updated_at timestamptz default now() not null
);

-- Create index for user_id lookups
create index if not exists idx_resume_chat_sessions_user_id
    on public.resume_chat_sessions(user_id);

-- Create index for resume_id lookups
create index if not exists idx_resume_chat_sessions_resume_id
    on public.resume_chat_sessions(resume_id);

-- Create index for status filtering
create index if not exists idx_resume_chat_sessions_status
    on public.resume_chat_sessions(status);

-- Create index for recent sessions ordering
create index if not exists idx_resume_chat_sessions_updated_at
    on public.resume_chat_sessions(updated_at desc);

-- Create resume_chat_messages table
create table if not exists public.resume_chat_messages (
                                                            id uuid default gen_random_uuid() primary key,
                                                            session_id uuid references public.resume_chat_sessions(id) on delete cascade not null,
                                                            role text not null check (role in ('user', 'assistant', 'system')),
                                                            parts jsonb not null,
                                                            token_count integer default 0 not null,
                                                            cost integer default 0 not null,
                                                            created_at timestamptz default now() not null,
                                                            truncated boolean default false not null,
                                                            has_tools boolean default false not null
);

-- Create index for session lookups
create index if not exists idx_resume_chat_messages_session_id
    on public.resume_chat_messages(session_id);

-- Create index for ordering messages within a session
create index if not exists idx_resume_chat_messages_created_at
    on public.resume_chat_messages(created_at asc);

-- Create index for role filtering
create index if not exists idx_resume_chat_messages_role
    on public.resume_chat_messages(role);

-- Create index for truncation filtering
create index if not exists idx_resume_chat_messages_truncated
    on public.resume_chat_messages(session_id, created_at asc)
    where truncated = false;

-- Create index for tool filtering
create index if not exists idx_resume_chat_messages_has_tools
    on public.resume_chat_messages(session_id, created_at asc)
    where has_tools = true;

-- Enable row security
alter table public.resume_chat_sessions enable row level security;
alter table public.resume_chat_messages enable row level security;

-- Create policies for resume_chat_sessions
create policy "Users can view their own sessions"
    on public.resume_chat_sessions
    for select
    using ((select auth.uid()) = user_id);

create policy "Users can create sessions"
    on public.resume_chat_sessions
    for insert
    with check ((select auth.uid()) = user_id);

create policy "Users can update their own sessions"
    on public.resume_chat_sessions
    for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "Users can delete their own sessions"
    on public.resume_chat_sessions
    for delete
    using ((select auth.uid()) = user_id);

-- Create policies for resume_chat_messages
create policy "Users can view messages from their own sessions"
    on public.resume_chat_messages
    for select
    using (
        truncated = false
        and exists (
            select 1 from public.resume_chat_sessions
            where id = session_id and user_id = (select auth.uid())
        )
    );

create policy "Users can insert messages to their own sessions"
    on public.resume_chat_messages
    for insert
    with check (
        exists (
            select 1 from public.resume_chat_sessions
            where id = session_id and user_id = (select auth.uid())
        )
    );

create policy "Users can update their own messages"
    on public.resume_chat_messages
    for update
    using (
        exists (
            select 1 from public.resume_chat_sessions
            where id = session_id and user_id = (select auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.resume_chat_sessions
            where id = session_id and user_id = (select auth.uid())
        )
    );

-- Add updated_at trigger function
create or replace function update_updated_at_column()
    returns trigger
    language plpgsql
    set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Apply trigger to resume_chat_sessions
create trigger update_resume_chat_sessions_updated_at
    before update on public.resume_chat_sessions
    for each row
execute function update_updated_at_column();

