## Context

当前 evaluation 面板里的“`一键润色简历`”并不是 chat 的一个快捷入口，而是一条独立产品链路：

- 前端按钮发起 `/api/resume/ops-from-evaluation`
- 后端根据 evaluation report 生成一组 `ResumeEditOp`
- 前端展示预览，并允许用户逐条 apply / undo / skip
- 请求成功后消耗一次 `fullOptimize` 次数配额

这条链路和 resume chat 都会驱动简历修改，导致产品入口重复、实现分裂，并让配额语义变得不一致。

## Goals / Non-Goals

- Goals:
  - 保留用户可见的按钮入口
  - 把入口统一切到 resume chat
  - 删除一键润色专属执行链路和其前端交互
  - 避免用户在订阅 UI 中看到已经不可用的 `fullOptimize` 能力说明
- Non-Goals:
  - 本次不调整数据库 schema，也不删除 `access_passes` 中历史 `full_optimize` 字段
  - 本次不改变 block optimize、motivation letter、chat token 等其他配额能力
  - 本次不新增新的 chat tool；继续复用现有 resume chat 能力

## Decisions

- Decision: “一键润色简历”按钮改为 chat handoff，而不是隐藏或删除。
  - Why: 产品希望保留熟悉入口，但把实际能力收敛到 chat。

- Decision: 按钮点击后自动发送一条预置消息，而不是只打开 chat 并填充输入框。
  - Why: 用户目标是立即开始优化，不需要再做一次手动发送。

- Decision: 预置消息使用 locale-aware 文案，并在 session ready 后只发送一次。
  - Why: 避免硬编码文本，也避免 React 重新渲染或 session 初始化抖动导致重复发送。

- Decision: 本次只移除产品入口、执行链路和相关展示，不迁移数据库配额字段。
  - Why: schema/计费迁移风险更高，且不是完成当前产品目标的必要条件。

## Risks / Trade-offs

- 自动发送消息依赖 chat session 初始化时机。
  - Mitigation: 增加显式的 pending handoff state，在 canonical session resolved 后消费并清空。

- `fullOptimize` 配额字段仍保留在数据模型中，代码中可能存在未清理引用。
  - Mitigation: 提案要求清理产品 UI 和调用链路；后续若需要彻底删除 schema，再单独提案。

- 从“本地生成 edit ops”切到 chat 后，用户感知到的响应路径会改变。
  - Mitigation: 保留相同按钮文案，直接跳转并自动发消息，减少交互差异。

## Migration Plan

1. 保留 evaluation 面板按钮和 i18n key。
2. 用 chat handoff 替换按钮点击逻辑。
3. 删除一键润色专属 API、AI 逻辑和相关测试。
4. 移除产品 UI 中针对 `fullOptimize` 的展示与断言。
5. 保持数据库字段不变，避免本次发布涉及订阅数据迁移。
