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

The system SHALL automatically filter out truncated messages from UI and API responses for the resume's canonical chat session.

#### Scenario: Truncated messages hidden in resume chat UI

- **GIVEN** a resume has truncated messages in its canonical chat session
- **WHEN** the chat UI renders the conversation
- **THEN** truncated messages are not displayed
- **AND** non-canonical sessions, if any legacy data exists, are not mixed into the conversation

#### Scenario: Truncated messages excluded from history load

- **GIVEN** a conversation with some truncated messages in the database
- **WHEN** loading chat history for a resume
- **THEN** the system reads from the canonical session only
- **AND** the query filters by `truncated=false`
- **AND** truncated messages are not returned in the results
- **AND** RLS policy enforces this filtering at database level

#### Scenario: Re-open page shows no truncated messages

- **GIVEN** user previously truncated a conversation in the canonical session
- **WHEN** user refreshes or reopens the page
- **THEN** truncated messages are not displayed
- **AND** the conversation appears as it did before truncation
- **AND** token statistics are preserved in the database

#### Scenario: has_tools used for efficient queries

- **GIVEN** a conversation with many messages
- **WHEN** truncating at a message in the canonical session
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

The system SHALL expose exactly one chat session for each resume in the product experience.

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

