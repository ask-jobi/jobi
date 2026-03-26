## ADDED Requirements

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

## MODIFIED Requirements

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
