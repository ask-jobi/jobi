# Test Patterns

这个 plan 已完成，记录当前测试层面的最终落地约定。

## 已完成内容

### 全局测试设置

- `vitest.component-setup.tsx` 当前会全局 mock `next-intl`
- 同时也会 mock `server-only`、`next/navigation` 和 `@/lib/hooks/use-mobile`

### 单测中的 mock 使用

- 测试文件可以按需要继续 mock `next-intl`、部分 UI 组件或 `lucide-react`
- 如果全局 mock 已满足测试目标，优先直接复用
- 如果组件依赖复杂 UI 原语、图标或 tooltip/dialog 行为，局部 mock 是允许的

### `data-testid` 约定

- `components/ui/button.tsx` -> `ui-button`
- `components/ui/input.tsx` -> `ui-input`
- `components/ui/textarea.tsx` -> `ui-textarea`
- `components/ui/card.tsx` -> `ui-card`、`ui-card-header`、`ui-card-content`、`ui-card-footer`
- `components/ui/progress.tsx` -> `ui-progress`
- `components/ui/badge.tsx` -> `ui-badge`
- `components/ui/label.tsx` -> `ui-label`

### 维护原则

- 新测试优先验证用户可感知行为
- 新增 `data-testid` 时优先延续 `ui-` 前缀
- 测试策略明显变化时，直接更新本目录中的对应 plan
