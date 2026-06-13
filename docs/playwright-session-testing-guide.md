# Playwright UI 回归检查指引

这份文档用于指导 Agent 在完成代码修改后，快速做一轮页面级 UI 检查，确认主要功能和关键流程没有受到影响。

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

如果环境里已经配置好了 `PWCLI`，后续命令应直接复用，不要在每次调用前重复拼接 `export ...`。

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

## 优先检查页面

### 1. 首页 `/`

重点看：

- 顶部导航是否正常显示
- Hero 标题、说明、CTA 是否正常
- `Learn More` 是否跳到 features 区块
- 三张 feature 截图是否正常加载

### 2. 登录页 `/auth/login`

重点看：

- 输入框、按钮、忘记密码入口是否正常
- 登录成功后是否进入 `/dashboard`

当前测试账号：

- Email: `mock_normal@mail.com`
- Password: `mock_normal`

### 3. 定价页 `/pricing`

重点看：

- 3 张 plan card 是否正常展示
- 未登录点击 CTA 是否跳登录
- 已登录状态下按钮、提示条、FAQ 是否排版正常

### 4. Dashboard `/dashboard`

重点看：

- sidebar 是否正常显示
- `Create New Resume` 卡片是否可见
- 历史卡片缩略图、hover 删除按钮是否正常
- 页面是否存在布局错位或明显空状态异常

### 5. Application `/application/[id]/resume`

重点看：

- 进入 `/application/[id]` 后是否自动跳 `/resume`
- A4 画布是否正常渲染
- 右侧 `AI Chat` / `Evaluation` tab 是否可切换
- header 中导出按钮、token usage 是否正常显示
- section hover 后编辑操作是否出现

## 必查主流程

### Create New Resume

点击 `Create New Resume` 后，重点检查：

- 弹窗是否正常打开
- 三步流程是否存在
  - `Job Information`
  - `Upload Resume`
  - `Analyze Resume`
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

> 当前实现是 **modal 保存**，不是旧版右侧表单直改模式。

### JD 编辑

在 `/application/[id]/jd`：

- 表单是否回填当前 Job Description
- `Save` 是否可点击
- 保存成功后是否出现 toast

## 特别注意

- 这个项目里受控输入框有时对 `fill` 不够稳定，优先用 `click + type`
- 页面结构变化后，旧元素引用可能失效，记得重新 `snapshot`
- 如果改动涉及首页、Dashboard、定价页、申请详情、弹窗、表单、登录流、支付流、关键跳转路径，必须做 UI 巡检
- 如果改动影响 resume editor，至少检查一次：打开 modal、保存、evaluation/chat 切换、返回 Dashboard
- 如果发现错误提示直接暴露原始技术文案，需要记录为 UI/UX 问题

## 当前已知风险点

- 首页滚动区块和截图区对视口宽度较敏感
- Dashboard 空状态和有数据状态需要分别观察
- `test/e2e/helpers/auth-helper.ts` 中仍有旧的 `/resume/` 选择器，需要注意不要照抄
- 空白简历首次进入时，用户视线可能先落到 `Evaluation` 而不是“开始编辑”入口

## 产物说明

调试产物通常在：

- `.playwright-cli/`
- `output/playwright/`

这些文件用于本地检查即可，通常不需要提交到 Git。
