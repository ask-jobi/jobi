# 网页结构与主要业务路径

这份文档用于帮助 Agent 快速理解 Jobi 的页面结构、主要导航关系、关键业务流和测试注意事项，便于后续编写或执行自主测试。

## 文档目的

- 快速识别公开页、受保护页和嵌套路由
- 明确每条主业务路径的入口、关键步骤和结果页
- 为 Playwright 或其他 Agent 提供更稳定的测试导航顺序

## 整体结构

应用大致分为三层：

1. 公开页面
2. 认证页面
3. 登录后页面

其中登录后页面又分成两类：

- 主工作台：`/dashboard`、`/settings`
- 单个申请详情：`/application/[id]/*`

## 路由地图

### 公开页面

| 路径 | 作用 | 备注 |
| --- | --- | --- |
| `/` | Landing Page | 顶部导航、Hero、功能介绍、CTA |
| `/pricing` | 套餐页 | 免费/付费计划入口 |
| `/payment/success` | 支付成功页 | 展示订单号并返回 Dashboard/Home |

### 认证页面

| 路径 | 作用 | 备注 |
| --- | --- | --- |
| `/auth/login` | 登录页 | 支持 `callbackUrl` 回跳 |
| `/auth/sign-up` | 注册页 | 成功后跳转注册成功页 |
| `/auth/sign-up-success` | 注册成功提示页 | 等待邮箱确认 |
| `/auth/forgot-password` | 忘记密码页 | 发送重置邮件 |
| `/auth/update-password` | 重置密码页 | 通过邮件回链进入 |
| `/auth/error` | 认证错误页 | 认证链路异常时兜底 |

### 受保护页面

| 路径 | 作用 | 备注 |
| --- | --- | --- |
| `/dashboard` | 简历/申请列表页 | 主入口，左侧有 sidebar |
| `/jobs` | 旧入口 | 当前直接重定向到 `/dashboard` |
| `/settings` | 设置页 | 当前只有语言切换 |
| `/application/[id]` | 申请详情入口 | 自动重定向到 `/application/[id]/resume` |
| `/application/[id]/resume` | 简历编辑页 | 核心工作页面 |
| `/application/[id]/jd` | Job Description 编辑页 | 编辑岗位信息 |
| `/resume-print/[id]` | 打印预览页 | 服务端读取 resume 数据渲染 |

## 布局与导航关系

### 全局布局

- 根布局 `app/layout.tsx`
- 全局提供国际化、Toast、Umami 统计

### 公开页导航

- 顶部 `Header` 在 Landing/Pricing 等页面复用
- 未登录时常见入口：
  - `/auth/login`
  - `/auth/sign-up`
  - `/pricing`
- 已登录时 CTA 更偏向 `/dashboard`

### 登录后主工作台布局

- `app/(protected)/(main)/layout.tsx` 负责鉴权
- 未登录访问会被重定向到 `/auth/login`
- 左侧 `AppSidebar` 当前只有两个稳定入口：
  - `/dashboard`
  - `/settings`

### 单个申请详情布局

- `app/(protected)/(individual)/application/[id]/layout.tsx` 会先拉取当前申请的 job/resume 数据
- 顶部子导航位于 `app/(protected)/(individual)/application/[id]/template.tsx`
- 当前只有两个 tab：
  - `resume`
  - `jd`
- 左上角返回按钮会回到 `/dashboard`

## 各页面结构

### 1. Landing Page `/`

关键区域：

- 顶部导航
- Hero 标题与主 CTA
- Learn More 按钮，跳转到页面内功能区
- 问题说明区与功能介绍区

适合测试的内容：

- 首屏是否正常渲染
- CTA 根据登录状态跳转不同页面
- `Learn More` 是否滚动到下方内容

### 2. 登录页 `/auth/login`

关键元素：

- Email
- Password
- `Forgot your password?`
- `Login`
- `Sign up` 跳转链接

行为：

- 登录成功默认跳转 `/dashboard`
- 如果 URL 含 `callbackUrl`，优先跳回该页面

### 3. 注册页 `/auth/sign-up`

关键元素：

- Email
- Password
- Repeat Password
- `Sign up`
- `Login` 跳转链接

行为：

