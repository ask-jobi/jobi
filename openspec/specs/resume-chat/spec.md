# resume-chat Specification

## Purpose
TBD - created by archiving change add-chat-revert-functionality. Update Purpose after archive.
## Requirements
### Requirement: Message Truncation

The system SHALL allow users to truncate the conversation at any user message, removing all subsequent messages and reverting their tool modifications.

#### Scenario: User clicks truncation button

- **WHEN** user clicks the truncation button on a user message
- **THEN** all messages from the selected message onward are marked as truncated
- **AND** all tool executions from truncated messages are reverted
- **AND** the selected message content is copied to the input box
- **AND** the user can edit and resend the message

#### Scenario: Truncation preserves token statistics

- **GIVEN** a conversation with 10 messages and 1000 total tokens
- **WHEN** user truncates at message 5
- **THEN** messages 5-10 remain in the database with truncated=true
- **AND** token statistics still reflect all 10 messages
- **AND** new messages continue from the same session

### Requirement: Truncation Button UI

The system SHALL display a truncation button on user messages.

#### Scenario: Button appears on user messages

- **WHEN** a message with role="user" is rendered
- **THEN** a truncation button (↩️) is displayed
- **AND** the button is labeled "回溯"

#### Scenario: Button does not appear on AI messages

- **WHEN** a message with role="assistant" is rendered
- **THEN** no truncation button is displayed

#### Scenario: Button disabled during streaming

- **WHEN** the chat is streaming a response
- **THEN** truncation buttons are disabled
- **AND** tooltips show "Wait for response before truncating"

### Requirement: Tool Execution Revert

The system SHALL revert all tool executions from truncated messages to ensure resume consistency.

#### Scenario: Revert multiple tool executions

- **GIVEN** a conversation where AI made 3 tool modifications in messages 3, 4, and 5
- **WHEN** user truncates at message 2
- **THEN** all 3 tool executions are reverted
- **AND** the resume returns to its state before message 3

#### Scenario: Revert preserves non-truncated executions

- **GIVEN** a conversation with tool executions in messages 1, 2, 3, 4, and 5
- **WHEN** user truncates at message 3
- **THEN** tool executions from messages 1, 2, and 3 remain applied
- **AND** tool executions from messages 4 and 5 are reverted

#### Scenario: Original values extracted from message parts

- **GIVEN** a message containing tool result parts with originalValue field
- **WHEN** truncation is triggered
- **THEN** the system parses the parts to extract originalValue
- **AND** resume fields are restored to the extracted originalValue
- **AND** no separate tool execution table is required

### Requirement: Truncation API

The system SHALL provide an API endpoint to handle conversation truncation.

#### Scenario: Truncate endpoint accepts message ID

- **WHEN** POST request is made to `/api/chat/truncate` with messageId
- **THEN** the system identifies all messages from messageId onward
- **AND** marks them as truncated
- **AND** reverts all tool executions from those messages
- **AND** returns the copied text content

#### Scenario: Truncate endpoint validates ownership

- **WHEN** user requests to truncate a message they do not own
- **THEN** the API returns 403 Forbidden
- **AND** no messages are modified

#### Scenario: Truncate endpoint handles concurrent requests

- **WHEN** two truncation requests are made simultaneously
- **THEN** only the first request succeeds
- **AND** the second request returns 409 Conflict
- **AND** no messages are in inconsistent state

### Requirement: Input Box Population

The system SHALL copy the truncated message content to the input box.

#### Scenario: Text content copied to input

- **GIVEN** a user message containing text "Improve my experience section"
- **WHEN** user truncates at this message
- **THEN** the input box contains "Improve my experience section"
- **AND** the user can edit the text before resending

#### Scenario: Multipart message content concatenated

- **GIVEN** a user message with multiple text parts
- **WHEN** user truncates at this message
- **THEN** all text parts are concatenated with newlines
- **AND** the result is placed in the input box

