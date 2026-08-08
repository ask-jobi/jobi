# Playwright E2E Coverage Expansion

> 2026-08-05 更新：E2E 数据基础已迁移为本地 D1/SQLite，global setup 会应用 D1
> migrations；identity 回归验证签名 workspace cookie，不再启动或检查本地 Supabase。

> 2026-07-31 更新：landing、账号登录、pricing、payment 与 token UI 已从产品中移除，
> 本计划中对应 spec、setup 和登录前后分支不再执行。认证类覆盖改为“自动建立匿名
> workspace session + 跨 browser context ownership 隔离”，详见
> `2026-07-31-open-source-loginless-cleanup.md`。

**Date:** 2026-05-23

## 背景

当前仓库已有 Playwright E2E 基础设施与少量主流程覆盖：

- `playwright.config.ts` 已配置 `setup`、`chromium`、`chromium-no-auth`
- `test/e2e/global-setup.ts` 已在启动前检查本地 Supabase health
- `test/e2e/dashboard.spec.ts` 已覆盖 Dashboard 基础布局、`Create New Resume` 弹窗、上传主流程、已有卡片跳转
- `test/e2e/chat.spec.ts` 已覆盖 Chat 的基础打开与未登录重定向

但从 `docs/web-structure.md` 描述的真实业务路径看，当前 E2E 覆盖仍明显偏窄，尚未系统覆盖以下高价值路径：

- 认证主链路与 callback 回跳
- `Create Empty Resume` 分支与 Dashboard 删除流
- `Job Application` 工作区的 resume / job description 导航
- `Job Description` 保存与 `Evaluation Report` 联动
- `Settings` 的 `UI Language` 切换
- `Pricing` 登录前后分支
- `Application Resume` 编辑主链路
- 导出 / 打印入口

如果继续只依赖少量冒烟用例，容易出现以下问题：

- 公开页、认证页、定价页的导航分支回归无法及时发现
- `Job Application` 工作区内部的 tab、保存、导出、评估联动没有稳定保护
- `Application Resume` 编辑行为与 `Chat Session` / `Evaluation Report` 的关键链路缺少端到端保障

相关文档：

- `docs/web-structure.md`
- `docs/testing-and-i18n.md`
- `docs/app-architecture.md`
- `CONTEXT.md`

## 目标

- 盘点当前仍缺失的高价值 E2E 覆盖面，并按业务域拆分为可实施的 Playwright spec
- 先补齐会直接影响用户主流程的 P0/P1 场景
- 明确哪些场景应走真实本地 API，哪些场景应在 E2E 中 mock 外部依赖
- 建立一套与当前领域语言一致的 E2E 覆盖清单，围绕 `Job Application`、`Application Resume`、`Job Description`、`Evaluation Report`、`Chat Session` 组织测试
- 为后续补测提供分阶段实施顺序，避免一次性扩张导致测试套件过慢或过脆

## 非目标

- 本计划不在本轮直接新增或修改 E2E 代码
- 本计划不把 Stripe 真支付、邮件确认、真实第三方 AI 结果正确性做成重 E2E
- 本计划不要求所有 UI 细节都通过 E2E 覆盖；复杂内容正确性仍应由 route / server / component tests 承担
- 本计划不在本轮调整 Playwright 基础架构之外的测试栈

## 代码现状

| 文件 | 当前职责 |
|---|---|
| `playwright.config.ts` | Playwright project、worker、webServer、globalSetup 配置 |
| `test/e2e/global-setup.ts` | 本地 Supabase health 检查 |
| `test/e2e/auth.setup.ts` | 预制登录态 |
| `test/e2e/dashboard.spec.ts` | Dashboard 与创建简历主流程的基础覆盖 |
| `test/e2e/chat.spec.ts` | Chat 基础打开与未登录重定向覆盖 |
| `docs/web-structure.md` | 页面结构、业务路径、回归重点 |
| `docs/testing-and-i18n.md` | E2E 使用约定与 i18n 回归要求 |

当前尚无按业务域拆分的 `auth` / `pricing` / `application-navigation` / `jd` / `settings` / `evaluation` / `export` / `resume-editor` 等 E2E spec。

