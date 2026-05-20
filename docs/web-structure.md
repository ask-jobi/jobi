# 网页结构与主要业务路径

这份文档用于帮助 Agent 快速理解 Jobi 当前页面结构、关键导航关系、主业务流和测试注意点。

## 文档目的

- 快速区分公开页、认证页、受保护页
- 明确 Job Application 工作区的实际入口与跳转关系
- 为 Playwright / 手动回归提供稳定的巡检顺序

## 整体结构

应用目前主要分为四层：

1. 公开营销页
2. 认证页与认证回调
3. 登录后主工作台
4. 单个 Job Application 工作区

其中第 4 层是核心产品区域。

## 路由地图

### 公开页面

| 路径                 | 作用         | 备注                                      |
| -------------------- | ------------ | ----------------------------------------- |
| `/`                  | Landing Page | Hero、Problem、Features、CTA              |
| `/pricing`           | 定价页       | 展示 FREE / LITE / PRO token bundle       |
| `/payment/success`   | 支付成功页   | 展示 session id，并引导回首页或 Dashboard |
| `/resume-print/[id]` | 打印渲染页   | 供 PDF 导出使用，也可单独打开预览         |

### 认证相关

| 路径                    | 作用           | 备注                             |
| ----------------------- | -------------- | -------------------------------- |
| `/auth/login`           | 登录页         | 支持 `callbackUrl` 回跳          |
| `/auth/sign-up`         | 注册页         | 成功后跳 `/auth/sign-up-success` |
| `/auth/sign-up-success` | 注册成功提示页 | 等待邮件确认                     |
| `/auth/forgot-password` | 忘记密码页     | 发送重置邮件                     |
| `/auth/update-password` | 重置密码页     | 邮件回链进入                     |
| `/auth/error`           | 认证错误页     | 认证异常兜底                     |
| `/auth/confirm`         | 邮件确认回调   | route，不是 page                 |

### 登录后主工作台

| 路径         | 作用                   | 备注                      |
| ------------ | ---------------------- | ------------------------- |
| `/dashboard` | Job Application 列表页 | 主入口                    |
| `/jobs`      | 旧入口                 | 当前重定向到 `/dashboard` |
| `/settings`  | 设置页                 | 当前只有语言切换          |

### 单个 Job Application

| 路径                       | 作用                   | 备注                                    |
| -------------------------- | ---------------------- | --------------------------------------- |
| `/application/[id]`        | 申请详情入口           | 自动重定向到 `/application/[id]/resume` |
| `/application/[id]/resume` | 简历编辑页             | 核心工作区                              |
| `/application/[id]/jd`     | Job Description 编辑页 | 与 resume 共用同一 application layout   |

## 布局与导航关系

### 全局布局

根布局 `app/layout.tsx` 当前提供：

- next-intl provider
- locale 感知的 HTML `lang`
- sonner toast
- Umami 统计

### 登录后主工作台布局

`app/(protected)/(main)/layout.tsx` 负责：

- 鉴权
- 渲染 sidebar shell
- 包裹 `/dashboard` / `/settings`

Sidebar 当前稳定入口：

- `/dashboard`
- `/settings`
- plan/token badge 弹窗
- logout

### 单个申请布局

`app/(protected)/(individual)/application/[id]/layout.tsx` 负责：

- 拉取单个 Job Application（resume + job）
- 初始化 Jotai store

`app/(protected)/(individual)/application/[id]/template.tsx` 顶部 header 当前包含：

- 返回 Dashboard 按钮
- `resume` / `job description` 两个 tab
- 在 resume tab 下显示：
  - 导出按钮
  - token 使用概览

## 各页面结构

### 1. Landing Page `/`

当前内容结构：

- Hero
- Problem 区
- Features 区（3 张产品截图）
- CTA 尾部

行为：

- 主 CTA：未登录去 `/auth/sign-up`，已登录去 `/dashboard`
- `Learn More` 通过锚点跳到 `#features`

### 2. 定价页 `/pricing`

内容结构：

- Hero
- 3 张 Pricing Card：`FREE`、`LITE`、`PRO`
- FAQ
- CTA

行为分支：

- 未登录点击套餐：跳 `/auth/login?callbackUrl=%2Fpricing`
- 已登录点击 FREE：调用 `/api/access-passes/create-free`
- 已登录点击 LITE/PRO：调用 `/api/checkout_sessions`
- 支付取消后会以 `?cancelled=true` 回到当前页，并展示提示条

