# 网页结构与主要业务路径

这份文档用于帮助 Agent 快速理解 Jobi 当前页面结构、关键导航关系、匿名 workspace identity、主业务流和测试注意点。

## 文档目的

- 明确应用直接进入 Dashboard，不再经过 landing 或登录流程
- 明确 Job Application 工作区的实际入口与跳转关系
- 为 Playwright / 手动回归提供稳定的巡检顺序

## 整体结构

应用主要分为两层：

1. Dashboard 工作台
2. 单个 Job Application 工作区

访问者无需注册或输入密码。首次请求会自动创建签名的匿名 workspace cookie；该 identity 只用于 SQLite 数据 ownership 隔离，不产生用户可见的账号流程。

## 路由地图

### 工作台与入口

| 路径         | 作用                   | 备注                      |
| ------------ | ---------------------- | ------------------------- |
| `/`          | 应用入口               | 重定向到 `/dashboard`     |
| `/dashboard` | Job Application 列表页 | 主入口                    |
| `/jobs`      | 旧入口                 | 当前重定向到 `/dashboard` |
| `/settings`  | 设置页                 | 当前只有语言切换          |

### 单个 Job Application

| 路径                       | 作用                   | 备注                                    |
| -------------------------- | ---------------------- | --------------------------------------- |
| `/application/[id]`        | 申请详情入口           | 自动重定向到 `/application/[id]/resume` |
| `/application/[id]/resume` | 简历编辑页             | 核心工作区                              |
| `/application/[id]/jd`     | Job Description 编辑页 | 与 resume 共用同一 application layout   |
| `/resume-print/[id]`       | 打印渲染页             | 供 PDF 导出使用                         |

`/auth/*`、`/pricing` 与 `/payment/*` 已从产品路由中移除，访问应返回 404。

## 布局与导航关系

### 全局布局

根布局 `app/layout.tsx` 当前提供：

- next-intl provider
- locale 感知的 HTML `lang`
- sonner toast
- Umami 统计

middleware 在请求进入页面/API 前验证签名 cookie，或为新浏览器创建匿名 workspace identity。

### Dashboard 布局

`app/(protected)/(main)/layout.tsx` 负责：

- 确保请求拥有匿名 workspace identity
- 渲染 sidebar shell
- 包裹 `/dashboard` / `/settings`

Sidebar 稳定入口：

- `/dashboard`
- `/settings`

目录名中的 `protected` 表示仍有内部 ownership 边界，不代表页面要求显式登录。Sidebar 不展示登录、登出、套餐或用量入口。

### 单个申请布局

`app/(protected)/(individual)/application/[id]/layout.tsx` 负责：

- 校验当前匿名 identity 对 Job Application 的 ownership
- 拉取 Job Application（resume + job）
- 初始化 Jotai store

`app/(protected)/(individual)/application/[id]/template.tsx` 顶部 header 包含：

- 返回 Dashboard 按钮
- `resume` / `job description` 两个 tab
- resume tab 下的导出按钮

## 各页面结构

### 1. Dashboard `/dashboard`

页面结构：

- 左侧 sidebar
- 顶部窄 header（SidebarTrigger + 页面标题）
- 主区卡片网格

卡片类型：

- 第一张固定是 `Create New Resume`
- 其余卡片是当前匿名 workspace 的历史 Job Application
  - 卡面通过 `/api/resume/thumbnail` 渲染缩略图
  - 点击卡片进入 `/application/[id]`
  - 右上角可删除申请

### 2. Create New Resume 弹窗

Dashboard 的创建流分三步：

1. `Job Information`
2. `Upload Resume`
3. `Analyze Resume`

行为细节：

- Step 1 复用 `JobInformationForm`
- Step 2 可以上传 PDF 简历或点击 `Create Empty Resume`
- 上传分支使用 SSE 事件协议驱动进度
- 空白简历分支创建仅含 `personalInfo + sectionOrder=[]` 的最小 resume，并跳转到 application
- 关闭弹窗会 reset 表单和进度状态
- 创建和分析流程不做付费或 token 额度检查，也不展示或记录 token 用量
- 每个匿名 workspace 仍受固定的 Job Application 数量上限保护

### 3. Application `/application/[id]/resume`

当前布局：

- 左侧/中间：A4 resume canvas
- 右侧：工作面板（chat / evaluation）
- 页面底部外层：按需打开的 section 编辑 modal

#### Resume canvas

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

- `personalInfo` 固定在顶部，单独渲染，不参与 section 排序
- 其他 section 按 `sectionOrder` 渲染；空白简历初始 `sectionOrder = []`
- section 按需创建；新增后默认追加到 `sectionOrder` 末尾
- 删除任一 section 的最后一个 entry，会从 resume data 与 `sectionOrder` 一并移除该 section

交互：

- hover section / entry 会出现操作按钮
- section title 旁支持 `Move Up / Move Down`
- 点击编辑会打开 modal
- 画布根节点有稳定选择器：`[data-testid="resume-canvas"]`

