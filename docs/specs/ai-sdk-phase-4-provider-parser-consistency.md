# AI SDK Phase 4: Provider / Parser Consistency Cleanup

**归档日期:** 2026-06-01
**来源计划:** docs/plans/archive/2026-05-23-ai-sdk-phase-4-provider-parser-consistency.md

## 实现了什么

对齐 provider、parser、token usage 三者实现与文档的真实一致性。gateway-first 策略落实到代码中，移除 parser 中虚假 fallback 叙述与死代码，token 统计信任 provider 总量。

## 关键文件

| 文件 | 职责 |
|---|---|
| `server/ai/model.ts` | Gateway-first 模型选择：`AI_GATEWAY_API_KEY` 存在时走 gateway，否则回退直连 |
| `server/ai/resume-parser.ts` | 移除 `collectErrorMessages` 死代码、`NoObjectGeneratedError` 无用导入、误导性 fallback 日志 |
| `lib/agent/token-usage.ts` | `totalTokens` 直接信任 provider 总量，不再自算 fallback |
| `server/token-usage.test.ts` | 对齐新口径：totalTokens 缺失时返回 0 |
| `server/ai/resume-parser.test.ts` | 对齐新 warning 格式（单一错误 message 而非嵌套 messages 数组） |
| `.env.example` | 已含 `AI_GATEWAY_API_KEY` 说明 |

## 关键行为

- **模型选择**: `AI_GATEWAY_API_KEY` → `gateway("deepseek/deepseek-v4-flash")`；未设且生产环境 → warning + 直连 fallback
- **Parser 错误**: 结构化解失败 → `console.warn("Structured resume parsing failed", errorMessage)` → `throw error`
- **Token 总量**: `parseTokenUsage` 使用 `usage.totalTokens ?? 0`，不再自行计算
- **Reasoning 展示**: `reasoningTokens` 作为 `outputTokenDetails.reasoningTokens` 的 breakdown 单独记录，不计入总量

## 数据 / 接口约定

- `AI_GATEWAY_API_KEY` 环境变量控制 gateway 启用
- `@ai-sdk/gateway` 为直接依赖（v3.0.121+）
- `@ai-sdk/devtools` 在所有非 production 环境默认启用

## 与计划的差异

无重大偏差。`server/ai/parse-json-from-model-text.ts` 作为连带死代码一并移除。

## 未完成 / 后续

无。AI SDK 四个 Phase 计划已全部完成。