### 3. 登录页 `/auth/login`

关键元素：

- Email
- Password
- `Forgot your password?`
- `Login`
- `Sign up`

行为：

- 登录成功默认去 `/dashboard`
- 若有 `callbackUrl`，优先回跳

### 4. Dashboard `/dashboard`

这是登录后最重要的列表页。

页面结构：

- 左侧 sidebar
- 顶部窄 header（SidebarTrigger + 页面标题）
- 主区卡片网格

卡片类型：

- 第一张固定是 `Create New Resume`
- 其余卡片是历史 Job Application
  - 卡面通过 `/api/resume/thumbnail` 渲染缩略图
  - 点击卡片进入 `/application/[id]`
  - 右上角可删除申请

### 5. Create New Resume 弹窗

这是 Dashboard 最关键的创建流，当前是三步：

1. `Job Information`
2. `Upload Resume`
3. `Analyze Resume`

行为细节：

- Step 1 复用 `JobInformationForm`
- Step 2 可以：
  - 上传 PDF 简历
  - 点击 `Create Empty Resume`
- 上传分支会走 SSE 进度流：
  - `upload`
  - `load`
  - `parse`
  - `prepare`
  - `evaluate`
- 空白简历分支会直接创建 starter sections（`education`、`skills`）并跳转到 application
- 关闭弹窗会 reset 表单和进度状态

### 6. Application `/application/[id]/resume`

这是核心工作页。

当前布局：

- 左侧/中间：A4 resume canvas
- 右侧：工作面板（chat / evaluation）
- 页面底部外层还有 section 编辑 modal（按需打开）

#### 6.1 Resume canvas

当前默认渲染 `default` 模板。

可编辑 section：

- `personalInfo`
- `education`
- `employment`
- `research`
- `projects`
- `publications`
- `awards`
- `certifications`
- `skills`

规则：

- `education`、`skills` 是 starter section，空白简历默认创建
- 其他 section 会在需要时动态出现
- 删除可选 section 的最后一个 entry，会把该 section 从 `sectionOrder` 中移除
- 删除 starter section 的最后一个 entry，只会变为空 section，不会彻底移除

交互：

- hover section / entry 会出现 `Edit / Add / Delete` 操作按钮
- 点击编辑会打开 modal，而不是直接在右侧表单里编辑
- `personalInfo` 作为非 repeatable section 单独编辑
- 画布根节点有稳定选择器：`[data-testid="resume-canvas"]`

当前 DOM id 规律：

- section 容器：`section-${sectionId}`
- entry 容器：`section-${sectionId}-${index}`

#### 6.2 Section 编辑弹窗

当前通过 `ResumeSectionEditModal` 打开，保存时才真正落库。

支持的表单：

- `personalInfo`
- `education`
- `employment`
- `research`
- `projects`
- `publications`
- `awards`
- `certifications`
- `skills`

这是当前 resume 编辑器的重要事实：**不再存在页面级整份 resume draft 表单**。

#### 6.3 右侧工作面板

面板有两个 tab：

- `AI Chat`
- `Evaluation`

##### Evaluation 视图

- 若已有评估结果：显示 `EvaluationReport`
- 若没有：显示空态和 `Evaluate Resume`
- 顶部按钮支持首次生成或刷新评估
- 评估调用 `/api/evaluation`

##### Chat 视图

- 聊天 UI 由 `ChatInterface` 提供
- 每份 resume 只维护一个 canonical chat session
- AI tool 修改 resume 后，会把结果同步回 persisted resume
- 截断/回滚走 `/api/chat/truncate`

### 7. Application `/application/[id]/jd`

这是 Job Description 编辑页。

当前结构：

- 复用 `JobInformationForm`
- `Save` 按钮在底部右侧

行为：

- 首次加载从当前 application 的 job 数据回填
- 保存调用 `updateResumeJobDescription()`
- 保存成功 toast
- 同时把 `evaluation_report_refresh_flag` 置为 `true`

### 8. 设置页 `/settings`

当前只有语言切换：

- `zh`
- `en`

行为：

- 使用 cookie `NEXT_LOCALE`
- 切换后页面文案按 locale 刷新

### 9. 打印与导出

- 页面预览：`/resume-print/[id]`
- 下载 PDF：`/api/resume/print?id=<resumeId>`
- 导出逻辑会用 Puppeteer 打开打印页再生成 PDF

## 主要业务路径

### 路径一：未登录用户进入并注册 / 登录