当前 DOM id 规律：

- section 容器：`section-${sectionId}`
- entry 容器：`section-${sectionId}-${index}`

#### Section 编辑弹窗

`ResumeSectionEditModal` 在保存时持久化修改。当前不存在页面级整份 resume draft 表单。

#### 右侧工作面板

面板有两个 tab：

- `AI Chat`
- `Evaluation`

Evaluation 视图：

- 已有评估结果时显示 `EvaluationReport`
- 没有结果时显示空态和 `Evaluate Resume`
- 顶部按钮支持首次生成或刷新评估
- 评估调用 `/api/evaluation`

Chat 视图：

- 聊天 UI 由 `ChatInterface` 提供
- 每份 resume 只维护一个 canonical chat session
- AI tool 修改 resume 后同步回 persisted resume
- 截断/回滚走 `/api/chat/truncate`
- UI 和 API 不包含 token 用量或额度信息

### 4. Application `/application/[id]/jd`

- 复用 `JobInformationForm`
- 首次加载从当前 application 的 job 数据回填
- `Save` 调用 `updateResumeJobDescription()`
- 保存成功显示 toast，并把 `evaluation_report_refresh_flag` 置为 `true`

### 5. 设置页 `/settings`

当前只有语言切换：

- `zh`
- `en`

使用 cookie `NEXT_LOCALE`；切换后页面文案按 locale 刷新。

### 6. 打印与导出

- 页面预览：`/resume-print/[id]`
- 下载 PDF：`/api/resume/print?id=<resumeId>`
- 导出逻辑使用 Puppeteer 打开打印页并生成 PDF

## 主要业务路径

### 路径一：首次进入匿名 workspace

1. 在新浏览器上下文打开 `/`
2. middleware 自动创建签名 workspace cookie
3. `/` 重定向到 `/dashboard`
4. 页面不要求邮箱、密码或账号操作
5. 刷新页面后仍能访问同一 workspace 数据

校验点：

- workspace cookie 创建不应造成重定向循环
- cookie 签名或 D1 binding 失败时显示明确错误，不能放开跨用户数据访问
- 新浏览器上下文看不到其他 workspace 的数据

### 路径二：从 Dashboard 创建新简历

1. 打开 `/dashboard`
2. 点击 `Create New Resume`
3. Step 1 填写 Job Information
4. Step 2 选择上传 PDF 或 `Create Empty Resume`
5. 上传 PDF 分支观察 SSE 进度：`intake.start` → `step.*` → `intake.done` / `intake.failed` / `intake.cancelled`
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
3. 进入 `/application/[id]`
4. 自动重定向到 `/application/[id]/resume`

删除按钮可删除整个 Job Application；删除后列表应刷新。

### 路径四：编辑简历内容

1. 进入 `/application/[id]/resume`
2. hover 某个 section/entry
3. 点击 `Edit`
4. modal 中修改并保存
5. 保存成功后画布更新

重点覆盖 `personalInfo`、从空白状态新增任意 section、section/entry 的新增编辑删除和排序，以及删除最后一个 entry 后的 section 移除。

### 路径五：查看或刷新评估

1. 进入 `/application/[id]/resume`
2. 切到 `Evaluation`
3. 首次点击 `Evaluate Resume`，已有结果时点击刷新
4. 验证修改 resume 或 JD 后可重新评估

### 路径六：与 AI 对话改写简历

1. 进入 `/application/[id]/resume`
2. 切到 `AI Chat`
3. 输入改写指令
4. 等待 assistant 输出与 tool 调用
5. 观察画布内容是否同步变化
6. 验证 truncate/rollback 后内容恢复

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

1. 新浏览器打开 `/` 并进入 `/dashboard`
2. Dashboard
3. Create New Resume 弹窗
4. 空白简历创建分支
5. Application resume 页
6. section modal 编辑
7. evaluation tab
8. chat tab
9. JD 编辑页
10. 设置页
11. 新浏览器上下文的数据隔离

## 选择器与测试注意事项

推荐优先使用：

- `getByRole`
- `getByLabel`
- `getByText`
- href 断言
- `data-testid="resume-canvas"`
- dialog role

当前可依赖的稳定文案：

- `Create New Resume`
- `Job Information`
- `Upload Resume`
- `Analyze Resume`
- `Evaluate Resume`
- `Save`

已知结构特点：

- `/application/[id]` 会重定向到 `/resume`
- `/jobs` 只是兼容入口
- Dashboard 卡片依赖当前匿名 workspace 的真实数据
- chat / evaluation 共用右侧面板，只显示一个 tab 内容
- resume 编辑使用 modal 保存

## 与其他测试文档的关系

- 页面级 Playwright 操作方式参考 `docs/playwright-session-testing-guide.md`
- 本文更强调页面结构、跳转关系、匿名身份边界和主流程
