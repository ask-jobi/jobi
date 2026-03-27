# Change: Remove one-click resume optimization flow

## Why
当前“`一键润色简历`”按钮会触发独立的全量润色链路：调用 `/api/resume/ops-from-evaluation`，生成并预览一组 resume edit ops，再由用户逐条应用到表单。这个能力与现有 resume chat 的能力重叠，并且维护了单独的前端状态、后端 API、AI 生成链路和 `fullOptimize` 次数配额。

产品方向已经调整为统一通过 Chat 完成简历优化，因此需要移除这条一键式执行链路，但保留用户熟悉的按钮入口，改为把用户带到 Chat 并自动发出一条优化请求消息。

## What Changes
- 保留 evaluation 面板中的“`一键润色简历`”按钮，但点击后不再请求 `/api/resume/ops-from-evaluation`
- 点击按钮后自动切换到 Chat 面板，并向当前 resume 的 canonical chat session 发送一条预置消息，让 Agent 开始优化简历
- 移除一键润色专属的前端预览与逐条 apply/undo/skip 交互
- 移除一键润色专属的后端执行链路，包括 `ops-from-evaluation` API、相关 AI 生成逻辑及其测试
- 从产品 UI 中移除仅服务于该能力的 `fullOptimize` 次数展示，避免保留已经不可触发的配额说明
- **BREAKING**: “一键润色简历”从同步生成本地 edit ops 的流程，改为进入 chat 对话流程；后续消耗 chat token 配额，而不是 `fullOptimize` 次数配额

## Impact
- Affected specs: `resume-chat`
- Affected code:
  - `components/client-components/evaluation-report.tsx`
  - `components/resumes/resume-right-panel.tsx`
  - `components/agent/chat-interface.tsx`
  - `lib/store/resume.ts`
  - `lib/store/chat.ts`
  - `app/api/resume/ops-from-evaluation/route.ts`
  - `server/ai/resume-ops-from-eval.ts`
  - `lib/resume/agent-ops.ts`
  - `server/quota.ts`
  - subscription/quota display components and tests
