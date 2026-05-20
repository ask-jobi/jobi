# Specs

已落地的功能规格文档。每份 spec 是当前代码实际行为的**事实记录**，不是计划、不是设计稿。

## 与 plans 的关系

- `docs/plans/` — 计划文档（current = 执行中，archive = 历史记录）
- `docs/specs/` — 事实规格（plan 完成后从此目录查询"实际上是什么"）

检索代码行为或设计决策时，优先读取 `docs/specs/`，不要依赖 `docs/plans/archive/` 中的内容。

## 文件索引

| 文件 | 内容 |
|---|---|
| `persisted-resume-model.md` | 简历编辑器数据模型：persisted-only 架构、mutation helpers、状态模型、数据流 |
| `resume-editor-interactions.md` | 画布交互：entry 拖拽排序、section 上/下移、空白简历起步、sectionOrder 语义 |
| `ai-chat-system.md` | AI Chat 与 Editor Tools：chat 消息、token 统计、editor tools schema、回溯机制 |
| `test-patterns.md` | 测试模式约定：全局 mock、data-testid 命名、维护原则 |
