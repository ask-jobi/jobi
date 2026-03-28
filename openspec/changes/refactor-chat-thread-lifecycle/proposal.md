# Change: Refactor chat thread lifecycle into a single state machine

## Why
当前 resume chat 初始化与发送时序依赖多个分散的布尔状态和一次性 ref 判断，例如 session 是否已解析、history 是否还在加载、history 是否已经同步进 AUI thread、handoff 是否待发送。随着 “一键润色跳转 Chat 自动发消息” 上线，这些判断已经开始相互耦合，并且未来还需要支持“用户在 thread 未 ready 时点击发送”这类场景。

继续沿用分散条件会让行为难以验证，也容易出现重复发送、跨 resume 误发、历史尚未同步时抢先 append 等时序 bug。需要一个统一的 thread lifecycle 和 pending action 模型，把 chat 初始化和发送 gating 收敛到一处。

## What Changes
- 为 resume chat 引入一个显式的 thread lifecycle 状态机，用单一状态描述：
  - session 解析中
  - history 加载中
  - thread 同步中
  - ready
  - running
  - error
- 引入统一的 pending action 通道，至少覆盖：
  - evaluation 页面触发的 handoff 自动消息
  - thread 未 ready 时用户点击发送的消息
- 在 thread 进入 ready 后统一消费 pending action，而不是让 handoff 和用户发送各自维护单独条件
- 将 Composer 的发送可用性与 thread lifecycle 对齐，避免用户在未 ready 时触发未定义时序
- 为 lifecycle 和 pending action 行为补充测试，覆盖初始化、handoff、未 ready 发送、ready 后执行、streaming 中限制

## Impact
- Affected specs: `resume-chat`
- Affected code:
  - `components/agent/chat-interface.tsx`
  - `components/agent/chat/composer.tsx`
  - `components/agent/chat/chat-handoff-effect.tsx`
  - `lib/hooks/use-chat-history.ts`
  - `lib/hooks/use-chat-session-token-usage.ts`
  - `lib/store/chat.ts`
  - related component and hook tests
