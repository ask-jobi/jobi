# Uploaded Resume Intake

**归档日期:** 2026-05-22
**来源计划:** docs/plans/archive/2026-05-21-uploaded-resume-intake-deepening.md

## 实现了什么

上传 PDF 创建 `Application Resume` 的主链路已经从 route 内的大编排收口为独立 intake module。当前实现把 request 校验、SSE 适配、领域编排、rollback、persist、quota 分开，并以稳定的 SSE 事件协议驱动前端上传状态机。

## 关键文件

| 文件 | 职责 |
|---|---|
| `app/api/resume/upload-and-analyze/route.ts` | HTTP/SSE adapter；鉴权、multipart 解析、PDF 与 `jobInfo` 校验、SSE stream 建立、请求取消接线 |
| `server/intake/orchestrator.ts` | 上传主编排；执行 `extract -> parse -> upload -> persist -> evaluate`，并拥有 commit / cancellation / terminal 语义 |
| `server/intake/types.ts` | intake event union、result union、rollback / cancellation / persist contract |
| `server/intake/persist.ts` | 共享持久化能力；创建 Job Description、Application Resume、Job Application 并注册回滚 |
| `server/intake/quota.ts` | token 使用准入与记账；采用“一次准入、整次完成、软上限”语义 |
| `server/intake/rollback.ts` | 显式 rollback registry；逆序执行、重试、回滚质量上报 |
| `server/intake/errors.ts` | 结构化错误码与用户可见错误消息 |
| `components/client-components/new-resume-card.tsx` | 发起上传、消费新 SSE 协议、按 `intakeId` 过滤、仅在 `intake.done` 导航 |
| `lib/job-info-form-schema.ts` | route、上传表单、JD 编辑页共享的 `jobInfo` schema |

## 关键行为

- 只有在 `evaluate` 成功保存 `Evaluation Report` 后，intake 才进入 commit point 并发出 `intake.done`。
- commit 前取消会执行 rollback，并以 `intake.cancelled` 结束；已发生的 token 使用不会回滚。
- commit 后即使 SSE 传输失败，领域结果仍保留；route 只记录 `resume_intake_sse_transport_failure`。
- 输入错误在建立 SSE 前直接返回 `4xx JSON`；只有通过校验后才返回 `200 text/event-stream`。
- 前端只处理当前活跃 `intakeId` 的事件；关闭弹窗、组件卸载、刷新页面都会 abort 当前请求，不会触发陈旧跳转。
- 上传成功首次进入 `/application/[applicationId]/resume` 时，页面可直接读取并显示当前 `Evaluation Report`。

## 数据 / 接口约定

- SSE 协议使用以下事件：`intake.start`、`step.start`、`step.done`、`step.failed`、`rollback.start`、`rollback.done`、`intake.done`、`intake.failed`、`intake.cancelled`。
- 所有 SSE 事件必须带 `intakeId`；前端以 `intakeId` 做相关性过滤。
- `step` 枚举固定为：`extract`、`parse`、`upload`、`persist`、`evaluate`。
- `intake.done` 只返回最小导航字段：`applicationId`、`resumeId`、`intakeId`。
- `jobInfo` 通过共享 zod schema 校验；PDF 校验接受标准 MIME，也接受无 MIME / `application/octet-stream` 但后缀为 `.pdf` 的文件。
- `rollback.done` 额外提供 `allSucceeded` 与 `failureCount`，用于内部质量观测，不映射为前端 UI。

## 测试覆盖

- `server/intake/orchestrator.test.ts`：成功链路、quota 拦截、step 失败、commit 前取消、commit 后语义、terminal event 唯一性。
- `server/intake/rollback.test.ts`：rollback 生命周期事件与部分失败质量上报。
- `app/api/resume/upload-and-analyze/route.test.ts`：鉴权、输入校验、SSE header、Unicode multipart、post-commit 传输失败记录。
- `components/client-components/__tests__/new-resume-card.test.tsx`：active `intakeId` 过滤、错误展示、取消静默结束、关闭弹窗/卸载 abort。
- `components/resumes/__tests__/resume-right-panel.test.tsx`：首次进入 resume 页时显示已有 `Evaluation Report`。
- `test/e2e/dashboard.spec.ts`：dashboard 上传 happy path、English/Chinese PDF、关闭弹窗/刷新页面取消场景、JSON 错误展示。

## 与计划的差异

- `jobInfo` schema 抽离为共享模块，而不是继续从表单组件导出。
- PDF 校验比计划文字更宽松，以兼容真实浏览器上传行为。
- rollback 结果最终包含质量字段，便于观察部分回滚失败。

## 未完成 / 后续

- 当前未引入后台任务、断线重连恢复或异步评估队列。
- OCR、重试、异步评估等后续能力应继续沿用当前 orchestrator seam 扩展，而不是回到 route 中堆积实现细节。
