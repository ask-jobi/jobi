## Context

当前 resume chat 已经有几个相互独立但彼此耦合的时序控制点：

- canonical session 解析
- history 请求
- history 写入 assistant-ui thread runtime
- handoff 自动发送
- 用户手动发送
- streaming 中的运行状态

这些控制点分散在 hook、本地 state、Jotai atom 和 AUI runtime 中，导致业务规则要靠多个布尔值一起推导。随着 handoff 和 token usage 时序修复迭代，代码已经逐渐表现出“隐式状态机”的特征，但没有显式状态模型。

## Goals / Non-Goals

- Goals:
  - 用单一 lifecycle state 表达 thread readiness
  - 用统一的 pending action 模型承接 handoff 和未 ready 时的用户发送
  - 避免在多个组件中复制发送 gating 条件
  - 保持现有 chat API、session model 和数据库结构不变
- Non-Goals:
  - 本次不引入外部状态机库
  - 本次不改变 assistant-ui runtime 本身
  - 本次不调整 token usage API 或 message persistence 协议

## Decisions

- Decision: 使用轻量 reducer / union state 实现 lifecycle，而不是引入 xstate。
  - Why: 当前需求范围有限，引入外部库的成本高于收益。

- Decision: 用统一 pending action 结构收敛系统动作和用户动作。
  - Why: handoff 和“未 ready 时发送”本质都是 “thread ready 后执行一次动作”。

- Decision: `ready` 之前不直接发送消息；动作进入 pending queue，等 thread ready 再消费。
  - Why: 避免 history 同步和消息 append 的时序竞争。

- Decision: Composer 的交互展示与 lifecycle 对齐。
  - Why: 用户界面和真实可执行状态必须一致，否则容易造成重复点击或丢消息。

## Risks / Trade-offs

- reducer 设计不清晰会让逻辑从“隐式复杂”变成“显式但冗长”。
  - Mitigation: 第一版只覆盖必要状态和两个 pending action 类型。

- 用户在未 ready 时发送消息的体验需要在“立即禁用”和“允许排队”之间平衡。
  - Mitigation: 提案要求统一收敛为 pending action，具体 UI 提示可保持最小化。

- handoff 和用户发送统一后，测试需要覆盖更多时序组合。
  - Mitigation: 把 lifecycle 状态转移和动作消费拆成可单测的单元。

## Migration Plan

1. 提炼 thread lifecycle state 和 pending action 类型。
2. 将 handoff 逻辑迁移到 lifecycle 驱动的动作消费流程。
3. 将未 ready 时的 Composer 发送接入同一 pending action 通道。
4. 删除被状态机替代的分散布尔 gating。
5. 补充回归测试并验证现有 handoff / history / streaming 行为。