## 已确认决策

- 以 Playwright 继续作为端到端主工具，不新引入第二套 E2E 框架
- E2E 应优先覆盖用户可观察的业务流，而不是内部实现细节
- 对外部依赖较重的链路，E2E 只覆盖入口、跳转、状态流转；复杂正确性保留给更低层测试
- `Application Resume`、`Job Description`、`Evaluation Report`、`Chat Session` 等术语在计划与测试命名中应尽量对齐 `CONTEXT.md`
- 真实本地 `Supabase` 与 `Next dev server` 仍作为 E2E 执行基础；Stripe、AI、导出等外部依赖按需 mock / stub

## 建议方案

### 1. 按业务域拆分 Playwright spec

建议后续按以下文件维度组织覆盖：

- `auth.spec.ts`
- `pricing.spec.ts`
- `dashboard.spec.ts`
- `application-navigation.spec.ts`
- `resume-editor.spec.ts`
- `jd.spec.ts`
- `evaluation.spec.ts`
- `chat.spec.ts`
- `settings.spec.ts`
- `export.spec.ts`
- `landing.spec.ts`
- `payment-success.spec.ts`

### 2. 先补 P0 / P1 主路径，再扩展到深链路

优先顺序：

1. 认证与受保护路由
2. Dashboard 创建 / 删除 / 进入
3. `Job Application` 工作区导航与 `Job Description` 保存
4. `UI Language` 切换
5. `Pricing` 登录前后分支
6. `Evaluation Report` 与 `Chat Session` 的高价值主链
7. `Application Resume` 深度编辑与导出链路

### 3. 统一数据策略

后续新增 E2E 时，优先采用：

- 登录态复用 `test/e2e/auth.setup.ts`
- 测试数据优先通过真实 API 创建 `Job Application`
- 缩略图、支付、AI、导出等重依赖接口按场景 stub
- 对并发敏感、共享本地状态强的 spec 采用串行执行或降低 worker 并发

## 实施步骤

### Phase 1: P0 主流程覆盖

- 认证主链路
- Dashboard 空白简历创建 / 删除 / 进入已有卡片
- `Job Application` 入口重定向与 resume / job description tab 导航
- `Job Description` 保存主链路
- `Settings` 语言切换

### Phase 2: P1 业务价值覆盖

- `Pricing` 登录前后分支
- `Evaluation Report` 空态、首次生成、刷新
- Chat 消息发送与基础回复
- 导出 / 打印入口冒烟

### Phase 3: P2 深链路覆盖

- `Application Resume` section 新增 / 编辑 / 删除 / 排序
- Chat tool 驱动的 resume 内容联动
- `Evaluation Report` 与 resume / job description 变更后的脏状态联动
- Landing / Payment Success 等补充页

## 任务清单

### Phase 1: 盘点与设计

- [ ] 逐个核对 `docs/web-structure.md` 中的主要业务路径与当前 E2E 覆盖差距
- [ ] 为每个拟新增 spec 标注真实 API / mock API / 页面依赖
- [ ] 统一 spec 命名、fixture 策略、测试数据创建策略

### Phase 2: P0 spec 规划

- [ ] 规划 `auth.spec.ts`
  - [ ] 未登录访问 `/dashboard`、`/application/[id]`、`/settings` 的重定向覆盖
  - [ ] 登录成功默认跳转 `/dashboard`
  - [ ] `callbackUrl` 回跳覆盖
  - [ ] `/jobs` 到 `/dashboard` 的兼容重定向覆盖
- [ ] 规划 `dashboard.spec.ts` 增补场景
  - [ ] `Create Empty Resume` 成功跳转
  - [ ] 关闭后重新打开弹窗状态 reset
  - [ ] 删除 `Job Application`
  - [ ] 空列表场景
- [ ] 规划 `application-navigation.spec.ts`
  - [ ] `/application/[id]` 自动跳 `/application/[id]/resume`
  - [ ] resume / job description tab 切换
  - [ ] 返回 Dashboard 行为
