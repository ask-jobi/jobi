## Context

The chat system allows AI to modify resume data through tool calls. Users need the ability to revert to a previous message state, which removes subsequent messages and reverts all tool modifications made after that point.

### User Flow Example
```
消息 1: 用户提问 A
消息 2: 用户提问 B  ← 用户点击回溯按钮
消息 3: AI 修改简历 X
消息 4: AI 修改简历 Y
消息 5: AI 继续修改 Z

结果:
- 消息 2,3,4,5 truncated = true
- 消息 3,4,5 的 tool 调用 revert
- 消息 2 的内容复制到输入框
- 用户可以在输入框继续编辑并重新发送
```

### Constraints
- Must keep token statistics (no hard delete)
- Must ensure resume consistency (all tool calls after point must revert)
- No undo functionality (user must regenerate with AI)
- User message is copied to input, AI messages are not copied
- No separate tool_executions table - reuse parts data

## Goals / Non-Goals

### Goals
- Allow users to reset chat to any previous user message
- Revert all tool modifications made after the selected point
- Soft delete removed messages to preserve token statistics
- Copy the user's message to input box for continuation

### Non-Goals
- Hard delete of messages (must keep records)
- Undo/redo of truncation operation
- Partial revert (either all or nothing)
- Copying AI messages to input box
- Recovering truncated messages
- Separate tool execution tracking table

## Decisions

### 1. Schema Enhancement

**Decision:** Add `truncated` and `has_tools` columns to existing `resume_chat_messages` table.

**Rationale:**
- Reuse existing table, no new tables needed
- `parts` already contains tool call information
- Simple boolean flags enable efficient filtering

**Schema Changes (applied to existing migration):**
```sql
ALTER TABLE resume_chat_messages ADD COLUMN truncated BOOLEAN DEFAULT FALSE;
ALTER TABLE resume_chat_messages ADD COLUMN has_tools BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_messages_truncated
    ON resume_chat_messages(session_id, created_at ASC)
    WHERE truncated = FALSE;

CREATE INDEX idx_messages_has_tools
    ON resume_chat_messages(session_id, created_at ASC)
    WHERE has_tools = TRUE;
```

### 2. Message Selection

**Decision:** Only user messages can be selected as the truncation point.

**Rationale:**
- Natural conversation boundary (user speaks, AI responds)
- User owns the question and can choose to rephrase
- AI messages are responses, not starting points

**UI:**
- Backward/revert button appears on user messages only
- Button shows icon (↩️) and label "回溯"
- Button visible on hover or as persistent icon

### 3. Truncation Propagation

**Decision:** When truncating at message N, all messages N and after are truncated.

**Rationale:**
- Ensures conversation consistency
- AI messages after N may depend on modifications made in N
- Simplifies mental model: "everything from here forward is gone"

### 4. Tool Revert Strategy

**Decision:** Parse tool information from `parts` field and extract `original_value` from tool result parts.

**Rationale:**
- No separate tool_executions table needed
- `parts` already contains complete tool execution data
- Revert can be done by re-reading the message and extracting original values

**Parts Structure (ai-sdk):**
```typescript
// Message parts example
{
  id: "msg-3",
  role: "assistant",
  parts: [
    { type: "text", text: "I'll help you optimize..." },
    {
      type: "tool-rewriteBlock",
      toolCallId: "call-1",
      state: "output-available",
      output: {
        entity: "employment",
        id: "block-123",
        field: "content",
        originalValue: "Old content here",
        value: "Optimized content here",
        reason: "STAR method"
      }
    }
  ]
}
```

**Revert Algorithm:**
1. Find message N (selected truncation point)
2. Load all messages M where M.created_at >= N.created_at AND M.truncated = false AND M.has_tools = true
3. For each message M:
   - Parse parts to find tool result parts
   - Extract originalValue from each tool result
   - Restore resume fields to originalValue
4. Mark all messages M as truncated = true
5. Copy message N.text content to input box

### 5. Input Box Population

**Decision:** Store message content in `parts` field, copy text parts to input on truncate.

**Rationale:**
- ai-sdk uses `parts` for message content (text, tool calls, etc.)
- Need to extract text parts for input box

**Input extraction:**
```typescript
function extractTextFromParts(parts: UIMessage['parts']): string {
  return parts
    .filter(p => p.type === 'text')
    .map(p => p.text)
    .join('\n')
}
```

### 6. API Design

**Decision:** Create `/api/chat/truncate` endpoint.

**Endpoints:**
- `POST /api/chat/truncate` - Truncate conversation at message ID

**Request:**
```json
{
  "messageId": "uuid-of-selected-message"
}
```

**Response:**
```json
{
  "success": true,
  "truncatedCount": 4,
  "copiedText": "用户提问内容..."
}
```

### 7. Concurrency Handling

**Decision:** Use optimistic locking with created_at check.

**Rationale:**
- Prevent race conditions when multiple truncation requests
- Simple to implement with existing schema
- No additional locking tables needed

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| User accidentally truncates conversation | Instant truncation (no dialog) - acceptable as user can regenerate |
| Resume state inconsistency | Revert all tool calls from truncated messages |
| Large number of messages to process | Batch update in single transaction |
| Parsing parts for original values | Cache has_tools flag when saving messages |

## Migration Plan

### Database (Already Applied)
```sql
-- In existing migration 20260206155328_create_chat_tables.sql
ALTER TABLE resume_chat_messages ADD COLUMN truncated BOOLEAN DEFAULT FALSE;
ALTER TABLE resume_chat_messages ADD COLUMN has_tools BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_messages_truncated
    ON resume_chat_messages(session_id, created_at ASC)
    WHERE truncated = FALSE;

CREATE INDEX idx_messages_has_tools
    ON resume_chat_messages(session_id, created_at ASC)
    WHERE has_tools = TRUE;

-- RLS policy to exclude truncated messages
DROP POLICY IF EXISTS "Users can view messages from their own sessions" 
    ON resume_chat_messages;

CREATE POLICY "Users can view messages from their own sessions"
    ON resume_chat_messages
    FOR SELECT
    USING (
        truncated = false
        AND exists (
            select 1 from public.resume_chat_sessions
            where id = session_id and user_id = auth.uid()
        )
    );
```

**Note:** The UPDATE policy for truncation needs to allow updating truncated flag, so we need a separate policy:
```sql
CREATE POLICY "Users can truncate their own messages"
    ON resume_chat_messages
    FOR UPDATE
    USING (
        exists (
            select 1 from public.resume_chat_sessions
            where id = session_id and user_id = auth.uid()
        )
    );
```

### Backfill
- Set truncated = false for all existing messages
- Set has_tools based on parts content (query parts for tool-* parts)
- No data loss

### TypeScript Types
```typescript
interface ResumeChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  parts: UIMessagePart[]
  token_count: number
  cost: number
  created_at: string
  truncated: boolean       // NEW
  has_tools: boolean        // NEW
}
```

## Open Questions

1. Should the session status change when truncated?
   - Current: No, session remains in same status
   - Alternative: Set to "truncated" status

2. How to handle new messages after truncation?
   - New messages continue with same session_id
   - Created_at continues incrementing
   - This is the expected behavior

3. How to set has_tools flag?
   - Set when saving messages (check parts for tool-* types)
   - Backfill existing messages after migration
