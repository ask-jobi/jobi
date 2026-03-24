# Change: Add multi-session management for resume chat

## Why
The resume chat backend already stores multiple sessions per resume, but the current UI always auto-selects the latest session and does not expose session switching or explicit session creation.

This prevents users from starting separate chat threads for different goals. The current fixed chat title/subtitle in the right panel also occupies the space that should be used for session management and no longer matches the intended interaction.

## What Changes
- Add visible multi-session management in the resume chat panel so users can:
  - view chat sessions for the current resume
  - create a new session from the chat panel
  - switch between existing sessions without leaving the resume page
- Replace the current static chat header area with the session management UI in the location shown by product design
- Change chat session naming so the title is generated automatically from the first user message instead of being manually provided at session creation time
- Remove the fixed `chat.aiChat` / `chat.chatAboutResume` display from the right panel and delete the now-unused i18n keys

## Impact
- Affected specs: `resume-chat`
- Affected code:
  - `components/resumes/resume-right-panel.tsx`
  - `components/agent/chat-interface.tsx`
  - `lib/hooks/use-chat-id.ts`
  - `app/api/chat-sessions/route.ts`
  - `app/api/chat-sessions/[id]/route.ts`
  - `lib/agent/chat-history.ts`
  - `lib/i18n/translations/en.json`
  - `lib/i18n/translations/zh.json`
- Likely affected data flow:
  - chat session creation and selection
  - automatic session title generation after first message
