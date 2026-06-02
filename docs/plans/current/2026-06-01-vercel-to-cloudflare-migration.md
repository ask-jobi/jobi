# Vercel 到 Cloudflare 迁移计划

**Date:** 2026-06-01

## 背景

当前项目是 Next.js 15 App Router 应用，处于验证阶段，还没有必须维护的生产环境。代码库中存在一些 Vercel 平台假设：Vercel AI Gateway、`process.env.VERCEL`、Vercel 预览域名、Vercel 默认 README、`.vercel` 产物等。

本计划的方向已经明确：不保留 Vercel 项目、不设计生产切流或回滚窗口，尽可能移除 Vercel 平台相关依赖，并改为 Cloudflare Workers + OpenNext 部署；AI 调用完全移除 Vercel AI Gateway，改用当前 DeepSeek API 直连。

从代码现状看，迁移不只是改部署目标：项目包含 SSR、Route Handlers、Middleware、Supabase Auth、Stripe Webhook、AI 流式接口、PDF 导出、缩略图生成、PDF 解析等能力。Cloudflare 官方当前建议全栈 Next.js 使用 Cloudflare Workers + `@opennextjs/cloudflare`，而不是 Cloudflare Pages 的静态 Next.js 路径。

关键外部文档：

- Cloudflare Workers Next.js guide：全栈 SSR Next.js 通过 OpenNext adapter 部署到 Workers
- OpenNext Cloudflare guide：现有 Next.js 项目可用 `@opennextjs/cloudflare` / `wrangler` 迁移
- `docs/app-architecture.md`：当前技术栈、主要 API 与业务路径
- `docs/commands.md`：现有开发、构建、测试命令

## 目标

- 将部署目标从 Vercel 替换为 Cloudflare Workers + OpenNext。
- 引入可本地预览 Cloudflare Workers 运行时的构建与部署命令。
- 移除 Vercel 平台相关配置、环境变量、文档、域名假设与未使用资源。
- 完全移除 Vercel AI Gateway，使用当前 DeepSeek API 直连。
- 验证 Supabase Auth redirect、Stripe webhook、AI chat streaming、PDF 导出、缩略图生成、上传解析等主流程在 Cloudflare preview / 验证环境可用。
- 不保留 Vercel 项目，不设计生产切流和 Vercel 回滚路径。

## 非目标

- 本计划不迁移 Supabase 数据库、Supabase Auth 或 Storage。
- 本计划不重写 Next.js 为其他框架。
- 本计划不要求移除 Vercel AI SDK 作为代码层 AI SDK；`ai`、`@ai-sdk/react`、`@ai-sdk/deepseek` 可继续作为普通 npm 依赖使用。
- 本计划不迁移 Stripe、DeepSeek、Umami 等非部署平台供应商。
- 本计划不保留 Vercel AI Gateway、Vercel hosting、Vercel preview、Vercel 回滚路径。
- 本计划不保留 Puppeteer + 本地 Chromium 的实现方式；PDF 导出固定改用 Cloudflare Browser Run。
- 本计划不把缩略图降级为静态占位或客户端延迟生成；缩略图继续使用 `next/og` / `ImageResponse` 实时生成，除非 OpenNext 实测发现阻塞问题。
- 本计划不处理正式生产 DNS 灰度、生产切流、生产事故回滚；项目当前仍处于验证阶段。

## 已确认决策

- Cloudflare 产品形态：使用 Workers + OpenNext。
- 不使用 Cloudflare Pages 静态 Next.js 路径。
- 不保留 Vercel 项目，不设计 Vercel 回滚窗口。
- 尽可能移除 Vercel 平台相关依赖、配置和文档。
- 完全移除 Vercel AI Gateway。
- AI 模型调用改为当前 DeepSeek API 直连，保留 `@ai-sdk/deepseek`。
- Cloudflare 环境优先以 preview / validation 为准，不引入生产切流复杂度。
- PDF 导出使用 Cloudflare Browser Run，不保留本地 Chromium / Vercel fallback。
- 缩略图保持实时生成，优先沿用当前 `next/og` / `ImageResponse` 方案；如 Cloudflare build 要求，移除显式 `runtime = "edge"`。
- CI/CD 使用 Cloudflare Workers Builds，不使用 GitHub Actions + `wrangler deploy` 作为主路径。
- 暂不配置自定义域名；Cloudflare validation 环境使用 `workers.dev` URL。

