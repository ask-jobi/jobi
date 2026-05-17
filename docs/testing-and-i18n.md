# 测试与国际化

## 测试

- 为所有新组件创建单元测试
- 始终为 `route.ts` 创建集成测试，测试应使用真实的 Supabase 数据库
- 组件测试使用 `@testing-library/react`
- 测试描述必须使用英文
- 需要覆盖边界场景和边界条件
- 使用 Vitest 作为测试框架，而不是 Jest

## 国际化 (i18n)

- 添加任何新组件时，必须优先考虑 i18n
- 在编写组件代码之前，先在 `lib/i18n/translations/en.json` 和 `lib/i18n/translations/zh.json` 中添加所需的翻译 key
- 所有用户可见文本都必须使用 i18n
- 客户端组件使用 `next-intl/client` 的 `useTranslations`
- 服务端组件使用 `next-intl/server` 的 `getTranslations`
- 禁止在组件中硬编码显示文本，始终使用翻译 key
- 翻译 key 应具有描述性，并遵循现有命名模式（如 `section.subsection.key`）
- 需要测试两种语言下的文本都能正确显示
