## ADDED Requirements

### Requirement: Token 消耗追踪
系统 SHALL 记录每次 chat 消息的 token 消耗详情，包括 input tokens、output tokens、cached tokens 和 reasoning tokens。

#### Scenario: 用户发送消息后记录 token
- **WHEN** 用户发送一条消息并收到 AI 响应
- **THEN** 系统记录该消息的 input_tokens、output_tokens、cached_tokens、reasoning_tokens
- **AND** 系统更新 session 的 total_tokens

#### Scenario: 使用 cache 时记录缓存 token
- **WHEN** AI 响应使用了缓存（context cache）
- **THEN** cacheReadTokens 和 cacheCreationTokens 被合并记录到 cached_tokens

#### Scenario: 获取 session token 统计
- **WHEN** 用户请求获取当前 session 的 token 使用情况
- **THEN** 返回 total_tokens、total_input_tokens、total_output_tokens、total_cached_tokens、total_reasoning_tokens
- **AND** 返回各消息的 token 明细