## 代码现状

| 位置 | 当前情况 / 迁移影响 |
|---|---|
| `package.json` | 只有 `next build` / `next start`，无 `wrangler`、`@opennextjs/cloudflare`、Cloudflare preview/deploy scripts；存在 `@ai-sdk/gateway` 与 `vercel-minimax-ai-provider` 依赖 |
| `next.config.ts` | 配置 `serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"]`，这些 native / Node 依赖需要 Cloudflare Workers 兼容性验证 |
| `app/api/resume/print/route.ts` | 通过 `process.env.VERCEL` 判断是否使用 `@sparticuz/chromium`，并依赖 Puppeteer/Chromium；Workers 上不能直接运行本地 Chromium binary |
| `app/api/resume/thumbnail/route.tsx` | `export const runtime = "edge"` + `next/og`；OpenNext 可支持 `next/og` / `ImageResponse`，迁移重点是验证并视情况移除显式 `runtime = "edge"` |
| `app/api/resume/upload-and-analyze/route.ts` | `runtime = "nodejs"`，上传解析链路依赖 `server/ai/tools.ts` 的 `pdf-parse` |
| `app/api/chat/resume/route.ts` | `runtime = "nodejs"`，需验证 AI streaming 在 Workers + OpenNext 下行为 |
| `app/auth/callback/route.ts` | 非 development 环境优先使用 `x-forwarded-host` 生成 OAuth redirect，Cloudflare headers 行为需回归 |
| `server/ai/model.ts` | 当前 canonical path 是 `AI_GATEWAY_API_KEY` + `@ai-sdk/gateway`，这是需要移除的 Vercel AI Gateway 依赖 |
| `.env.example` | 注释明确提到 Vercel AI Gateway，缺少 direct DeepSeek / Cloudflare 部署所需变量说明 |
| `.gitignore` | 忽略 `.vercel`，尚未忽略 `.open-next`、`.wrangler` 等 Cloudflare 产物 |
| `README.md` | 仍是 create-next-app / Vercel 部署说明，并指向 `jobi-beta.vercel.app` |
| `docs/app-architecture.md` | 技术栈写有 “Vercel AI SDK”，需要澄清 library 与平台供应商边界 |

## 建议方案

### 1. 采用 Cloudflare Workers + OpenNext

首选路径：

