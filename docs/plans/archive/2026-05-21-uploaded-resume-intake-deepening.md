# Uploaded Resume intake Module Deepening

> **已完成** — 归档日期：2026-05-22
>
> **实际落地要点：**
> - 上传主链路已收敛为 `server/intake/orchestrator.ts`，统一拥有 `extract -> parse -> upload -> persist -> evaluate` 编排、commit point、cancellation 与 terminal event 语义。
> - `app/api/resume/upload-and-analyze/route.ts` 已缩窄为 HTTP/SSE adapter；请求级校验前移到 route，route 不再持有私有大编排函数，也不再依赖旧全局 writer manager。
> - rollback、persist、quota 已拆为共享能力：`server/intake/rollback.ts`、`server/intake/persist.ts`、`server/intake/quota.ts`；旧 `server/rollback.ts` 与 `server/sse/writer-manager.ts` 已删除。
> - 前端 `components/client-components/new-resume-card.tsx` 已切到新 SSE 协议，仅在 `intake.done` 跳转，并按 `intakeId` 过滤事件。
> - 补齐了定向回归：`server/intake/orchestrator.test.ts`、`server/intake/rollback.test.ts`、`app/api/resume/upload-and-analyze/route.test.ts`、`components/client-components/__tests__/new-resume-card.test.tsx`、`components/resumes/__tests__/resume-right-panel.test.tsx`、`test/e2e/dashboard.spec.ts`。
>
> **与计划的差异：**
> - `jobInfo` schema 最终抽到 `lib/job-info-form-schema.ts`，由 route、dashboard 上传表单、JD 编辑页共享，避免服务端从 `"use client"` 组件文件导 schema。
> - PDF 校验比原计划更稳健：除 `application/pdf` 外，也接受浏览器省略 MIME 或回落为 `application/octet-stream` 但文件后缀为 `.pdf` 的上传。
> - `rollback.done` 最终补充了 `allSucceeded` 与 `failureCount`，用于表达回滚质量；前端仍保持静默，不把该内部结果映射为 UI。

**Date:** 2026-05-21

## 背景

当前 `Uploaded Resume` 主链路由 `app/api/resume/upload-and-analyze/route.ts` 直接编排：

- 解析请求与表单
- 校验文件
- quota 检查与 token 消费
- PDF 文本抽取
- `Application Resume` parse
- 上传原始 PDF
- 创建 `Job Description` / `Application Resume` / `Job Application`
- 生成 `Evaluation Report`
- SSE 步骤事件发送
- 失败回滚

这让 route 的 Interface 很薄，但 Implementation 很重。当前复杂度不是 `processFile()` 这个函数名的问题，而是缺少一个真正拥有取消、补偿、事件、提交语义的 intake orchestration Module。

相关上下文：

- `CONTEXT.md`
- `docs/app-architecture.md`
- `docs/web-structure.md`
- `docs/plans/current/2026-05-20-ai-subsystem-defect-fixes.md`

## 目标

- 将 `Uploaded Resume` → `Application Resume` 的主链路收敛为一个深 Module
- 将 HTTP/SSE Adapter 与领域流程编排分离
- 明确取消、提交、回滚、计费、终态语义
- 将步骤事件升级为稳定 contract，而不是 UI 偶然约定
- 为后续 OCR、异步评估、重试、观测埋点预留稳定 seam

## 非目标

- 不改变当前上传入口 URL：`/api/resume/upload-and-analyze`
- 不引入完整后台任务系统或重连恢复机制
- 不把 `Uploaded Resume` 升级成独立持久化实体
- 不重做 `Evaluation Report` 结构
- 不要求本轮解决 `Job Application` limit 的严格并发语义

## 代码现状