- 两次密码不一致会直接显示错误
- 注册成功跳转 `/auth/sign-up-success`

### 4. 找回密码 `/auth/forgot-password`

关键元素：

- Email
- `Send reset email`

行为：

- 提交成功后页面切换成“Check Your Email”成功态

### 5. 套餐页 `/pricing`

关键区域：

- Hero 说明
- 3 张 Pricing Card
- FAQ
- 底部 CTA

行为分支：

- 未登录点击购买或领取免费套餐，会先跳转 `/auth/login?callbackUrl=%2Fpricing`
- 已登录点击免费套餐，会调用 `/api/access-passes/create-free`
- 已登录点击付费套餐，会调用 `/api/checkout_sessions`

### 6. Dashboard `/dashboard`

这是登录后最重要的列表页。

页面结构：

- 左侧 sidebar
- 顶部 header
- 主区为卡片网格
- 第一张卡固定是 `Create New Resume`
- 其余卡片为历史 job application 缩略图

卡片行为：

- 点击 `Create New Resume` 打开三步弹窗
- 点击已有卡片进入 `/application/[id]`
- 卡片右上角 hover 删除按钮可删除申请

### 7. Application `/application/[id]/resume`

这是核心工作页。

页面结构：

- 左侧：A4 简历预览区
- 中间偏右：浮动操作按钮组
- 右侧：可折叠面板

右侧面板有三种视图：

- `form`
- `evaluation`
- `chat`

默认状态通常更接近 `evaluation` 视图。

#### 左侧简历预览

- 点击简历 section 会切换右侧到 `form`
- section DOM id 规则：
  - `section-personalInfo`
  - `section-education`
  - `section-education-0`
  - `section-employment`
  - `section-employment-0`
  - `section-skills`
  - `section-skills-0`

#### 浮动按钮

- 聊天按钮：打开右侧 `chat`
- 奖杯按钮：打开右侧 `evaluation`
- 下载按钮：导出 PDF，调用 `/api/resume/print`

#### 右侧表单视图

点击 section 后，右侧会打开对应表单：

- `personalInfo`
  - First Name
  - Last Name
  - Email
  - Phone
- `education`
  - 可新增/删除教育块
  - 每块包含 School、Degree、Start/End Date、Markdown 内容编辑
- `employment`
  - 可新增/删除经历块
  - 每块包含 Company、Job Title、Start/End Date、Markdown 内容编辑
- `skills`
  - 可新增/删除技能组
  - 每组包含 Group 和 tags 输入

这些表单通过 `react-hook-form` 驱动，内容变更会自动保存。

#### 右侧评估视图

- 如已有评估报告，显示 `EvaluationReport`
- 如无评估报告，显示空态和 `Evaluate Resume` 按钮
- 点击后调用 `/api/evaluation`

#### 右侧聊天视图

- 聊天区域来自 `ChatInterface`
- 依赖 chat session 初始化
- 用于自然语言改写、排序、增删 section/block
- 工具执行后会同步修改简历内容

### 8. Application `/application/[id]/jd`

这是岗位信息编辑页，结构比 resume 页简单。

包含字段：

- Name
- Company
- Description
- Save

行为：

- 初次加载会从当前申请的 jobDescription 回填
- 点击 `Save` 调用服务端更新岗位描述
- 保存成功后会提示成功 toast
- 同时会标记 evaluation report 需要刷新

### 9. 打印页 `/resume-print/[id]`

作用：

- 服务端直接根据 resume id 拉取数据
- 用于打印/预览独立渲染

注意：

- 日常用户导出 PDF 主要走 `/api/resume/print`
- `/resume-print/[id]` 更适合做静态预览或打印页验证

## 主要业务路径

### 路径一：未登录用户进入并注册/登录

1. 打开 `/`
2. 通过顶部按钮进入 `/auth/login` 或 `/auth/sign-up`
3. 登录成功后进入 `/dashboard`
4. 若从 `/pricing` 跳转到登录页，则登录成功后应回到 `/pricing`

### 路径二：从 Dashboard 创建新简历

这是最关键的业务流。

1. 打开 `/dashboard`
2. 点击 `Create New Resume`
3. 进入 Step 1 `Job Information`
4. 填写：
   - Name
   - Company
   - Description
