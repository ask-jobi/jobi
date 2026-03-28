# Change: Remove chat session controls from the resume chat panel

## Why
The current `ChatSessionControls` header adds session-specific UI chrome to the resume chat panel, but the product is already centered on a single implicit canonical session per resume. The header does not provide essential task flow value and introduces extra loading, title-sync, and panel-dismiss behaviors that are no longer desired.

This change removes the `ChatSessionControls` surface and its related product behavior without changing database schema or stored session data.

## What Changes
- Remove `ChatSessionControls` from the resume chat panel
- Remove the visible session title, header loading state, and chat-header close action that returns users to the evaluation panel
- Remove frontend-only title sync and other UI logic that exists only to support the removed header
- Delete tests and i18n copy that are only used by the removed controls
- Keep the existing chat session persistence model intact and make no database changes

## Impact
- Affected specs: `resume-chat`
- Affected code:
  - `components/agent/chat-session-controls.tsx`
  - `components/agent/__tests__/chat-session-controls.test.tsx`
  - `components/resumes/resume-right-panel.tsx`
  - `components/agent/chat-interface.tsx`
  - `lib/hooks/use-chat-session.ts`
  - `lib/i18n/translations/en.json`
  - `lib/i18n/translations/zh.json`
- Related pending work:
  - This proposal supersedes the chat-header UI direction introduced in `add-multi-chat-session-management` without requiring database rollback or data migration
