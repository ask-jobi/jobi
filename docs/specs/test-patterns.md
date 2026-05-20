# Test Patterns

**归档日期:** 2026-05-20
**来源计划:** `docs/plans/archive/test-patterns.md`

## 全局测试设置

`vitest.component-setup.tsx` 全局 mock：

- `next-intl`
- `server-only`
- `next/navigation`
- `@/lib/hooks/use-mobile`

## Mock 策略

- 单测可按需 mock `next-intl`、UI 组件、`lucide-react`
- 全局 mock 已满足时优先复用
- 组件依赖复杂 UI 原语（tooltip/dialog 等）时允许局部 mock

## `data-testid` 约定

| 组件 | `data-testid` |
|---|---|
| `Button` | `ui-button` |
| `Input` | `ui-input` |
| `Textarea` | `ui-textarea` |
| `Card` | `ui-card` |
| `CardHeader` | `ui-card-header` |
| `CardContent` | `ui-card-content` |
| `CardFooter` | `ui-card-footer` |
| `Progress` | `ui-progress` |
| `Badge` | `ui-badge` |
| `Label` | `ui-label` |

## 维护原则

- 新测试优先验证用户可感知行为
- 新增 `data-testid` 优先延续 `ui-` 前缀
- 测试策略明显变化时更新本文件