5. 进入 Step 2 `Upload Resume`
6. 分两条分支：
   - 上传现有简历文件
   - 点击 `Create Empty Resume`
7. 如果上传文件：
   - 进入 Step 3 `Analyze Resume`
   - 观察 upload/load/parse/prepare/evaluate 进度
   - 成功后跳转 `/application/[id]`
8. 如果创建空白简历：
   - 直接跳转 `/application/[id]`

校验点：

- Step 1 空表单不能进入下一步
- Step 2 未选文件时分析按钮不可用
- 弹窗关闭后状态会 reset

### 路径三：从 Dashboard 进入已有申请

1. 打开 `/dashboard`
2. 点击已有缩略图卡片
3. 实际路由先进入 `/application/[id]`
4. 页面会自动重定向到 `/application/[id]/resume`

补充分支：

- hover 卡片显示删除按钮
- 删除确认后刷新列表

### 路径四：编辑简历内容

1. 进入 `/application/[id]/resume`
2. 点击左侧简历中的某个 section
3. 右侧切到对应表单
4. 修改字段
5. 等待自动保存

重点覆盖：

- `personalInfo` 基础字段编辑
- `education` 的新增、删除、内容弹窗编辑
- `employment` 的新增、删除、内容弹窗编辑
- `skills` 的 tag 输入与分组增删

### 路径五：查看或生成评估报告

1. 进入 `/application/[id]/resume`
2. 点击奖杯按钮
3. 如果没有报告，点击 `Evaluate Resume`
4. 等待右侧出现评估报告内容

联动规则：

- 修改简历内容或 JD 后，会把 evaluation refresh flag 置为 true
- 因此回归测试时，应覆盖“修改后重新评估”的链路

### 路径六：与 AI 对话改写简历

1. 进入 `/application/[id]/resume`
2. 点击聊天按钮
3. 在右侧聊天区域输入改写指令
4. 等待 assistant 输出
5. 若触发工具调用，简历内容会被直接更新

测试重点：

- 聊天视图能正常打开
- 发送消息后 UI 不报错
- 工具调用后简历区内容发生预期变化

### 路径七：编辑 Job Description

1. 进入 `/application/[id]/jd`
2. 修改 Name、Company、Description
3. 点击 `Save`
4. 验证成功提示
5. 返回 `resume` 页后重新生成评估报告

### 路径八：导出 PDF

1. 进入 `/application/[id]/resume`
2. 点击下载按钮
3. 前端调用 `/api/resume/print`
4. 浏览器下载 `resume.pdf`

### 路径九：切换语言

1. 进入 `/settings`
2. 修改语言下拉框
3. 验证页面文案随 locale 更新

## 建议的自主测试顺序

建议 Agent 按这个顺序执行：

1. 首页 `/`
2. 登录 `/auth/login`
3. Dashboard `/dashboard`
4. Create New Resume 弹窗
5. 创建空白简历分支
6. 申请详情 `/application/[id]/resume`
7. section 点击打开表单
8. evaluation 视图
9. chat 视图
10. JD 编辑 `/application/[id]/jd`
11. 设置页 `/settings`
12. 定价页 `/pricing`

## 选择器与测试注意事项

### 推荐优先使用

- `getByRole`
- `getByLabel`
- `getByText`
- 明确的 href
- 对话框 role

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
- `/jobs` 当前只是重定向入口
- Dashboard 列表依赖真实数据，空数据与有数据要分开处理
- 简历编辑页的右侧面板可折叠，测试时需要考虑展开/收起状态
- 自动保存存在 debounce，断言保存结果时需要给出等待时间

### 已知选择器风险

- 现有 `test/e2e/helpers/auth-helper.ts` 中 `getResumeCardCount()` 仍使用 `a[href^="/resume/"]`
- 实际 Dashboard 卡片链接已经是 `a[href^="/application/"]`
- 如果后续扩展 E2E，建议统一改成更贴近当前路由结构的语义化选择器

## 与现有测试文档的关系

- 页面级巡检方式继续参考 `docs/playwright-session-testing-guide.md`
- 本文更侧重“测什么”和“先后关系”
- `docs/playwright-session-testing-guide.md` 更侧重“怎么操作 playwright session”
