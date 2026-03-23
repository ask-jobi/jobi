## ADDED Requirements

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