| 文件 | 当前职责 |
|---|---|
| `app/api/resume/upload-and-analyze/route.ts` | intake 主编排、SSE、步骤推进 |
| `components/client-components/new-resume-card.tsx` | 发起上传、消费 SSE、跳转 application |
| `server/ai/tools.ts` | PDF 文本抽取 |
| `server/ai/resume-parser.ts` | resume text → `Application Resume` parse |
| `server/resume.ts` | 上传文件、创建 `Application Resume` / `Job Application` |
| `server/evaluation.ts` | 生成并保存 `Evaluation Report` |
| `server/quota.ts` | token quota 与临时 job application 限制 |
| `server/rollback.ts` | 失败回滚上下文 |
| `server/sse/writer-manager.ts` | SSE writer 注册与发送 |

## 当前主要问题

- route 持有大部分领域编排语义
- `request.signal.onabort` 只关闭 SSE writer，不等于真正取消 intake
- SSE payload 是脆弱的 UI 约定，缺少正式事件 contract
- 失败与取消没有清晰区分
- quota 语义与主流程耦合过深，且无法表达“一次准入、整次完成、软上限”
- rollback 依赖隐式 `AsyncLocalStorage`，模块边界不清
- `server/sse/writer-manager.ts` 使用进程内全局 writer 状态，不适合作为长期边界
- 当前上传顺序为 `upload -> load -> parse -> prepare -> evaluate`，但 `upload` 实际并不是 parse 前置条件

## 已确认决策

### 1. 分层

- route 只保留 HTTP/SSE Adapter 职责
- route 中不再保留任何拥有领域编排语义的私有大函数
- 新增独立 `UploadedResumeIntakeOrchestrator`
- `Create Empty Resume` 不复用整条 uploaded intake orchestration
- `Create Empty Resume` 与 uploaded intake 共享底层 `persist` / rollback / quota capability，而不是共享一个带大量分支的总 orchestrator

### 2. 运行时与上下文

- `runtime = "nodejs"` 只是执行环境，不应定义领域边界
- orchestration 不依赖 `NextRequest`、SSE writer、`TransformStream`
- 不再依赖 `AsyncLocalStorage` 传递 rollback 上下文
- 改为显式 `IntakeContext` 参数传递：
  - `actor`
  - `emit(event)`
  - `cancellation`
  - `rollbackRegistry`
  - 其他运行期依赖

### 3. 上传链路真实步骤顺序

主链路改为：

1. `extract`
2. `parse`
3. `upload`
4. `persist`
5. `evaluate`

说明：

- `upload` 延后到 `parse` 成功之后
- 前端进度也应反映真实执行顺序，不保留旧的假顺序
- `upload` 保持为独立步骤，不并入 `persist`
- `persist` 对外只暴露一个步骤，不拆成多个前端可见步骤

### 4. 提交点与终态

- 只有 `evaluate` 成功保存 `Evaluation Report` 后才算提交成功
- commit point 是服务端本地事实，不依赖 SSE 是否成功送达
- commit point 之后不再接受取消，不再 rollback
- 一次 intake 必须且只能有一个 terminal event：
  - `intake.done`
  - `intake.failed`
  - `intake.cancelled`
- `step.failed` 可以出现，但不是 terminal

### 5. 取消语义

- 刷新页面、离开页面、显式关闭弹窗、连接断开、SSE writer 写失败，均视为 cancellation request 来源
- cancellation source 只在 commit point 前有效
- 用户取消后：
  - 已创建数据要 rollback
  - 已发生计费不回滚
- 用户不需要看到 rollback 过程
- 前端区分 `cancelled` 与 `failed`：
  - `cancelled` 静默结束或轻量处理
  - `failed` 才是错误提示
- 关闭弹窗时前端应显式 abort 当前请求，且不等待服务端回执后再关闭 UI
- 前端允许用户在取消旧请求后立即发起新请求

### 6. 事件协议

不再使用旧的 `{ step, status }` payload；前后端一次切到新协议，不保留兼容层。

#### 事件类型

- `intake.start`
- `step.start`
- `step.done`
- `step.failed`
- `rollback.start`
- `rollback.done`
- `intake.done`
- `intake.failed`
- `intake.cancelled`

