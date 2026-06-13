# Evaluation Report lifecycle Module Deepening

**Date:** 2026-05-21

## 背景

`CONTEXT.md` 已明确：只保留当前 `Evaluation Report`；当 `Application Resume` 或 `Job Description` 变化时，当前 `Evaluation Report` 会失效。

但当前相关规则分散在多个浅 Module 中：

- `server/resume.ts` 负责置 `evaluation_report_refresh_flag`
- `server/evaluation.ts` 负责生成并清除脏状态
- `lib/store/resume.ts` 在前端重复维护同一语义
- `components/resumes/resume-right-panel.tsx` 负责刷新入口
- `components/client-components/evaluation-report.tsx` 还承担了切到 `AI Chat` 的 handoff

此外，`Evaluation Report.actions.targetSection` 仍使用 `work_experience`，而 `Application Resume` 的 canonical term 是 `employment`，使 report → chat/edit 的 Seam 变成隐式映射。

相关上下文：

- `CONTEXT.md`
- `docs/app-architecture.md`
- `docs/plans/current/2026-05-20-ai-subsystem-defect-fixes.md`

## 目标

- 收敛 `Evaluation Report` 的 current report / dirty state / regenerate / handoff 语义
- 让 `Application Resume`、`Job Description`、右侧面板、`AI Chat` 共享统一 lifecycle Interface
- 消除 `targetSection` 等术语映射上的隐式 contract
- 提高 `Evaluation Report` 的 Locality 与可测试性

## 非目标

- 本计划不重写当前评估 prompt 业务逻辑
- 本计划不在本轮重做 `Suggestion` 领域建模
- 本计划不把评估能力改成后台异步任务
- 本计划不顺带重构整个右侧面板 UI

## 代码现状

| 文件 | 当前职责 |
|---|---|
| `server/evaluation.ts` | 生成并保存 `Evaluation Report` |
| `app/api/evaluation/route.ts` | 评估刷新入口 |
| `server/resume.ts` | `Application Resume` / `Job Description` 变化时置脏 |
| `lib/store/resume.ts` | 前端维护 report 与 refresh flag |
| `components/resumes/resume-right-panel.tsx` | Evaluation tab 刷新入口 |
| `components/client-components/evaluation-report.tsx` | report 展示与 AI Chat handoff |
| `types/evaluation.d.ts` | `Evaluation Report` 输出类型 |

## 已确认决策

- 当前产品只关心当前 `Evaluation Report`，不保留历史 report
- `Evaluation Report` 不是 `Application Resume` 的一部分，而是派生分析结果
- `Evaluation Report` 与 `Chat Session` 的交互应通过明确 Interface 表达，而不是在 UI 中隐式拼接

## 建议方案

### 1. 提炼统一 lifecycle Module

由该 Module 统一拥有：

- 当前 `Evaluation Report`
- dirty / refresh 状态
- invalidate 规则
- regenerate / persist 规则
- 到 `Chat Session` 的 handoff 语义

### 2. 收口 invalidate 规则

显式定义：

- 哪些 `Application Resume` 变化会使 report 失效
- 哪些 `Job Description` 变化会使 report 失效
- 何时清脏、何时保留旧 report 供只读展示

### 3. 消除 report ↔ resume 的术语裂缝

统一 `Evaluation Report.actions.targetSection` 与 `Application Resume` 的 canonical section term，避免 `work_experience` / `employment` 这种跨 Module 隐式映射继续扩大。

## 任务清单

### Phase 1: 盘点 lifecycle 与术语映射

- [ ] 盘点 report 生成、置脏、刷新、展示、chat handoff 的完整链路
- [ ] 列出所有 `evaluation_report_refresh_flag` 的读写点
- [ ] 列出 `targetSection` 与 `Application Resume` section term 的映射点

### Phase 2: 提炼 lifecycle Module

- [ ] 新建统一 `Evaluation Report` lifecycle Module
- [ ] 收口 current report / dirty state / regenerate Interface
- [ ] 收口 invalidate 规则
- [ ] 收口 chat handoff 语义

### Phase 3: 调整调用方

- [ ] `server/resume.ts` 改为调用统一 invalidate Interface
- [ ] `app/api/evaluation/route.ts` 改为调用统一 regenerate Interface
- [ ] `lib/store/resume.ts` 改为消费统一 lifecycle 结果，而非重复实现规则
- [ ] `evaluation-report.tsx` 改为使用显式 handoff Interface
- [ ] 对齐 `targetSection` 术语

### Phase 4: 测试与回归

- [ ] 覆盖 `Application Resume` 修改后 report 置脏
- [ ] 覆盖 `Job Description` 修改后 report 置脏
- [ ] 覆盖刷新后清脏并保存当前 report
- [ ] 覆盖 Evaluation → AI Chat handoff
- [ ] 覆盖 section term 对齐后的展示与消费

## 测试计划

### 单元 / 组件测试

- [ ] report invalidate 规则测试
- [ ] regenerate 后 dirty state 清除
- [ ] `targetSection` 与 `Application Resume` section term 一致
- [ ] `Evaluation Report` 到 `Chat Session` handoff 消息稳定

### 回归检查

- [ ] `/application/[id]/resume` 中 Evaluation tab 可正常查看与刷新
- [ ] 修改 `Application Resume` 后刷新标记正确
- [ ] 修改 `Job Description` 后回到 resume 页能正确重新评估
- [ ] 点击一键优化后正常切换到 `AI Chat`

## 风险

- report lifecycle 横跨 server、client store、UI handoff，重构时容易保留双写逻辑
- 术语对齐若不处理历史类型与翻译文案，容易造成展示回归
- 若 dirty state 仍在前后端重复推导，deepening 效果会被削弱

## 验收标准

- `Evaluation Report` 的 current / dirty / regenerate / handoff 由统一 Module 拥有
- `Application Resume` 与 `Job Description` 的 invalidate 规则不再分散在多处重复实现
- `targetSection` 等关键术语与 canonical domain language 对齐
- Evaluation tab、刷新链路、AI Chat handoff 回归通过
