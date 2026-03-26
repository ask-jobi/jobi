## 1. Specification
- [x] 1.1 Confirm the new single-session direction supersedes `add-multi-chat-session-management`
- [x] 1.2 Validate the `resume-chat` delta for single-session behavior and canonical-session calculations

## 2. Implementation
- [x] 2.1 Remove multi-session UI flows from the resume chat panel
- [x] 2.2 Update chat initialization to auto-resolve one canonical session per resume
- [x] 2.3 Restrict history loading, truncation, and token accounting to the canonical session
- [x] 2.4 Remove or narrow redundant session-management APIs and frontend state

## 3. Verification
- [x] 3.1 Add or update tests for implicit canonical-session creation and lookup
- [x] 3.2 Add or update tests to confirm users cannot switch or create multiple sessions from the product flow
- [x] 3.3 Add or update tests for truncation and token statistics under the single-session model