#### 公共规则

- 所有 SSE 事件都带 `intakeId`
- `intakeId` 使用 `nanoid`
- `intake.start` 必须是第一条事件
- 除 `intake.done` 外，步骤事件 payload 保持极瘦，不附带中间业务数据
- 前端按 `intakeId` 过滤事件，只处理当前活跃 intake
- `rollback.done` 可带内部结果质量信息，但不映射到前端 UI

#### 步骤枚举

- `extract`
- `parse`
- `upload`
- `persist`
- `evaluate`

#### 结果事件

- `intake.done` 只携带最小导航字段：
  - `intakeId`
  - `applicationId`
  - `resumeId`
- 不再把导航结果塞进 `step.done({ step: "evaluate" })`

### 7. route 输入校验边界

同一个接口支持两种响应形态：

- 输入错误：HTTP `4xx JSON`
- 成功进入 intake：HTTP `200 SSE`

route 负责在建立 SSE 之前完成全部 request-level 校验：

- multipart 解析
- `file` 必填
- `file.type === "application/pdf"`
- `jobInfo` 可解析
- `jobInfo` 通过共享 schema 语义校验
- 认证与 actor 构造

只有通过这些校验后，才开始建立 SSE 并调用 orchestrator。

### 8. quota 语义

`Job Application` limit 不属于本轮核心契约：

- 若当前实现仍保留，可继续作为 route 外围 guard
- 不进入 intake 核心设计

token quota 设计为独立共享 capability，而不是 intake 私有逻辑：

- 独立模块，不与 orchestration 深耦合
- 其他模块后续也可复用

接口方向：

- `authorizeUsage(actor, scope)`
- `recordAuthorizedUsage(authorization, usage)`

确认语义：

- 不做预留额度
- intake 开始前只检查“当前是否还有资格开始”
- 使用软上限：本次调用允许打穿额度
- 一次准入后，整次 intake 允许完成
- 若本次 parse 或未来 evaluate 已产生 usage，则必须记账
- 已发生计费不回滚

### 9. rollback 语义

rollback 抽成通用共享 capability，不绑定当前流程。

要求：

- 显式 registry / executor，不使用全局隐式上下文
- rollback action 必须幂等
- rollback action 注册时必须带结构化 `kind/label`
- rollback 按实际成功副作用细粒度注册，逆序执行
- rollback 内建重试机制
- 策略可配置，本轮提供默认值：`3 次 + 轻量退避`
- `rollback.done` 应区分全部成功与部分失败，但仅用于内部观测/测试，不直接暴露给前端 UI

### 10. persist 共享能力

uploaded intake 与 empty creation 共享 `persist` 能力，但不共享整条 orchestration。

shared `persist`：

- 只接收标准化输入，不关心来源 flow 本身
- 输入保留领域语义字段，例如：
  - `actorId`
  - `jobInfo`
  - `resumeData`
  - `resumeLanguage`
  - `uploadedResumePublicUrl | null`
- 不把 `Uploaded Resume` 升级成独立持久化对象
- `uploadedResumePublicUrl` 保持明确命名，不压平成泛泛 `sourceFileUrl`
- 哪个模块产生副作用，哪个模块负责注册对应 rollback
- 返回领域化结果，而不是直接返回 Supabase row shape

### 11. evaluate 能力

- `evaluate` 对 orchestration 来说仍是“生成并保存评估报告”的单一能力
- 不拆成前端可见的两步
- `evaluate` 直接吃内存中的规范化数据和 `applicationResumeId`：
  - `applicationResumeId`
  - `parsedResumeData`
  - `jobDescription`
- 不依赖持久化返回的整块 DB row 快照

### 12. 错误模型

错误从 orchestration 层开始结构化，不依赖 `Error.message` 文本分支。

至少包含：

- `code`
- `userMessage`
- `diagnostic/details`（仅内部）

