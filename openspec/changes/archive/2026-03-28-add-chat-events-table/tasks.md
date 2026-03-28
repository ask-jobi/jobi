## 1. Implementation

- [x] 1.1 Create database migration: `supabase/migrations/TIMESTAMP_add_chat_events.sql`
  - Create `chat_events` table with fields: id, session_id, message_id, event_type, event_data (JSONB), created_at
  - Create enum for event_type: resume_modification, summary_checkpoint, rollback
  - Add indexes: session_id, event_type, created_at
  - Add RLS policies (select only, no update/delete)

- [x] 1.2 Add types to `types/supabase.ts` (manual)
  - Add chat_events table type definition manually (do not use supabase gen types)

- [x] 1.3 Add event logging functions to `lib/agent/chat-history.ts`
  - `logResumeModificationEvent()` - Log resume modification
  - `logSummaryCheckpointEvent()` - Log summary checkpoint
  - `logRollbackEvent()` - Log rollback event
  - `getChatEvents()` - Query events for session

- [x] 1.4 Create `server/chat-events.ts` Server Action
  - Use "use server" directive
  - Expose functions to log resume modification, summary checkpoint, rollback events
  - Called from frontend and API routes

- [x] 1.5 Update frontend `components/agent/chat-interface.tsx`
  - Import Server Action from `server/chat-events.ts`
  - Call action to log resume modification after tool execution in onToolCall

- [x] 1.6 Update `app/api/chat/resume/route.ts`
  - Import event logging functions from chat-history
  - Log summary checkpoint when summary is generated

- [x] 1.7 Update `app/api/chat/truncate/route.ts`
  - Import rollback event logging function
  - Log rollback event when truncation occurs

## 2. Testing

- [ ] 2.1 Write unit tests for event logging functions
- [ ] 2.2 Write integration test for events API
- [ ] 2.3 Test event logging in chat flow

## 3. Validation

- [x] 3.1 Run lint
- [ ] 3.2 Run typecheck
- [ ] 3.3 Verify database migration works locally
