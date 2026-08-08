# Playwright UI 回归检查指引

这份文档用于指导 Agent 在完成代码修改后做页面级 UI 检查，确认主要功能、匿名 workspace identity 和关键流程没有受到影响。

如需先了解页面结构、路由关系和主要业务路径，请先阅读 `docs/web-structure.md`。

如果当前运行环境支持子 agent，且改动命中了 UI 主流程相关区域，Agent 应优先调用 `playwright_tester` 执行回归；只有在该 agent 不可用时，才退回到手动 Playwright session 检查。

## 启动方式

先启动测试环境：

```bash
pnpm dev:test
```

设置 `playwright` skill 路径：

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
```

如果环境里已经配置好了 `PWCLI`，后续命令应直接复用。

## 建议流程

每次检查尽量按这个顺序：

1. 打开页面
2. 抓一次 `snapshot`
3. 做关键点击或输入
4. 页面变化后重新 `snapshot`
5. 必要时查看 `console`
6. 用 `screenshot` 留存关键界面

常用命令：

```bash
"$PWCLI" --session ui-check open http://localhost:3001
"$PWCLI" --session ui-check snapshot
"$PWCLI" --session ui-check console
"$PWCLI" --session ui-check screenshot
```

## 执行约束

- 优先使用已配置好的 `PWCLI`
- 如果 `PWCLI` 调用失败，先报告错误并停止，不要自动 fallback 到临时脚本
- 只有用户明确要求编写或运行 Playwright test 文件时，才切换到 `@playwright/test` 工作流
- 不要预制邮箱密码登录态；使用全新的 browser context 验证匿名 session 初始化

## 会话清理（必做）

UI 检查或测试结束后，Agent **必须**关闭 Playwright 浏览器会话并确认无残留实例。遗留的浏览器进程会继续占用端口、加载旧页面并发出过期请求（例如对已删除 API 的轮询导致服务端持续出现 404）。

1. 结束当前 session 的浏览器：

   ```bash
   "$PWCLI" --session ui-check close
   ```

   如果同时开过多个 session，可一次性全部关闭：

   ```bash
   "$PWCLI" close-all
   ```

2. 无论使用 `PWCLI` 还是 `pnpm e2e-test*` 流程，结束后都应检查并清理残留实例（被中断的运行不会自动关闭浏览器）：

   ```bash
   pkill -f playwright_chromiumdev_profile
   ```

3. 确认无残留（无输出即为干净）：

   ```bash
   ps aux | grep playwright_chromiumdev_profile | grep -v grep
   ```

残留的临时 profile 位于 `/var/folders/.../T/playwright_chromiumdev_profile-*`，确认没有活跃测试后可直接删除。

## 优先检查页面

### 1. 入口 `/`

重点看：

- 是否自动进入 `/dashboard`
- 是否没有登录、注册、定价、套餐或余额 UI
- 新浏览器上下文是否能自动建立匿名 session
- 刷新后是否保持在同一 workspace

### 2. Dashboard `/dashboard`

重点看：

- sidebar 是否正常显示
- `Create New Resume` 卡片是否可见
- 历史卡片缩略图、hover 删除按钮是否正常
- 页面是否存在布局错位或明显空状态异常
- sidebar 中是否不存在登录、登出、套餐或用量入口

### 3. Application `/application/[id]/resume`

重点看：

- 进入 `/application/[id]` 后是否自动跳 `/resume`
- A4 画布是否正常渲染
- 右侧 `AI Chat` / `Evaluation` tab 是否可切换
- header 中导出按钮是否正常显示
- 页面中是否不存在 token 用量 UI
- section hover 后编辑操作是否出现

## 必查主流程

### 匿名 workspace 隔离

- 在 context A 创建一份空白简历
- 刷新 context A，确认数据仍可访问
- 新建 context B 打开 `/dashboard`
- 确认 context B 看不到 context A 的数据
- 确认整个流程没有显式登录页面或登录弹窗

### Create New Resume

点击 `Create New Resume` 后，重点检查：

- 弹窗是否正常打开
- 三步流程是否存在：`Job Information`、`Upload Resume`、`Analyze Resume`
- 空表单点 `Next` 是否出现校验
- `Create Empty Resume` 是否可走通
- 上传 PDF 分支的进度条 / 状态切换是否正常

### Resume Section Edit

在 `/application/[id]/resume`：

- hover 某个 section/entry
- 点击 `Edit`
- 确认 modal 正常打开
- 修改内容并保存
- 保存后画布内容是否更新

当前实现是 **modal 保存**，不是旧版右侧表单直改模式。

### JD 编辑

在 `/application/[id]/jd`：

- 表单是否回填当前 Job Description
- `Save` 是否可点击
- 保存成功后是否出现 toast

## 删除路由检查

确认下列路由返回 404，而不是跳回已删除页面：

- `/auth/login`
- `/auth/sign-up`
- `/pricing`
- `/payment/success`

对已删除的付费、账号和用量 API，可按改动范围补充同类 404 检查。

## 特别注意

- 受控输入框有时对 `fill` 不够稳定，优先用 `click + type`
- 页面结构变化后，旧元素引用可能失效，记得重新 `snapshot`
- 如果改动涉及 Dashboard、申请详情、弹窗、表单、匿名 session、导出或关键跳转，必须做 UI 巡检
- 如果改动影响 resume editor，至少检查一次：打开 modal、保存、evaluation/chat 切换、返回 Dashboard
- 如果发现错误提示直接暴露原始技术文案，需要记录为 UI/UX 问题

## 当前已知风险点

- Dashboard 空状态和有数据状态需要分别观察
- 清除 cookie/site data 后会创建新的匿名 workspace，旧 workspace 当前无法恢复
- 生产环境缺少 `WORKSPACE_COOKIE_SECRET` 或 D1 `DB` binding 时，首次数据请求会失败
- 空白简历首次进入时，用户视线可能先落到 `Evaluation` 而不是“开始编辑”入口

## 产物说明

调试产物通常在：

- `.playwright-cli/`
- `output/playwright/`

这些文件用于本地检查即可，通常不需要提交到 Git。
