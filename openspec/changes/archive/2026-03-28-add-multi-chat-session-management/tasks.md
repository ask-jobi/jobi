## 1. Implementation

- [x] 1.1 Update session domain logic to support first-message auto-titling
  - Create sessions without requiring a manual title
  - Add a server-side title update path for sessions still using the placeholder title
  - Derive the title from the first user message text with normalization and truncation

- [x] 1.2 Update chat APIs for the new session lifecycle
  - Stop treating session title as creation input for the primary flow
  - Return enough session metadata for the session switcher UI
  - Keep ownership and validation rules intact

- [x] 1.3 Refactor chat session state management in the frontend
  - Expose session list, active session selection, and explicit new-session creation
  - Preserve the selected session when refreshing the list
  - Avoid auto-switch race conditions while loading history

- [x] 1.4 Replace the static right-panel chat header with multi-session controls
  - Render session switching and new-session creation in the current header location
  - Keep close behavior intact
  - Remove the fixed title/subtitle copy

- [x] 1.5 Remove obsolete chat header i18n keys
  - Delete unused translation entries from `lib/i18n/translations/en.json`
  - Delete unused translation entries from `lib/i18n/translations/zh.json`
  - Ensure no component still references the removed keys

## 2. Testing

- [x] 2.1 Add unit tests for session title derivation and first-message auto-titling
- [x] 2.2 Add API tests for creating sessions and updating placeholder titles after first user message
- [x] 2.3 Add component tests for session switching / new-session creation in the chat panel

## 3. Validation

- [x] 3.1 Run `openspec validate add-multi-chat-session-management --strict --no-interactive`
- [x] 3.2 Run relevant unit tests
- [x] 3.3 Run `pnpm lint`
