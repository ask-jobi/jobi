# AI SDK Phase 4：Provider / Parser Consistency Cleanup

**Date:** 2026-05-23

> **已完成** — 完成日期：2026-06-01
>
> **实际落地要点：**
> - `server/ai/model.ts`：启用 gateway-first 策略，`AI_GATEWAY_API_KEY` 存在时使用 `gateway("deepseek/deepseek-v4-flash")`，否则回退到直连 deepseek provider 并输出 warning
> - `@ai-sdk/gateway` 新增为直接依赖
> - `.env.example` 已包含 `AI_GATEWAY_API_KEY` 说明
> - `server/ai/resume-parser.ts`：删除 `collectErrorMessages` 死代码，移除 `NoObjectGeneratedError` 无用导入，将误导性 "falling back to text parsing" 日志修正为如实记录
> - `server/ai/parse-json-from-model-text.ts` 及其测试文件删除（无生产消费者）
> - `lib/agent/token-usage.ts`：`totalTokens` 直接信任 provider/AI SDK 总量，移除自算 fallback
> - 测试：token-usage.test.ts 对齐新口径，resume-parser.test.ts 对齐新 warning 格式
> - Tests: 94 files / 495 tests pass (1 pre-existing flaky test in upload-and-analyze)

## 背景

在前 3 个阶段完成后，应用应该已经能在新的 chat authority 与 revision/snapshot 链路上正常运行。剩余问题主要是“实现与文档的真相一致性”：

- provider/gateway 策略与代码现状可能不一致
- parser 对 fallback 的叙述与真实行为不一致
- token usage 口径需要与 AI SDK 语义一致

这些问题不应阻塞前 3 个可运行阶段，但应该单独收口，避免继续积累实现/文档漂移。

## 目标

- 让 gateway-first 策略在代码与文档中一致
- 移除 `resume-parser` 中虚假的 fallback 叙述与死代码
- 修正 token usage 总量与 reasoning breakdown 的口径
- 保持应用在本阶段完成后行为稳定、可正常运行

## 非目标

- 本阶段不更换 LLM provider
- 本阶段不引入 approval flow
- 本阶段不修改 `rewrite-entry`
- 本阶段不处理事务/RPC

## 已确认决策

- provider 正式路径为 gateway-first
- 手改 `model.ts` 直连 provider 仅视为临时本地调试手段，不纳入正式契约
- `@ai-sdk/devtools` 在所有非 production 环境默认启用
- `resume-parser` 删除 fallback 叙述与死代码，只保留结构化解析真实路径
- reasoning parts 先保留现状，只修正 token 统计口径

## 相关计划

- 前置阶段：`docs/plans/current/2026-05-23-ai-sdk-phase-3-chat-contract-boundary-cleanup.md`
- 总览：`docs/plans/current/2026-05-23-ai-sdk-integration-deepening.md`

## 建议方案

### 1. 先统一 provider 真相

- 文档只承认 gateway-first
- 代码路径与 `.env.example` 按正式路径一致
- 自动化测试只覆盖 gateway-first 正式路径

### 2. 再清理 parser/token 口径漂移

- 删除 parser 中“会 fallback”的错误叙述与废弃代码
- `totalTokens` 直接信 provider/AI SDK 总量
- `reasoningTokens` 只作为 breakdown 展示，不再二次累加

## 任务清单

### Phase 4A: provider 一致性

- [x] 对齐 `lib/agent/model.ts` / `server/ai/model.ts` 与 gateway-first 策略
- [x] 更新 `.env.example` 与相关说明文档
- [x] 确保自动化测试只覆盖 gateway-first 正式路径

### Phase 4B: parser / token 清理

- [x] 删除 `resume-parser` 中虚假的 fallback 叙述
- [x] 删除不再使用的 fallback / dead code
- [x] 修正 token usage 总量统计口径
- [x] 保留 reasoning parts 展示，但不再重复累计 reasoning token

## 测试计划

### 单元 / 组件测试

- [x] gateway-first 配置选择测试
- [x] `resume-parser` 仅保留结构化解析路径的测试
- [x] token usage 总量与 reasoning breakdown 口径测试

### 回归检查

- [x] gateway-first 正式路径可正常生成 AI 响应
- [x] reasoning 展示仍可见，但总 token 统计不再失真

## 验收标准

- provider / env / devtools 策略在文档与代码中一致
- `resume-parser` 不再存在“声称 fallback、实际没有”的漂移
- token usage 总量与 reasoning breakdown 的口径已与 AI SDK 语义对齐
- 应用在本阶段完成后仍可正常运行
