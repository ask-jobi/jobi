-- Ensure each user/resume pair has exactly one canonical chat session.
-- Preserve existing duplicate history by moving messages/events onto the row
-- that current application code would have selected first: most recently updated.

with ranked_sessions as (
  select
    id,
    first_value(id) over (
      partition by user_id, resume_id
      order by updated_at desc, created_at desc, id desc
    ) as canonical_id
  from public.resume_chat_sessions
)
update public.resume_chat_messages as message
set session_id = ranked_sessions.canonical_id
from ranked_sessions
where message.session_id = ranked_sessions.id
  and ranked_sessions.id <> ranked_sessions.canonical_id;

with ranked_sessions as (
  select
    id,
    first_value(id) over (
      partition by user_id, resume_id
      order by updated_at desc, created_at desc, id desc
    ) as canonical_id
  from public.resume_chat_sessions
)
update public.chat_events as event
set session_id = ranked_sessions.canonical_id
from ranked_sessions
where event.session_id = ranked_sessions.id
  and ranked_sessions.id <> ranked_sessions.canonical_id;

with ranked_sessions as (
  select
    id,
    first_value(id) over (
      partition by user_id, resume_id
      order by updated_at desc, created_at desc, id desc
    ) as canonical_id
  from public.resume_chat_sessions
)
delete from public.resume_chat_sessions as session
using ranked_sessions
where session.id = ranked_sessions.id
  and ranked_sessions.id <> ranked_sessions.canonical_id;

alter table public.resume_chat_sessions
  disable trigger update_resume_chat_sessions_updated_at;

with message_totals as (
  select
    session_id,
    coalesce(sum(input_tokens), 0)::integer as total_input_tokens,
    coalesce(sum(output_tokens), 0)::integer as total_output_tokens,
    coalesce(sum(cached_tokens), 0)::integer as total_cached_tokens,
    coalesce(sum(reasoning_tokens), 0)::integer as total_reasoning_tokens
  from public.resume_chat_messages
  where truncated = false
  group by session_id
),
recalculated_sessions as (
  select
    session.id,
    coalesce(message_totals.total_input_tokens, 0) as total_input_tokens,
    coalesce(message_totals.total_output_tokens, 0) as total_output_tokens,
    coalesce(message_totals.total_cached_tokens, 0) as total_cached_tokens,
    coalesce(message_totals.total_reasoning_tokens, 0) as total_reasoning_tokens
  from public.resume_chat_sessions as session
  left join message_totals
    on message_totals.session_id = session.id
)
update public.resume_chat_sessions as session
set
  total_input_tokens = recalculated_sessions.total_input_tokens,
  total_output_tokens = recalculated_sessions.total_output_tokens,
  total_cached_tokens = recalculated_sessions.total_cached_tokens,
  total_reasoning_tokens = recalculated_sessions.total_reasoning_tokens
from recalculated_sessions
where session.id = recalculated_sessions.id;

alter table public.resume_chat_sessions
  enable trigger update_resume_chat_sessions_updated_at;

create unique index if not exists idx_resume_chat_sessions_user_resume_unique
  on public.resume_chat_sessions(user_id, resume_id);
