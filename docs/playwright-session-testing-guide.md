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

## 建议流程

每次检查都尽量按这个顺序：

1. 打开页面
2. 抓一次 `snapshot`
3. 做关键点击或输入
4. 页面变化后重新 `snapshot`
5. 必要时看 `console`
6. 用 `screenshot` 留存关键界面

常用命令：

```bash
"$PWCLI" --session ui-check open http://localhost:3001
"$PWCLI" --session ui-check snapshot
"$PWCLI" --session ui-check console
"$PWCLI" --session ui-check screenshot
```

## 优先检查页面

### 1. 首页 `/`

重点看：

- 顶部导航是否正常显示
- Hero 标题、说明、按钮是否正常
- 页面是否出现异常空白
- `Learn More` 是否能正常跳转到下方内容

### 2. 登录页 `/auth/login`

重点看：

- 输入框、按钮、忘记密码入口是否正常
- 登录后是否能进入 `/dashboard`

当前测试账号：

- Email: `testtest1@gmail.com`
- Password: `password`

### 3. Dashboard `/dashboard`

重点看：

- 登录后是否能正常进入
- 左侧导航是否正常显示
- `Create New Resume` 入口是否可见
- 页面是否出现布局错位或明显空状态异常

## 必查主流程

### Create New Resume

点击 `Create New Resume` 后，重点检查：

- 弹窗是否正常打开
- 三步流程是否存在
  - `Job Information`
  - `Upload Resume`
  - `Analyze Resume`
- 表单输入框和按钮是否可用
- 空表单点 `Next` 后是否出现合理的校验提示

## 特别注意

- 这个项目里受控输入框有时对 `fill` 不够稳定，优先用 `click + type`
- 页面结构变化后，旧的元素 ref 可能失效，记得重新 `snapshot`
- 如果改动涉及表单、弹窗、导航、首页布局，必须做一次 UI 巡检
- 如果改动涉及列表页、登录流、支付流或关键跳转路径，也按 UI 主流程处理，优先安排 `playwright_tester` 做针对性验证
- 如果发现错误提示直接暴露原始技术文案，需要记录为 UI/UX 问题

## 当前已知风险点

- 首页中下部可能出现视觉偏空的问题
- Dashboard 空状态页的信息密度偏低
- `Create New Resume` 第一步表单的错误提示文案不够友好

## 产物说明

调试产物通常在：

- `.playwright-cli/`
- `output/playwright/`

这些文件用于本地检查即可，通常不需要提交到 Git。
