## 1. Database (Already Done)
- [x] 1.1 Add `truncated` column to `resume_chat_messages` table
- [x] 1.2 Add `has_tools` column to `resume_chat_messages` table
- [x] 1.3 Create indexes for efficient truncation and tool queries
- [ ] 1.4 Backfill has_tools for existing messages
- [x] 1.5 Add RLS policy to exclude truncated messages from SELECT

## 2. Backend API
- [x] 2.1 Create `/api/chat/truncate` endpoint
- [x] 2.2 Implement input validation with Zod schema
- [x] 2.3 Implement truncation logic:
  - [x] 2.3.1 Load message and verify ownership
  - [x] 2.3.2 Find all messages from selected point onward
  - [x] 2.3.3 Parse parts to extract originalValue from tool results
  - [x] 2.3.4 Revert resume fields to originalValue
  - [x] 2.3.5 Mark messages as truncated
  - [x] 2.3.6 Extract and return text content
- [x] 2.4 Add concurrency handling (optimistic locking)

## 3. Server Layer
- [x] 3.1 Add `truncateMessages` function in `lib/agent/chat-history.ts`
- [x] 3.2 Add `getMessagesAfter` helper function
- [x] 3.3 Add `extractToolOriginalValues` helper for parsing parts
- [x] 3.4 Update `saveMessage` to set has_tools flag
- [ ] 3.5 Update `loadHistory` to filter out truncated messages

## 4. Frontend State Management
- [x] 4.1 Add `inputTextAtom` to track input box content
- [x] 4.2 Create `useChat` hook handles truncation

## 5. Chat Interface
- [x] 5.1 Add truncation button to user messages in chat UI
- [x] 5.2 Implement button visibility logic (only on user messages)
- [x] 5.3 Disable button during streaming
- [x] 5.4 Implement truncation handler:
  - [x] 5.4.1 Call truncation API
  - [x] 5.4.2 Revert tool executions (trigger resume store update)
  - [x] 5.4.3 Copy text to input box
  - [x] 5.4.4 Update local message state (filter truncated)
- [x] 5.5 Add toast notifications for success/failure

## 6. Input Box
- [x] 6.1 Integrate `inputTextAtom` with ChatInput component
- [x] 6.2 Allow editing of copied text before resending
- [x] 6.3 Clear input on successful send

## 7. Testing
- [ ] 7.1 Write unit tests for truncation logic
- [ ] 7.2 Write integration tests for `/api/chat/truncate` endpoint
- [ ] 7.3 Write component tests for truncation button UI
- [ ] 7.4 Write E2E test for full truncation workflow
