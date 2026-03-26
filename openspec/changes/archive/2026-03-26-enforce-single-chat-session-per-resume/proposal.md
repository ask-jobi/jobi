# Change: Enforce a single chat session per resume

## Why
The current product direction no longer wants users to manage multiple chat sessions for one resume.

Keeping multi-session flows would add session switching, session creation, and session-scoped calculations that are no longer needed. The chat experience should return to a single conversation per resume, with all history, truncation, and token calculations anchored to that one canonical session.

## What Changes
- Restrict the resume chat product experience to one canonical chat session per resume
- Remove multi-session user flows, including session list display, session switching, and manual creation of additional sessions from the chat UI
- Define token usage, history loading, truncation, and session title behavior against the single canonical session only
- Supersede the pending `add-multi-chat-session-management` direction before implementation or archive

## Impact
- Affected specs: `resume-chat`
- Affected code:
  - `components/resumes/resume-right-panel.tsx`
  - `components/agent/chat-interface.tsx`
  - `lib/hooks/use-chat-id.ts`
  - `lib/store/chat.ts`
  - `app/api/chat-sessions/route.ts`
  - `app/api/chat-sessions/[id]/route.ts`
  - `app/api/chat-sessions/[id]/messages/route.ts`
  - `app/api/chat/resume/route.ts`
  - `lib/agent/chat-history.ts`
- Affected behavior:
  - chat initialization
  - session lookup and creation
  - token statistics
  - truncation and history loading