前端可按 `code` 做 i18n 覆盖；服务端提供默认 `userMessage` 作为 fallback。

取消终态也带轻量默认文案，采用中性系统态语气，例如：

- `The upload was cancelled before completion.`

### 13. SSE adapter

- 不再保留 `server/sse/writer-manager.ts` 这种全局 writer 注册表模式
- 每个请求内直接把 `emit(event)` 绑定到当前 response writer
- `emit` 失败在 commit point 前触发 cancellation source
- `emit` 失败在 commit point 后仅视为 transport delivery failure，不改变领域结果，但需要记录可观测性事件

## 目标模块形状

### 1. route adapter

`app/api/resume/upload-and-analyze/route.ts` 负责：

- 认证
- 解析 multipart/form-data
- 校验 `file` 与 `jobInfo`
- 构造标准化 input：
  - `actor`
  - `jobInfo`
  - `file`
- 创建 `intakeId`
- 创建 request-scoped cancellation source
- 建立 SSE stream
- 将 orchestrator 事件映射为 SSE payload
- 将结果 union 映射为最终 SSE terminal event 与连接关闭

route 不再负责：

- PDF 文本抽取
- resume parse
- token 记账编排
- DB 持久化编排
- rollback 顺序控制
- 领域终态判定

### 2. UploadedResumeIntakeOrchestrator

建议接口方向：

```ts
runUploadedResumeIntake(input, context) => Promise<
  | { status: "done"; intakeId: string; applicationId: string; resumeId: string }
  | { status: "cancelled"; intakeId: string; reason: IntakeError }
  | { status: "failed"; intakeId: string; error: IntakeError }
>
```

说明：

- 结果返回显式 union，不把取消/失败都混成 throw
- 事件通过 `context.emit(event)` 推送
- 所有主步骤都必须经过统一 helper 执行

### 3. 主步骤 helper

所有主步骤统一经由 helper 执行，职责固定为：

- 发 `step.start`
- 检查取消
- 执行步骤
- 检查取消
- 发 `step.done`
- 捕获并包装步骤错误为 `step.failed`
- 返回步骤产物供后续步骤消费

不做通用 pipeline 框架；保留线性大流程即可。

## 设计后的主流程

### Uploaded Resume intake

1. `intake.start`
2. `extract`
   - PDF 文本抽取
   - 若为空文本，失败
3. `parse`
   - 解析为规范化 `Application Resume`
   - 记账按一次准入、实际 usage 事后记录
4. `upload`
   - 上传原始 PDF 到 storage
5. `persist`
   - 创建 `Job Description`
   - 创建 `Application Resume`
   - 创建 `Job Application`
   - 每个成功副作用注册 rollback
6. `evaluate`
   - 生成并保存 `Evaluation Report`
7. 服务端本地标记 committed
8. `intake.done`

### Empty Resume creation

独立 orchestrator，只复用 shared `persist` / rollback / quota capability：

1. 标准化输入
2. `persist`
3. 返回结果

不包含：

- `extract`
- `parse`
- `upload`
- `evaluate`

## 取消与失败时序

### commit 前取消

固定顺序：

1. 识别 cancellation
2. `rollback.start`
3. rollback 执行与重试
4. `rollback.done`
5. `intake.cancelled`

### commit 前失败

固定顺序：

1. `step.failed`
2. `rollback.start`
3. rollback 执行与重试
4. `rollback.done`
5. `intake.failed`

### commit 后 transport 失败

- 不触发 rollback
- 不改写领域终态
- 只记可观测性事件

## 迁移原则

- 不保留旧 SSE payload 兼容层
- 前后端一起切换到新事件协议
- route 测试从“全流程测试”下沉为 adapter 测试
- orchestrator 成为主测试对象
- `docs/web-structure.md` 同步更新真实步骤顺序与终态语义

## 任务清单

### Phase 1: 明确共享基础设施边界

- [x] 定义 `IntakeContext`
- [x] 定义通用 error model
- [x] 定义通用 event model
- [x] 定义通用 rollback capability
- [x] 定义通用 usage authorization/accounting capability

