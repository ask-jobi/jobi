# Design: split-resume-editor-tool

## Architecture

### 当前设计

```
resumeEditor tool
├── operation: "rewrite" | "delete" | "add" | "reorderBlocks" | "reorderSections"
```

### 目标设计

```
resumeEditorModify tool        resumeEditorReorder tool
├── operation: "rewrite"      ├── operation: "reorderBlocks"
├── operation: "delete"        └── operation: "reorderSections"
└── operation: "add"
```

## 消费方影响

| 文件 | 影响 |
|------|------|
| `chat-interface.tsx` | 需处理两种工具调用 |
| `truncate/route.ts` | 需处理两种工具输出 |
| `resume.ts` (store) | 需处理两种输出类型 |
| `chat-history.ts` | 需识别两种工具名 |
| `resume-action-output-card.tsx` | 需处理两种输出渲染 |

## 迁移步骤

1. 在 `types/chat.ts` 中添加新的 schema
2. 在 `lib/agent/tools.ts` 中添加新工具
3. 更新所有消费方使用新工具
4. 移除旧工具和 schema

## 类型拆分详情

### resumeEditorModifyInputSchema

```typescript
z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("rewrite"),
    entity: BlockTypeEnum,
    id: z.string(),
    field: z.string(),
    reason: z.string(),
    value: z.string()
  }),
  z.object({
    operation: z.literal("delete"),
    entity: BlockTypeWithoutPersonalInfoEnum,
    id: z.string()
  }),
  z.object({
    operation: z.literal("add"),
    entity: BlockTypeWithoutPersonalInfoEnum
  })
])
```

### resumeEditorReorderInputSchema

```typescript
z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("reorderBlocks"),
    entity: BlockTypeWithoutPersonalInfoEnum,
    orderedIds: z.array(z.string())
  }),
  z.object({
    operation: z.literal("reorderSections"),
    orderedSectionIds: z.array(BlockTypeWithoutPersonalInfoEnum)
  })
])
```

### resumeEditorModifyInputSchema

```typescript
z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("rewrite"),
    entity: BlockTypeEnum,
    id: z.string(),
    field: z.string(),
    reason: z.string(),
    value: z.string()
  }),
  z.object({
    operation: z.literal("delete"),
    entity: BlockTypeWithoutPersonalInfoEnum,
    id: z.string()
  }),
  z.object({
    operation: z.literal("add"),
    entity: BlockTypeWithoutPersonalInfoEnum
  })
])
```

### resumeEditorReorderInputSchema

```typescript
z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("reorderBlocks"),
    entity: BlockTypeWithoutPersonalInfoEnum,
    orderedIds: z.array(z.string())
  }),
  z.object({
    operation: z.literal("reorderSections"),
    orderedSectionIds: z.array(BlockTypeWithoutPersonalInfoEnum)
  })
])
```

## 消费方影响

| 文件 | 影响 |
|------|------|
| `chat-interface.tsx` | 需处理两种工具调用 |
| `truncate/route.ts` | 需处理两种工具输出 |
| `resume.ts` (store) | 需处理两种输出类型 |
| `chat-history.ts` | 需识别两种工具名 |
| `resume-action-output-card.tsx` | 需处理两种输出渲染 |

## 测试策略

- 更新现有测试以适配新工具
- 新工具功能单独测试
- 集成测试验证两种工具都能正常工作
