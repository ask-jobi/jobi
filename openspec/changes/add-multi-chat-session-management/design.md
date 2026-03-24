## Context
The project already persists multiple `resume_chat_sessions` rows for a single resume, and the list API already returns them ordered by `updated_at DESC`.

The missing behavior is in the product surface:
- the resume chat panel does not show a session list
- the chat hook auto-selects the first session
- session titles default to `"New Chat"` unless explicitly provided
- the panel header still renders fixed localized copy instead of session controls

This change crosses API, persistence rules, and chat UI composition, so the proposal benefits from explicit design decisions before implementation.

## Goals
- Let users maintain multiple chat sessions for one resume
- Put session controls in the current header area of the chat panel
- Auto-name a session from its first user message
- Remove the static title/subtitle from the panel

## Non-Goals
- No cross-resume session sharing
- No nested folders, pinning, or search for sessions
- No AI-generated summary title that requires an extra model call

## Decisions

### 1. Session titles are derived from the first user message
Use the first saved user message as the source of truth for the session title.

Rationale:
- avoids an extra LLM request
- keeps naming deterministic
- matches the product request that the name comes from the first conversation

Expected implementation shape:
- create sessions without a user-provided title
- after the first user message is successfully persisted, update the session title if it is still unset or still using the default placeholder
- normalize the title from the first text content:
  - trim whitespace
  - collapse internal line breaks/spaces
  - truncate to the existing title limit
- if no usable text exists, keep a fallback placeholder until a usable user message appears

### 2. Session creation remains explicit, session selection becomes user-controlled
The chat UI should no longer silently force users into only the latest thread.

Expected behavior:
- load all sessions for the current resume
- if sessions exist, keep the current selection stable
- allow the user to create a new empty session from the session control area
- switch the active thread when the user selects a different session

### 3. The fixed chat title block is replaced by session controls
The area currently showing:
- `AI 对话`
- `关于简历的对话`

should be replaced with the multi-session entry point. The close button can remain, but the static copy should be removed.

### 4. Backward compatibility
Existing sessions with manual titles remain valid and should continue to display.

Sessions still named with the placeholder value should be eligible for first-message auto-renaming.

## Risks
- Title generation must avoid renaming an already user-meaningful legacy title
- Switching sessions while history is loading or streaming can create UI race conditions
- Creating many sessions without clear empty-state handling may confuse users if untitled placeholders are shown too long

## Open Questions
- The proposal assumes the session list will live directly in the current right-panel header region shown in the design image.
- The proposal assumes first-message naming should use the first user message text, not the first assistant reply.