#### Scenario: Tool calls are not copied

- **GIVEN** a user message containing tool calls
- **WHEN** user truncates at this message
- **THEN** only text parts are copied to input
- **AND** tool calls are ignored

### Requirement: Message has_tools Flag

The system SHALL track whether a message contains tool calls using the has_tools column.

#### Scenario: has_tools set on message save

- **WHEN** a message is saved to the database
- **THEN** the system checks the parts for tool-* types
- **AND** sets has_tools=true if any tool part exists
- **AND** sets has_tools=false if no tool parts exist

### Requirement: Truncated Message Filtering

The system SHALL automatically filter out truncated messages from UI and API responses for the active session only.

#### Scenario: Truncated messages hidden in selected session UI

- **GIVEN** a user switches to a specific chat session
- **WHEN** the chat UI renders the message list for that session
- **THEN** truncated messages from that selected session are not displayed
- **AND** messages from other sessions are never mixed into the active conversation

#### Scenario: Truncated messages excluded from history load

- **GIVEN** a conversation with some truncated messages in the database
- **WHEN** loading chat history for the active session
- **THEN** the query filters by `truncated=false`
- **AND** truncated messages are not returned in the results
- **AND** RLS policy enforces this filtering at database level

#### Scenario: Re-open page shows no truncated messages

- **GIVEN** user previously truncated a conversation in one session
- **WHEN** user refreshes or reopens the page and selects that session again
- **THEN** truncated messages are not displayed
- **AND** the conversation appears as it did before truncation
- **AND** token statistics are preserved in the database

#### Scenario: has_tools used for efficient queries

- **GIVEN** a conversation with many messages
- **WHEN** truncating at a message within the active session
- **THEN** the system queries only messages where `has_tools=true`
- **AND** the query uses the filtered index for performance

### Requirement: Token 消耗追踪

系统 SHALL 记录单个 resume chat canonical session 中每次消息的 token 消耗详情，包括 input tokens、output tokens、cached tokens 和 reasoning tokens。

#### Scenario: 用户发送消息后记录 token

- **WHEN** 用户在 resume chat 中发送一条消息并收到 AI 响应
- **THEN** 系统记录该消息的 input_tokens、output_tokens、cached_tokens、reasoning_tokens
- **AND** 系统更新该 resume canonical session 的 total_tokens

#### Scenario: 使用 cache 时记录缓存 token

- **WHEN** AI 响应使用了缓存（context cache）
- **THEN** cacheReadTokens 和 cacheCreationTokens 被合并记录到 cached_tokens

#### Scenario: 获取 token 统计

- **WHEN** 用户请求获取 resume chat 的 token 使用情况
- **THEN** 返回 canonical session 的 total_tokens、total_input_tokens、total_output_tokens、total_cached_tokens、total_reasoning_tokens
- **AND** 返回各消息的 token 明细

### Requirement: Plan-Based Chat Token Quota
系统 SHALL 为每个有效的 `access_pass` 分配 chat token 配额，并在达到配额后阻止继续发送消息。

#### Scenario: 免费计划写入固定 token 上限
- **WHEN** 系统为用户创建 `FREE` access pass
- **THEN** `access_passes.quota_chat_tokens` 被设置为 `100000`
- **AND** `access_passes.used_chat_tokens` 初始值为 `0`

#### Scenario: 不同计划获得不同 token 配额
- **WHEN** 系统为用户创建 `LITE` access pass
- **THEN** `access_passes.quota_chat_tokens` 被设置为 `1000000`

#### Scenario: 专业计划写入超大 token 上限
- **WHEN** 系统为用户创建 `PRO` access pass
- **THEN** `access_passes.quota_chat_tokens` 被设置为 `100000000`