- [ ] 规划 `jd.spec.ts`
  - [ ] `Job Description` 回填
  - [ ] 保存成功提示
  - [ ] 刷新后数据持久化
- [ ] 规划 `settings.spec.ts`
  - [ ] `UI Language` 切换为 `zh`
  - [ ] `UI Language` 切换为 `en`
  - [ ] 刷新后语言保持

### Phase 3: P1 spec 规划

- [ ] 规划 `pricing.spec.ts`
  - [ ] 未登录点击 plan 跳登录并带 `callbackUrl=%2Fpricing`
  - [ ] 已登录点击 `FREE` 的免费额度入口
  - [ ] 已登录点击 `LITE` / `PRO` 的 checkout 入口
  - [ ] `?cancelled=true` 提示条展示与关闭
- [ ] 规划 `evaluation.spec.ts`
  - [ ] `Evaluation Report` 空态
  - [ ] 首次生成
  - [ ] 已有 report 时刷新
- [ ] 规划 `chat.spec.ts` 增补场景
  - [ ] 发送消息
  - [ ] assistant 回复展示
  - [ ] 刷新后历史保留
- [ ] 规划 `export.spec.ts`
  - [ ] resume 页导出按钮可见
  - [ ] 点击后请求 `/api/resume/print`
  - [ ] `/resume-print/[id]` 可打开

### Phase 4: P2 深链路规划

- [ ] 规划 `resume-editor.spec.ts`
  - [ ] 空白 `Application Resume` 初始态
  - [ ] `Personal Information Section` 编辑保存
  - [ ] repeatable `Section` 新增 / 编辑 / 删除最后一个 `Entry`
  - [ ] `Section Order` 上移 / 下移 / 持久化
- [ ] 规划 Chat 与 resume 联动场景
  - [ ] tool 驱动后画布内容更新
  - [ ] truncate / rollback 后内容恢复
- [ ] 规划 Evaluation 与内容修改联动场景
  - [ ] 修改 `Application Resume` 后需要重新评估
  - [ ] 修改 `Job Description` 后需要重新评估
- [ ] 规划补充页
  - [ ] `landing.spec.ts`
  - [ ] `payment-success.spec.ts`

## 测试计划

### E2E 分层策略

- [ ] 明确哪些场景走真实本地 API：认证、创建 `Job Application`、页面导航、`Job Description` 保存
- [ ] 明确哪些场景采用 mock / stub：Stripe、AI、导出、缩略图、部分评估结果
- [ ] 明确哪些高风险 spec 应使用串行执行

### 回归优先级

- [ ] 每次影响 `/dashboard`、`/application/[id]/resume`、`/application/[id]/jd` 的改动后，至少回归 P0 场景
- [ ] 每次影响 `Pricing`、认证回跳或 `UI Language` 的改动后，回归对应业务 spec
- [ ] 每次影响 Chat / Evaluation / Resume mutation 后，回归对应深链路 spec

## 风险

- `Application Resume` 编辑、Chat、Evaluation 都依赖共享本地数据与较重页面状态，若数据策略不统一，E2E 容易变脆
- 若过多依赖真实外部服务，套件速度与稳定性会明显下降
- 若大量使用脆弱文案或 DOM 结构选择器，后续 UI 调整会频繁打断测试
- 如果不控制 spec 并发，`Next dev server` 与本地 `Supabase` 的共享资源竞争会放大 flake

## 并行执行建议

- 可先并行做“覆盖盘点”和“fixture / mock 策略设计”
- 真正实施时，适合按页面域拆分给不同 worker：`auth/pricing`、`dashboard/application-navigation/jd/settings`、`resume-editor/chat/evaluation/export`
- 所有触及 UI 主流程的实施完成后，应统一跑一次无头 Playwright 全量回归

## 验收标准

- 形成一份按业务域拆分的 Playwright E2E 覆盖蓝图，覆盖当前主要用户路径
- 至少明确 P0、P1、P2 三层优先级与推荐实施顺序
- 对每个新增 spec 都明确其主要覆盖范围与依赖策略
- 后续实施者可直接据此开始补测，而不需要再次从页面结构与业务路径重新盘点
