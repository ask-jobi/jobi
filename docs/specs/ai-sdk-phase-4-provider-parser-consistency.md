# AI SDK Phase 4: Provider / Parser Consistency Cleanup

**归档日期:** 2026-06-01
**来源计划:** docs/plans/archive/2026-05-23-ai-sdk-phase-4-provider-parser-consistency.md

## 实现了什么

对齐 provider 与 parser 实现及文档。原 gateway-first 策略后续已被 Cloudflare 迁移替换为 direct DeepSeek provider；parser 中虚假 fallback 叙述与死代码已移除。provider token usage 后续已从产品数据模型与请求链路移除。

## 关键文件

| 文件 | 职责 |
|---|---|
| `server/ai/model.ts` | direct DeepSeek provider 模型选择：`DEEPSEEK_MODEL_ID` 默认 `deepseek-v4-flash` |
| `server/ai/resume-parser.ts` | 移除 `collectErrorMessages` 死代码、`NoObjectGeneratedError` 无用导入、误导性 fallback 日志 |
| `server/ai/resume-parser.test.ts` | 对齐新 warning 格式（单一错误 message 而非嵌套 messages 数组） |
| `.env.example` | 已含 `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL_ID` 说明 |

## 关键行为

- **模型选择**: direct DeepSeek provider，默认 `deepseek-v4-flash`，可用 `DEEPSEEK_MODEL_ID` 覆盖
- **Parser 错误**: 结构化解失败 → `console.warn("Structured resume parsing failed", errorMessage)` → `throw error`

## 数据 / 接口约定

- `DEEPSEEK_API_KEY` 由 direct DeepSeek provider 使用
- `DEEPSEEK_MODEL_ID` 控制模型 id，默认 `deepseek-v4-flash`
- `@ai-sdk/devtools` 在所有非 production 环境默认启用

## 与计划的差异

无重大偏差。`server/ai/parse-json-from-model-text.ts` 作为连带死代码一并移除。

## 未完成 / 后续

无。AI SDK 四个 Phase 计划已全部完成。