- 安装 `@opennextjs/cloudflare` 与 `wrangler`。
- 新增 `wrangler.jsonc`：`main: .open-next/worker.js`、`assets.directory: .open-next/assets`、`compatibility_flags: ["nodejs_compat"]`。
- 新增 `open-next.config.ts`，先使用默认配置；如后续需要 ISR / incremental cache，再接入 R2。
- 新增 scripts：
  - `cf:preview`: `opennextjs-cloudflare build && opennextjs-cloudflare preview`
  - `cf:deploy`: `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
  - `cf:typegen`: `wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts`
- 保留 `pnpm dev` 使用 Next dev，新增 Cloudflare preview 作为部署前必跑检查。

不建议路径：

- 不使用 `@cloudflare/next-on-pages`，因为它偏 Edge runtime，当前项目有 Node runtime、Route Handlers、streaming、文件解析、PDF 等需求。
- 不改成纯静态导出，因为项目核心功能依赖 SSR / API routes / Auth / Webhook。
- 不保留 Vercel hosting 作为备用路径。

### 2. 先做 Workers 兼容性 spike

迁移风险最高的是运行时兼容，而不是配置文件。需要先在分支中跑通最小 Cloudflare build / preview，并按 route 分层处理：

- 普通页面和 SSR 页面：验证 App Router、受保护 layout、Supabase cookie 刷新。
- API routes：验证 `NextRequest`、cookies、headers、streaming response、webhook raw body。
- Node/native 依赖：验证 `pdf-parse`、`@napi-rs/canvas`、`Buffer`、`crypto`、动态 import 是否可打包。
- Browser/PDF：替换或隔离 `puppeteer-core`、`@sparticuz/chromium`。
- Edge route：处理 `runtime = "edge"`，优先改为默认/Node runtime 或替换实现。

### 3. 拆分不可直接迁移的能力

预期需要单独处理的能力：

1. PDF 导出
   - 当前实现依赖 Puppeteer 启动 Chromium。
   - Workers 目标方案固定为 Cloudflare Browser Run：通过 Browser binding + `@cloudflare/puppeteer` 远程控制 Cloudflare 托管的 headless Chrome。
   - 迁移时要保持 `/api/resume/print?id=...` 对前端契约不变。
   - 需要验证登录 cookie / Supabase session 传递到 `/resume-print/[id]` 的方式。
2. 缩略图生成
   - 当前 `next/og` + `ImageResponse` 方案保持不变，继续实时生成缩略图。
   - 缩略图必须保持实时生成，不接受静态占位或客户端延迟生成作为最终方案。
   - 迁移重点是验证 OpenNext Cloudflare 对 `next/og` 的支持；如显式 `runtime = "edge"` 导致 build/runtime 问题，则移除该 runtime 声明并保持 route contract `/api/resume/thumbnail?resume_id=...` 不变。
3. PDF 上传解析
   - `pdf-parse` 及其 native canvas 依赖可能影响 Workers bundle / runtime。
   - 若不可行，改用 Workers 兼容解析库，或拆到独立 Node 解析服务。

### 4. 移除 Vercel 平台假设

需要把“运行在 Vercel”改成“运行在 Cloudflare / 本地验证环境”：

- 移除 `process.env.VERCEL` 作为运行路径判断。
- 不新增 `DEPLOY_TARGET=vercel` 之类的 Vercel fallback 配置。
- 保持 `NEXT_PUBLIC_BASE_URL` 为 canonical base URL；Cloudflare preview / validation 环境显式配置。
- 补充 Cloudflare preview / validation 域名到 Supabase Auth redirect allow list。
- 将 Stripe webhook 测试 endpoint 指向 Cloudflare validation URL；不保留 Vercel webhook 过渡逻辑。
- 检查 OAuth callback 使用的 `x-forwarded-host` 在 Cloudflare 下是否正确，必要时支持 `host` fallback。
- 删除 Vercel 预览域名测试用例或改为平台无关 host 断言。

### 5. 完全移除 Vercel AI Gateway

目标模型路径：

- 保留 `ai` / `@ai-sdk/react` / `@ai-sdk/deepseek`。
- 移除 `@ai-sdk/gateway` 直接依赖。
- 移除 `AI_GATEWAY_API_KEY` 环境变量与相关注释。
- `server/ai/model.ts` 直接使用当前 DeepSeek API provider，例如 `deepseek("deepseek/deepseek-v4-flash")` 或项目当前确认的 DeepSeek model id。
- `.env.example` 改为 `DEEPSEEK_API_KEY=<DEEPSEEK_API_KEY>`。
- 清理未使用的 `vercel-minimax-ai-provider` 等 Vercel-only provider 依赖。
- 重新验证 AI chat、resume rewrite、evaluation report 的模型调用与错误处理。

## 待确认问题

- 无；当前迁移范围内关键平台决策已确认。

## 任务清单

### Phase 1: 基线审计

- [x] 盘点所有 Vercel 相关引用：`process.env.VERCEL`、`.vercel`、Vercel 域名、README 部署说明、AI Gateway 注释、Vercel-only provider 依赖。
- [x] 盘点验证环境需要的 env / secrets：Supabase、Stripe、DeepSeek、Umami、`NEXT_PUBLIC_BASE_URL`。
- [ ] 记录当前本地验证主流程基线：登录、上传、AI chat、支付测试、PDF 导出、缩略图、dashboard。
- [ ] 确认当前 DeepSeek API key 与目标 model id。

### Phase 2: Cloudflare 构建配置

- [x] 安装 `@opennextjs/cloudflare`。
- [x] 安装 `wrangler` devDependency。
- [x] 新增 `wrangler.jsonc`，启用 `nodejs_compat` 与 assets binding。
- [x] 新增 `open-next.config.ts`。
- [x] 新增 `cf:preview`、`cf:deploy`、`cf:typegen` scripts。
- [x] 将 `.open-next`、`.wrangler`、`cloudflare-env.d.ts` 的提交策略加入 `.gitignore` 或文档说明。
- [x] 本地运行 `pnpm build`，确认原 Next build 不被破坏。
- [x] 本地运行 `pnpm cf:preview`，收集首轮 Workers 兼容错误。

### Phase 3: Runtime 兼容修复

- [x] 在 Cloudflare preview 中验证 `app/api/resume/thumbnail/route.tsx` 的 `next/og` / `ImageResponse` 行为；仅在显式 `runtime = "edge"` 导致问题时移除该声明。
- [ ] 验证 `app/api/chat/resume/route.ts` 在 Cloudflare preview 下的 streaming 行为。
- [ ] 验证 `app/api/stripe/webhook/route.ts` 的 raw body 签名校验。
- [ ] 验证 Supabase SSR cookies 在 Middleware / Route Handler / Server Component 下的读写。
- [x] 验证 `server/ai/tools.ts` 中 `pdf-parse` 能否在 Workers 打包与运行。
- [x] 如 `pdf-parse` 或 `@napi-rs/canvas` 不兼容，替换为 Workers 兼容实现或抽离为外部 Node 服务。
- [x] 如 bundle 超过 Workers 限制，拆分重依赖 route 或改外部服务。

### Phase 4: PDF 与缩略图方案

- [x] 为 `/api/resume/print` 定义平台无关接口，隐藏具体 renderer。
- [x] 移除 `process.env.VERCEL` 分支判断。
- [x] 接入 Cloudflare Browser Run binding 与 `@cloudflare/puppeteer`。
- [x] 使用 Browser Run 实现 `/api/resume/print?id=...` PDF 生成。
- [x] 将当前 cookies / auth session 传递到 Browser Run 打开的 `/resume-print/[id]` 页面。
- [x] 保持 `/api/resume/print?id=...` 响应 contract 不变。
- [x] 保留 `/api/resume/thumbnail` 的 `next/og` / `ImageResponse` 实时生成方案。
- [x] 在 Cloudflare preview 中验证 `next/og` 缩略图 route。
- [x] 如显式 `runtime = "edge"` 导致 OpenNext build/runtime 问题，移除该 runtime 声明。
- [x] 补充 PDF/thumbnail route tests，覆盖 Browser Run 与实时 thumbnail renderer 分支。

### Phase 5: AI Gateway 去 Vercel 化

- [x] 修改 `server/ai/model.ts`，移除 `@ai-sdk/gateway`，改为 direct DeepSeek provider。
- [x] 将模型配置改为 `DEEPSEEK_API_KEY` + 当前 DeepSeek model id。
- [x] 更新 `.env.example`，删除 Vercel AI Gateway 说明。
- [x] 从 `package.json` 移除 `@ai-sdk/gateway`。
- [x] 检查并移除未使用的 `vercel-minimax-ai-provider`。
- [x] 更新 lockfile。
- [ ] 验证 AI chat、resume rewrite、evaluation report 的模型调用与错误处理。

### Phase 6: Cloudflare 验证环境集成

- [ ] 创建 Cloudflare Worker validation 环境，先使用 `workers.dev` URL，不配置 custom domain。
- [ ] 配置 Cloudflare secrets：Supabase、Stripe 测试 key、DeepSeek、Umami、base URL。
- [ ] 在 Supabase Auth allow list 增加 Cloudflare validation callback URL。
- [ ] 在 Stripe 测试模式增加 Cloudflare validation webhook endpoint，配置 `STRIPE_WEBHOOK_SECRET`。
- [ ] 配置 Cloudflare Workers Builds 连接仓库与目标分支。
- [ ] 在 Workers Builds 中配置 build command、deploy command、build variables 与 secrets。
- [ ] 跑通 Cloudflare validation 域名端到端回归。
- [ ] 删除 Vercel 项目或关闭 Vercel 自动部署。

### Phase 7: 文档与清理

- [x] 更新 `README.md`，移除 Vercel 默认部署说明，增加 Cloudflare preview/deploy 步骤。
- [x] 更新 `docs/commands.md`，加入 Cloudflare 命令。
- [x] 更新 `docs/app-architecture.md`，明确部署平台与 AI SDK / DeepSeek API 边界。
- [x] 更新 `.env.example`，列出 Cloudflare 验证环境必需变量。
- [x] 清理 `public/vercel.svg` 等未使用资源。
- [x] 清理测试中的 Vercel 域名断言，改为平台无关 host 场景。
- [x] 删除 `.vercel` 相关说明或本地残留。


## 当前实现记录

- 已接入 OpenNext Cloudflare 配置：`wrangler.jsonc`、`open-next.config.ts`、`public/_headers`、`cf:*` scripts。
- 已将 `/api/resume/print?id=...` 改为 Cloudflare Browser Run (`MYBROWSER`) + `@cloudflare/puppeteer`，并继续把当前 cookies 传入打印页。
- 已移除 Vercel AI Gateway 路径，`server/ai/model.ts` 使用 direct DeepSeek provider，默认模型为 `deepseek-v4-flash`，可通过 `DEEPSEEK_MODEL_ID` 覆盖。
- 已将 PDF 上传解析从 `pdf-parse` / `@napi-rs/canvas` 替换为 Workers 可打包的 `pdfjs-dist` 文本解析路径。
- 已移除 thumbnail route 的显式 `runtime = "edge"`，保留 `next/og` / `ImageResponse` 实时生成。
- 已删除超过 Workers asset 单文件限制的 `public/fonts/SourceHanSansSC-VF.ttf`，resume print 回退到系统字体。
- 已运行 `pnpm lint`、`pnpm format:check`、`pnpm test --run`、`pnpm build`；`pnpm cf:preview` 已构建并启动到 `Ready on http://localhost:8787`。
- Phase 6 的 Cloudflare 线上 validation 环境、Supabase allow list、Stripe endpoint、Workers Builds 和 Vercel 项目关闭仍需在外部控制台完成。

