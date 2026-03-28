# Resume Chat

这个 plan 已完成，记录当前 resume chat 相关能力的最终落地结果。

## 结果概览

- 产品界面默认使用每份简历的单个 canonical chat session
- 右侧聊天面板不展示 session 列表，也没有“新建会话”入口
- 主产品流程只解析并使用 canonical session

## 已完成内容

### 消息回溯

- 用户消息显示仅图标的回溯按钮
- 当前中文文案使用“撤回”
- 点击后前端调用 `POST /api/chat/truncate`
- 服务端将目标消息之后的消息标记为 `truncated=true`
- 包含工具输出的消息会触发简历数据逆向恢复
- 接口返回最新 resume 数据，由前端更新本地状态
- 输入框内容由前端从消息 text parts 中提取并重新写回 composer

### 历史消息与过滤

- 聊天历史在应用层过滤 `truncated=false`
- `resume_chat_messages` 的 RLS 不再负责过滤 truncated 消息
- `has_tools` 字段会在消息保存和更新时自动维护
- 截断后会恢复 conversation summary 到合适的历史状态

### Token 统计与额度

- 每条消息记录 `input_tokens`、`output_tokens`、`cached_tokens`、`reasoning_tokens`
- session 级统计基于未截断消息重新聚合
- `cached_tokens` 当前只记录 `cacheReadTokens`
- `FREE`、`LITE`、`PRO` 的 chat token 配额分别为 `100000`、`1000000`、`100000000`
- 成功响应后会累加 `totalTokens` 到 `used_chat_tokens`
- 当 `used_chat_tokens >= quota_chat_tokens` 时，新 chat 请求会被拒绝

### 评估面板联动

- “一键润色简历”会切换到 chat 视图
- 不再走旧的本地 preview/apply 流程
- 预定义消息会在 chat thread ready 后通过 pending action 机制发送
- 该流程不消耗 `fullOptimize` quota，而遵循 resume chat 的 token 额度逻辑

### Thread 生命周期与事件记录

- 聊天线程使用 `idle`、`loading-history`、`syncing-thread`、`ready`、`running`、`error`
- pending action 会绑定 resumeId，避免切换简历后误执行
- session 默认标题为 `New Chat`
- 默认标题会在首条可用用户消息后自动生成新标题
- 系统会写入 `resume_modification`、`summary_checkpoint`、`rollback` 三类 `chat_events`
- 当前只实现事件写入，没有产品侧事件查询接口