#### Scenario: 成功响应后累计 token 用量
- **GIVEN** 用户拥有一个未耗尽的有效 access pass
- **WHEN** chat 请求完成并返回实际 token 用量
- **THEN** 系统将该次请求的 `totalTokens` 累加到 `access_passes.used_chat_tokens`
- **AND** session 级 token 统计继续正常更新

#### Scenario: 达到上限后禁止继续发送
- **GIVEN** 当前有效 access pass 的 `used_chat_tokens` 已大于或等于 `quota_chat_tokens`
- **WHEN** 用户再次发送 chat 消息
- **THEN** API 返回 token 配额已耗尽的错误
- **AND** 不触发模型调用
- **AND** 不保存新的用户消息

#### Scenario: 最后一次请求可以触发封顶
- **GIVEN** 当前有效 access pass 仍有剩余 token
- **WHEN** 某次成功响应后 `used_chat_tokens` 达到或超过 `quota_chat_tokens`
- **THEN** 该次响应正常返回
- **AND** 后续 chat 消息会被拒绝

### Requirement: Chat Token Quota Visibility
系统 SHALL 通过订阅与用量接口返回当前计划的 chat token 配额信息，以便前端展示实际限制。

#### Scenario: 获取订阅信息时返回 chat token 用量
- **WHEN** 用户请求订阅与用量信息
- **THEN** 响应包含当前 access pass 的 chat token `total`、`used`、`remaining`
- **AND** 前端可以据此展示当前计划的 token 限额

### Requirement: Single Chat Session Per Resume

The system SHALL expose exactly one implicit chat session for each resume in the product experience, without rendering session-specific header controls in the resume chat panel.

#### Scenario: Opening chat resolves the canonical session

- **WHEN** the user opens chat for a resume
- **THEN** the system loads that resume's canonical chat session automatically
- **AND** the user does not need to select from multiple sessions

#### Scenario: Missing session is created implicitly

- **GIVEN** a resume does not yet have a chat session
- **WHEN** the user opens the chat experience or sends the first message
- **THEN** the system creates one canonical session automatically
- **AND** that session is used for all subsequent chat operations on the resume

#### Scenario: Users cannot create or switch sessions from the UI

- **WHEN** the user uses the resume chat panel
- **THEN** the UI does not display a session list
- **AND** the UI does not provide a control to create another session
- **AND** the active conversation remains the single canonical session for that resume

#### Scenario: Resume chat panel does not render session header controls

- **WHEN** the user opens the resume chat panel
- **THEN** the panel does not render a session title header
- **AND** the panel does not render a header loading indicator for session metadata
- **AND** the panel does not render a close or dismiss action that exists only within the removed chat session controls

### Requirement: Evaluation Optimize Button Hands Off To Chat

The system SHALL keep the evaluation-panel optimize button as a chat entrypoint instead of running a separate one-click resume optimization flow.

#### Scenario: Clicking optimize opens chat and sends the predefined message

- **GIVEN** the user is viewing the evaluation panel for a resume
- **WHEN** the user clicks the "`一键润色简历`" button
- **THEN** the system switches the right panel to the chat view
- **AND** the system resolves the resume's canonical chat session
- **AND** the system queues one predefined optimization message for that resume
- **AND** the system sends that message only after the chat thread becomes ready

#### Scenario: Automatic handoff message is sent only once per click

- **GIVEN** the optimize button was clicked once
- **WHEN** the chat thread transitions through initialization states before becoming ready
- **THEN** the predefined optimization message is delivered at most once for that click
- **AND** no duplicate user messages are created

#### Scenario: Handoff reuses localized message content

- **WHEN** the system prepares the predefined optimization message for the handoff
- **THEN** the message content uses the current locale's configured chat copy
- **AND** the button flow does not hardcode user-visible text in the component

### Requirement: One-Click Resume Optimization Flow Is Removed

The system SHALL not expose or execute the legacy one-click resume optimization flow that generated local resume edit previews outside chat.

#### Scenario: Evaluation panel no longer shows local op preview workflow