## 测试计划

### 自动化检查

- [x] `pnpm lint`
- [x] `pnpm format:check`
- [x] `pnpm test --run`
- [x] `pnpm build`
- [x] `pnpm cf:preview`
- [ ] `pnpm e2e-test-headless` 指向 Cloudflare preview/validation URL 或本地 preview URL

### 重点回归路径

- [ ] Landing / pricing 页面正常渲染。
- [ ] Supabase 登录、注册、OAuth callback、退出登录。
- [ ] Dashboard 创建 / 删除 application。
- [ ] 上传 resume 并解析 PDF。
- [ ] 打开 `/application/[id]/resume` 并保存编辑。
- [ ] AI chat 流式响应与工具改写简历。
- [ ] Stripe Checkout 创建 session 与 webhook 发放 token。
- [ ] `/api/resume/print?id=...` 导出 PDF。
- [ ] `/api/resume/thumbnail?resume_id=...` 实时生成缩略图。
- [ ] 受保护路由未登录重定向与 API 未登录 401 行为。

## 风险

- Workers 不是完整 Node.js runtime；native modules、Chromium、部分 Node API 可能不兼容。
- `pdf-parse` / `@napi-rs/canvas` / Puppeteer 可能导致打包失败或 bundle 过大。
- OpenNext 对 Next.js 特性的支持虽覆盖 App Router / Route Handlers / SSR / Middleware，但 `runtime = "edge"` 与 Node Middleware 仍需规避。
- Stripe webhook、Supabase Auth callback、cookie 刷新在代理头和 Cloudflare preview 域名下容易出现环境差异。
- 移除 Vercel AI Gateway 后，模型调用的限流、日志、成本归因与错误码会切换为 DeepSeek API 语义。
- 不保留 Vercel 回滚路径会降低迁移容错；由于项目仍处于验证阶段，该风险可接受。

