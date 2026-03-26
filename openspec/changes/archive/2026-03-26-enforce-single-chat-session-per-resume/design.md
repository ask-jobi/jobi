## Context
The codebase already stores chat data in `resume_chat_sessions`, but the requested product behavior is now simpler: each resume should expose only one chat thread to the user.

There is also a pending change, `add-multi-chat-session-management`, that goes in the opposite direction by adding session lists, explicit new-session creation, and user-controlled switching. This proposal intentionally supersedes that direction.

## Goals
- Expose only one chat session per resume in the product
- Keep truncation, token accounting, and message history tied to one canonical session
- Avoid introducing extra UI or API flows for session management

## Non-Goals
- No merge of historical messages across multiple legacy sessions
- No new cross-resume chat model
- No database redesign if the existing session table can continue to serve as the backing store

## Decisions

### 1. Keep `session` as an implementation detail, not a user-facing concept
The system may still persist chat data in a session table, but the user should not manage sessions directly.

Expected behavior:
- each resume resolves to one canonical chat session
- opening the chat loads that canonical session automatically
- if no session exists yet, the system creates one implicitly
- the UI does not expose session switching or additional session creation

### 2. All chat calculations use the canonical session only
Session-level calculations remain valid internally, but product behavior is defined against the one canonical session for the resume.

This includes:
- token totals
- message history loading
- truncation scope
- session title generation and updates

Legacy extra sessions, if any exist in data, are excluded from normal product flows and do not participate in displayed calculations for the resume chat experience.

### 3. Canonical-session selection prefers stability over migration complexity
This proposal does not require merging old sessions together.

Expected implementation shape:
- identify one canonical session for each resume, preferably the currently selected or latest active session
- reuse that canonical session for all future chat operations on the resume
- leave older extra sessions untouched unless a later cleanup change explicitly removes them

## Risks / Trade-offs
- Existing users with multiple stored sessions may no longer see older threads in the UI
- Canonical-session selection must be deterministic to avoid apparent history loss
- Some existing API surfaces may become redundant and should be retired carefully

## Migration Plan
1. Stop exposing multi-session UI and API flows.
2. Resolve one canonical session per resume during chat initialization.
3. Route token updates, truncation, and history reads through that canonical session only.
4. Evaluate whether legacy extra sessions need a separate cleanup proposal after rollout.

## Open Questions
- Whether canonical-session selection should prefer `updated_at DESC` or an explicit persisted pointer on the resume
- Whether redundant session-management endpoints should be removed immediately or kept as internal-only compatibility paths