- **WHEN** the user clicks the optimize button from the evaluation panel
- **THEN** the UI does not show the old suggestion list, diff preview, or apply/undo/skip controls
- **AND** the optimization continues through the chat experience only

#### Scenario: Legacy one-click optimization endpoint is removed from product flow

- **WHEN** the evaluation optimize action is triggered
- **THEN** the frontend does not request `/api/resume/ops-from-evaluation`
- **AND** the legacy endpoint is no longer required to support the product behavior

#### Scenario: Removed flow does not consume fullOptimize quota

- **WHEN** the user starts resume optimization from the retained evaluation button
- **THEN** the system does not consume `fullOptimize` quota
- **AND** any usage accounting follows the resume chat flow instead

### Requirement: Chat Thread Lifecycle Readiness

The system SHALL model resume chat initialization with a single thread lifecycle state so that message execution is gated by explicit readiness instead of multiple independent boolean checks.

#### Scenario: Thread becomes ready only after history is synchronized

- **GIVEN** the user opens the resume chat panel
- **WHEN** the system resolves the canonical session and loads chat history
- **THEN** the thread does not enter the ready state until the loaded history has been synchronized into the active chat runtime

#### Scenario: Thread readiness drives message execution

- **WHEN** the thread is not yet ready
- **THEN** the system does not execute outgoing chat actions immediately
- **AND** message execution waits until the lifecycle reaches ready

### Requirement: Pending Chat Actions Queue

The system SHALL use a unified pending action mechanism for chat actions that are requested before the thread is ready.

#### Scenario: Handoff waits in pending actions

- **GIVEN** the user triggers the evaluation-panel optimize handoff before the chat thread is ready
- **WHEN** the thread is still resolving session, loading history, or synchronizing history
- **THEN** the system stores the handoff as a pending action
- **AND** executes it exactly once after the thread becomes ready

#### Scenario: User send before readiness is queued

- **GIVEN** the user types a message before the chat thread is ready
- **WHEN** the user submits the message
- **THEN** the system stores that send request as a pending action
- **AND** executes it exactly once after the thread becomes ready

#### Scenario: Pending action respects resume scope

- **GIVEN** a pending chat action was created for one resume
- **WHEN** the user navigates to another resume before the action is executed
- **THEN** the system does not execute the pending action in the other resume's chat thread

### Requirement: Multiple Chat Sessions Per Resume

The system SHALL let a user manage multiple chat sessions for the same resume from the resume chat panel.

#### Scenario: User sees existing sessions for the current resume

- **GIVEN** a resume has multiple chat sessions
- **WHEN** the user opens the chat panel for that resume
- **THEN** the UI shows the available sessions in the session management area
- **AND** the user can switch the active conversation to a selected session

#### Scenario: User creates a new session

- **GIVEN** the user is viewing the chat panel for a resume
- **WHEN** the user creates a new chat session from the session management area
- **THEN** the system creates a separate empty session for that same resume
- **AND** the new session becomes the active session
- **AND** existing sessions remain available for later switching

### Requirement: Session Title Auto-Generation From First User Message

The system SHALL generate a chat session title from the first user message instead of requiring a manual title at session creation time.

#### Scenario: First user message names the session

- **GIVEN** a session is newly created and still has no meaningful title
- **WHEN** the first user message is saved with text content
- **THEN** the system derives the session title from that first user message
- **AND** the title is normalized and truncated to the supported title length

#### Scenario: Existing titled sessions are not renamed

- **GIVEN** a session already has a meaningful non-placeholder title
- **WHEN** additional user messages are saved
- **THEN** the existing session title remains unchanged

#### Scenario: Placeholder title remains until usable text exists

- **GIVEN** a new session has not yet received a usable text message
- **WHEN** the system cannot derive text for the title
- **THEN** the session keeps its placeholder title
- **AND** the system retries title generation when a later usable user message is saved

