# Change: Add chat_events table

## Why
Currently, the resume chat system lacks structured tracking of:
- Tool execution events that modify the resume
- Checkpoints when conversation summaries are generated
- Rollback events when users revert changes

This makes it difficult to:
- Audit resume modifications over time
- Debug issues related to conversation flow
- Implement features like "undo" or "history"

## What Changes
- Create new `chat_events` table to record:
  - **Resume modifications**: Every tool call that modifies the resume (rewrite, delete, add, reorder) - logged from frontend onToolCall
  - **Summary checkpoints**: When AI generates conversation summary
  - **Rollback events**: When users truncate/rollback conversation
- Data is append-only (no updates or deletes after insert)
- Add event_type enum: `resume_modification`, `summary_checkpoint`, `rollback`

## Impact
- Affected specs: `resume-chat` capability
- New database table: `chat_events`
- Changes to:
  - `lib/agent/chat-history.ts` - Add event logging functions
  - `server/chat-events.ts` - New Server Action to log events (use "use server")
  - Frontend `components/agent/chat-interface.tsx` - Import and call Server Action to log resume modifications after tool execution
  - `app/api/chat/resume/route.ts` - Log summary checkpoints via chat-history functions
  - `app/api/chat/truncate/route.ts` - Log rollback events via chat-history functions
