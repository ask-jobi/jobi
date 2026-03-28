# Resume Editor Tools

这个 plan 已完成，记录聊天工具对简历编辑能力的最终落地结果。

## 工具划分

- `resumeEditorModify` 负责改写、新增、删除
- `resumeEditorReorder` 负责 block 重排和 section 重排

## 已完成内容

### resumeEditorModify

#### rewrite

- 输入字段：`operation`, `entity`, `id`, `field`, `value`
- `entity` 允许 `personalInfo`、`education`、`employment`、`research`、`projects`、`publications`、`awards`、`certifications`、`skills`
- 输出包含 `originalValue`，用于回滚

#### delete

- 输入字段：`operation`, `entity`, `id`
- `entity` 不允许 `personalInfo`
- 输出包含被删除 block 的 `originalValue`

#### add

- 输入字段：`operation`, `entity`
- 当前工具输入不要求 AI 提供完整 block data
- 新 block 由工具侧生成默认值和 `blockId`
- 输出字段为 `newBlock`

### resumeEditorReorder

#### reorderBlocks

- 输入字段：`operation`, `entity`, `orderedBlockIds`
- 输出保留 `originalValue` 作为原始顺序

#### reorderSections

- 输入字段：`operation`, `orderedSectionIds`
- 可重排范围不包含 `personalInfo`
- 实际 sectionOrder 更新后，`personalInfo` 固定在首位
- 输出保留 `originalValue` 作为原始顺序

## 通用约束

- 两个工具都要求输出语言与原始简历语言保持一致
- 工具输出会写入 chat 消息 parts，并用于回滚与事件记录