### Requirement: Chat Panel Uses Session Controls Instead Of Static Header Copy

The system SHALL use the current right-panel chat header area for session management controls instead of rendering a fixed title and subtitle.

#### Scenario: Static chat title is removed

- **WHEN** the user opens the resume chat panel
- **THEN** the UI does not display a fixed localized chat title or subtitle above the conversation
- **AND** the header area is reserved for session management controls and dismiss actions

### Requirement: Chat Event Logging

The system SHALL log chat events to track resume modifications, summary checkpoints, and rollback operations.

#### Scenario: Log resume modification event

- **WHEN** AI executes a tool that modifies the resume (rewrite, delete, add, reorder) in frontend onToolCall
- **THEN** the frontend calls a Server Action to create a `resume_modification` event with:
  - session_id
  - message_id
  - event_type = 'resume_modification'
  - operation details (operation type, entity, block IDs, etc.)
  - original_value (for rewrite/delete/reorder)
  - new_value (for rewrite/add)
  - created_at timestamp

#### Scenario: Log summary checkpoint event

- **WHEN** AI generates a conversation summary (every 5 messages)
- **THEN** a `summary_checkpoint` event is created with:
  - session_id
  - message_count at checkpoint
  - event_type = 'summary_checkpoint'
  - summary_text (the generated summary)
  - created_at timestamp

#### Scenario: Log rollback event

- **WHEN** user truncates/rolls back conversation
- **THEN** a `rollback` event is created with:
  - session_id
  - truncated_message_id
  - event_type = 'rollback'
  - message_count before rollback
  - created_at timestamp

### Requirement: Event Append-Only

The system SHALL ensure chat events are append-only (no updates or deletes).

#### Scenario: No update operations allowed

- **WHEN** user attempts to update an existing chat_event
- **THEN** the operation fails
- **AND** error is returned

#### Scenario: No delete operations allowed

- **WHEN** user attempts to delete an existing chat_event
- **THEN** the operation fails
- **AND** error is returned

### Requirement: Event Query API

The system SHALL provide an API to query chat events for a session.

#### Scenario: Get all events for session

- **WHEN** GET request is made to `/api/chat/events?session_id=xxx`
- **THEN** returns all events for the session ordered by created_at asc

#### Scenario: Filter events by type

- **WHEN** GET request is made to `/api/chat/events?session_id=xxx&event_type=resume_modification`
- **THEN** returns only events matching the specified event_type

### Requirement: Resume Editor Tool

The system SHALL provide a comprehensive tool for AI to edit resume blocks and sections, supporting field modification, block deletion, block addition, block reordering, and section reordering.

#### Scenario: Rewrite block field

- **WHEN** AI calls the tool with operation="rewrite" and specifies entity, id, field, reason, and value
- **THEN** the specified field in the block is updated
- **AND** the original value is returned for potential revert
- **AND** the output language matches the resume language

#### Scenario: Delete a block

- **WHEN** AI calls the tool with operation="delete" and specifies entity and id
- **THEN** the specified block is removed from the section
- **AND** the removed block data is returned for potential revert

#### Scenario: Add a new block

- **WHEN** AI calls the tool with operation="add" and specifies entity and block data
- **THEN** a new block is created in the specified section
- **AND** the new block is assigned a unique ID
- **AND** the new block is added to the end of the section

#### Scenario: Reorder blocks within a section

- **WHEN** AI calls the tool with operation="reorderBlocks" and specifies entity and orderedIds
- **THEN** blocks in the specified section are reordered to match the orderedIds array
- **AND** the original order is preserved for potential revert

#### Scenario: Reorder sections

- **WHEN** AI calls the tool with operation="reorderSections" and specifies orderedSectionIds
- **THEN** the sectionOrder array in the resume is updated
- **AND** sections are reordered to match the orderedSectionIds array
- **AND** personalInfo remains fixed at the first position
- **AND** the original order is preserved for potential revert

