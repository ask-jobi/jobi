# 测试与国际化

## 测试

### 当前测试栈

- 单元 / 服务端测试：Vitest（Node 环境）
- 组件测试：Vitest + Testing Library（jsdom）
- E2E：Playwright

### Vitest 约定

当前 `vitest.config.ts` 拆成两个 project：

- `server`
  - `server/**/*.test.{ts,tsx}`
  - `app/api/**/*.test.{ts,tsx}`
  - `components/editor/**/*.test.{ts,tsx}`
  - `lib/hooks/**/*.test.{ts,tsx}`
  - `lib/templates/**/*.test.{ts,tsx}`
- `components`
  - `components/**/*.test.{ts,tsx}`（排除 `components/ui/**`）

补充说明：

- setup files：`vitest.env-setup.tsx`、`vitest.component-setup.tsx`
- coverage provider：`v8`
- 当前 coverage threshold：`50%`

### Playwright 约定

- 测试目录：`test/e2e/`
- 默认 baseURL：`http://localhost:3001`
- 测试从空白 browser context 进入应用，由 middleware 自动建立签名 workspace cookie
- 涉及 ownership 时，应使用两个隔离的 browser context 验证数据不可互见
- 不再维护邮箱密码登录 setup 或“已登录/未登录”两套业务分支

### 新增测试时的建议

- 新增 `server/` 业务逻辑时，优先补 `*.test.ts`
- 新增复杂组件、交互组件时，优先补 `*.test.tsx`
- 修改 `app/api/*` 时，至少覆盖：
  - 参数校验
  - 匿名 identity / ownership
  - success path
  - error path
- 当前 route test 并不默认要求连接真实 D1；大多数测试 mock repository、`getDatabase()`、fetch 或 AI 依赖
- 影响主流程 UI（dashboard、create resume、application、workspace cookie）时，应补一轮 Playwright 回归或 identity 检查

### 测试风格

- 测试描述使用英文
- 优先测可观察行为，不和实现细节过度耦合
- 对 resume editor 这类复杂模块，优先围绕：
  - 保存前后状态
  - section/entry 变更结果
  - chat tool 输出后的 resume 更新
  - evaluation 刷新联动

### 匿名身份测试

- 无 cookie 时生成高熵 workspace id，并写入 HMAC 签名的 HttpOnly cookie
- 已有有效 cookie 时复用 workspace；签名被篡改时创建新 workspace
- 所有用户数据查询必须显式带 workspace id，不能依赖隐式 RLS
- 新 browser context 不能读取另一 context 创建的 Job Application
- Job Application 固定数量上限按当前匿名 identity 统计
- `/auth/*`、`/pricing`、`/payment/*` 等已删除页面返回 404
- 页面和 API 不包含套餐、余额或 token usage 字段

## 国际化（i18n）

### 当前实现

- i18n 基于 `next-intl`
- 支持语言：`en`、`zh`
- locale 来源于 cookie：`NEXT_LOCALE`
- 请求级配置在 `lib/i18n/request.ts`
- 词条文件：
  - `lib/i18n/translations/en.json`
  - `lib/i18n/translations/zh.json`

### 使用约定

- 新增用户可见文本时，先补翻译 key，再接入组件
- 客户端组件使用 `useTranslations()` / `useLocale()`（从 `next-intl` 导入）
- 服务端组件使用 `getTranslations()`（从 `next-intl/server` 导入）
- locale 切换通过 `setUserLocale()` 写 cookie
- 翻译 key 保持语义化，延续现有层级命名

### 文案约束

- 新代码不要继续引入硬编码用户文案
- 允许保留历史遗留硬编码作为存量，但新增改动尽量顺手清理同域文本
- toast、empty state、button label、dialog title 都算用户可见文本

### i18n 回归建议

以下情况至少检查 `en` / `zh` 两套文案：

- 新页面或新弹窗
- 表单校验文案
- 导航、CTA、空状态
- 会影响布局长度的标题或按钮文本

### 与业务语言的边界

- `UI Language` 是界面文案语言
- `Resume Language` 是简历内容语言
- 二者不要混用；resume 内容字段、section label 和应用按钮文案不是同一个概念