## 并行执行建议

- Worker A：Cloudflare/OpenNext 配置、build/preview、Workers Builds CI/CD。
- Worker B：运行时兼容审计，重点处理 `pdf-parse`、`next/og` thumbnail、Browser Run PDF export。
- Worker C：Supabase Auth、Stripe webhook、环境变量与 validation 域名。
- Worker D：移除 Vercel AI Gateway，改造 `server/ai/model.ts` 为 direct DeepSeek provider。
- 主 agent：合并改动、统一测试、更新文档和 validation runbook。

## 验收标准

- Cloudflare validation 环境可通过 `workers.dev` URL 访问完整应用。
- `pnpm build` 与 Cloudflare preview/deploy 命令均通过。
- 登录、dashboard、上传解析、AI chat、支付测试、Browser Run PDF 导出、实时缩略图核心路径在 Cloudflare 环境通过回归。
- 代码中不再依赖 `process.env.VERCEL` 决定运行行为。
- 生产/验证 AI 调用不再依赖 `AI_GATEWAY_API_KEY` / Vercel AI Gateway，改用 direct DeepSeek API。
- `package.json` 不再包含未使用的 Vercel-only provider 依赖。
- README、commands、app architecture、env example 均已更新为 Cloudflare + DeepSeek API 说明。
- Vercel 项目已删除或自动部署已关闭。