1. 打开 `/`
2. 进入 `/auth/login` 或 `/auth/sign-up`
3. 登录成功后进入 `/dashboard`
4. 如果是从 `/pricing` 跳过去的，登录成功应回到 `/pricing`

### 路径二：从 Dashboard 创建新简历

1. 打开 `/dashboard`
2. 点击 `Create New Resume`
3. Step 1 填写 Job Information
4. Step 2 选择：
   - 上传 PDF
   - `Create Empty Resume`
5. 上传 PDF 分支进入 Step 3，观察 SSE 进度
6. 成功后跳转 `/application/[applicationId]`
7. 空白简历分支直接跳转 `/application/[applicationId]`

校验点：

- Step 1 无效表单不能进入下一步
- Step 2 未选文件时不能开始分析
- 仅支持 PDF
- 弹窗关闭后状态应清空

### 路径三：从 Dashboard 进入已有申请

1. 打开 `/dashboard`
2. 点击历史卡片
3. 先进入 `/application/[id]`
4. 自动重定向到 `/application/[id]/resume`

补充分支：

- 删除按钮可删除整个 Job Application
- 删除后列表应刷新

### 路径四：编辑简历内容

1. 进入 `/application/[id]/resume`
2. hover 某个 section/entry
3. 点击 `Edit`
4. modal 中修改并保存
5. 保存成功后画布更新

重点覆盖：

- `personalInfo`
- starter section：`education`、`skills`
- 可选 section 的新增、编辑、删除
- 删除最后一个 entry 后的 section 行为

### 路径五：查看或刷新评估

1. 进入 `/application/[id]/resume`
2. 切到 `Evaluation`
3. 若为空，点击 `Evaluate Resume`
4. 若已有结果，点击刷新按钮

联动规则：

- 修改 resume 或 JD 后，评估刷新标记会置为 true
- 回归时应覆盖“修改后重新评估”链路

### 路径六：与 AI 对话改写简历

1. 进入 `/application/[id]/resume`
2. 切到 `AI Chat`
3. 输入改写指令
4. 等待 assistant 输出与 tool 调用
5. 观察画布内容是否同步变化

重点：

- 聊天 UI 正常打开
- 消息可发送
- tool 调用后 resume 内容更新
- 如支持 truncate/rollback，需验证回滚后内容恢复

### 路径七：编辑 Job Description

1. 进入 `/application/[id]/jd`
2. 修改 `Name / Company / Description`
3. 点击 `Save`
4. 验证成功提示
5. 回到 resume 页刷新评估

### 路径八：导出 PDF

1. 进入 `/application/[id]/resume`
2. 点击 header 中导出按钮
3. 前端调用 `/api/resume/print`
4. 浏览器下载 PDF

### 路径九：切换语言

1. 进入 `/settings`
2. 选择 `中文` 或 `English`
3. 验证页面文案更新

## 建议的自主测试顺序

1. 首页 `/`
2. 登录 `/auth/login`
3. 定价页 `/pricing`
4. Dashboard `/dashboard`
5. Create New Resume 弹窗
6. 空白简历创建分支
7. Application resume 页
8. section modal 编辑
9. evaluation tab
10. chat tab
11. JD 编辑页
12. 设置页 `/settings`

## 选择器与测试注意事项

### 推荐优先使用

- `getByRole`
- `getByLabel`
- `getByText`
- href 断言
- `data-testid="resume-canvas"`
- dialog role

### 当前可依赖的稳定文案

- `Create New Resume`
- `Job Information`
- `Upload Resume`
- `Analyze Resume`
- `Evaluate Resume`
- `Save`
- `Login`
- `Sign up`

### 已知结构特点

- `/application/[id]` 本身不是最终页，会重定向到 `/resume`
- `/jobs` 只是兼容入口
- Dashboard 卡片依赖真实数据，空列表与有数据要分开处理
- chat / evaluation 共用右侧面板，只显示一个 tab 内容
- resume 编辑改为 modal 保存，不是旧的右侧表单直改模式

### 已知选择器风险

- `test/e2e/helpers/auth-helper.ts` 的 `getResumeCardCount()` 仍在使用 `a[href^="/resume/"]`
- 当前 Dashboard 卡片真实链接是 `a[href^="/application/"]`
- 如果继续扩展 E2E，优先改成语义化选择器或更新到当前路由前缀

## 与其他测试文档的关系

- 页面级 Playwright 操作方式参考 `docs/playwright-session-testing-guide.md`
- 本文更强调“页面结构、跳转关系、主流程和测什么”