### Phase 2: 提炼共享能力

- [x] 抽出 shared `persist` module
- [x] shared `persist` 返回领域化结果
- [x] 将 rollback 注册责任下沉到副作用产生模块
- [x] 去除 `AsyncLocalStorage` 依赖

### Phase 3: 实现 Uploaded Resume intake orchestration

- [x] 新建 `UploadedResumeIntakeOrchestrator`
- [x] 实现统一 step helper
- [x] 接入 `extract -> parse -> upload -> persist -> evaluate`
- [x] 实现 commit point / terminal 语义
- [x] 实现 cancellation source 与 checkpoint

### Phase 4: 缩窄 route 职责

- [x] `upload-and-analyze/route.ts` 只保留 adapter 职责
- [x] request-level 校验全部前移到 route
- [x] 移除 route 私有大编排函数
- [x] 移除全局 writer manager 依赖

### Phase 5: 前端协议切换

- [x] `new-resume-card.tsx` 切换到新 SSE 事件协议
- [x] 以 `intake.start` 建立 active `intakeId`
- [x] 按 `intakeId` 过滤事件
- [x] 仅在 `intake.done` 时跳转
- [x] `failed` 与 `cancelled` 区分处理

### Phase 6: 文档与回归

- [x] 更新 `docs/web-structure.md`
- [x] 如需更新开发约束，同步补充相关 `docs/*.md`
- [x] 完成上传主流程 UI 回归 (Playwright 定向 happy path)

## 测试计划

### Orchestrator 测试

重点断言三类 contract：

- 返回结果 union
- 事件序列
- rollback 调用顺序与结果

覆盖：

- [x] 成功链路：`intake.start -> step.* -> intake.done`
- [x] PDF 抽取为空失败
- [x] parse 失败
- [x] upload 失败
- [x] persist 失败
- [x] evaluate 失败
- [x] commit 前取消触发 rollback 与 `intake.cancelled`
- [x] parse 完成后取消：记账保留、数据 rollback
- [x] commit 后 disconnect：数据保留，记录 transport delivery failure
- [x] terminal event 恰好一个

### Route adapter 测试

只覆盖 adapter 责任：

- [x] 缺少文件返回 `4xx JSON`
- [x] 非 PDF 返回 `4xx JSON`
- [x] `jobInfo` 非法 JSON 返回 `4xx JSON`
- [x] `jobInfo` schema 不合法返回 `4xx JSON`
- [x] SSE headers 正确
- [x] request input 正确映射到 orchestrator
- [x] orchestrator 事件正确映射为 SSE payload

### 前端状态机测试

- [x] `intake.start` 建立 active `intakeId`
- [x] 非当前 `intakeId` 事件被忽略
- [x] `intake.done` 才跳转 `/application/[applicationId]`
- [x] `intake.failed` 显示错误
- [x] `intake.cancelled` 静默结束
- [x] 关闭弹窗时显式 abort

### UI / E2E 回归

- [x] Dashboard 上传 PDF 分支正常工作
- [x] 中文/英文 PDF 均可创建 `Application Resume`
- [x] 成功后跳转 `/application/[applicationId]`
- [x] 首次进入 resume 页时已能看到当前 `Evaluation Report`
- [x] 关闭弹窗或刷新页面后不会留下未提交脏数据

## 验收标准

- 上传主链路的领域编排由一个统一 orchestration Module 拥有
- route 只保留 HTTP/SSE Adapter 职责
- 取消、失败、提交、回滚、计费语义均有明确 contract
- SSE 事件协议稳定，前端不再依赖旧 `{ step, status }` payload
- rollback、quota、persist 都以共享能力形式存在，而不是 route 私有实现细节
- `processFile()` 类型的 route 私有大编排函数彻底消失
- 后续新增 OCR、异步评估、重试时，不需要继续向 route 堆积实现细节
