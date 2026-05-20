# Persisted Resume Editor Model

**归档日期:** 2026-05-20
**来源计划:** `docs/plans/archive/2026-05-18-remove-draft-resume-state.md`

## 实现了什么

简历编辑器从 `draft + autosave + 页面级 RHF` 模型收口为 **单一 persisted Application Resume + modal 局部表单 + 显式保存** 模型。页面不再持有整份 resume 的 FormProvider，autosave 已移除，所有 mutation 采用"先落库、再更新 UI"的语义。

## 关键文件

| 文件 | 职责 |
|---|---|
| `lib/store/resume.ts` | `applicationAtom` → 唯一简历数据源；`applicationResumeDataAtom` 派生 persisted resume |
| `lib/resume/mutations.ts` | 纯函数 mutation helpers（无 RHF、无 draft 语义） |
| `lib/hooks/use-entry-edit-workflow.ts` | 统一编辑工作流：start → mutate → persist → rollback |
| `lib/hooks/use-resume-editor-state.ts` | Editor 选择状态（sectionId / entryIndex / entryId） |
| `server/resume.ts` | `saveApplicationResumeChange()` — server 端保存入口 |

## 数据流

### 手动编辑

```
用户点击 entry → useEntryEditWorkflow
  → selectTarget(sectionId, index)
  → setEditModalOpen(true)
  → modal 从 applicationResumeDataAtom 派生初始值
  → 保存时通过 lib/resume/mutations.ts 生成 nextResume
  → saveApplicationResumeChange() 成功 → 更新 store
```

### AI 编辑

```
chat route → DB 读取最新 resume → 生成 prompt
  → 前端 tool call → applyToolOutputToResume() → nextResume
  → saveApplicationResumeChange() 成功 → 更新 store
```

### AI / 表单互斥

- AI running 时：canvas add/edit/delete 入口 disabled，modal 不可打开
- modal 打开时：chat thread 不渲染，AI resume mutation 被阻止

## Mutation helpers

所有函数在 `lib/resume/mutations.ts`，均为纯 `ResumeData → ResumeData` 操作：

| 函数 | 作用 |
|---|---|
| `replacePersonalInfoInResume` | 替换 personalInfo |
| `replaceSectionEntryInResume` | 替换指定 entry |
| `deleteSectionEntryInResume` | 删除 entry，section 空则移除整个 section |
| `insertSectionEntryInResume` | 在指定位置插入 entry，不存在则先 `addSection` |
| `reorderSectionEntriesInResume` | section 内 entry 排序（`fromIndex === toIndex` 不操作） |
| `moveSectionInResume` | section 上/下移（基于 visibleSectionIds 计算边界） |
| `applyToolOutputToResume` | 将 AI tool output 应用到 resume |

## 状态模型

### 单一简历状态

`applicationResumeDataAtom` 是唯一简历数据源。画布、右侧面板、AI 输入都从这份 persisted resume 读取。

### 编辑器状态（纯 UI）

保留的纯交互状态：

- `editModalOpenAtom` — modal 是否打开
- `selectedSectionIdAtom` / `selectedEntryIndexAtom` / `selectedEntryIdAtom` — 编辑目标
- `isResumeAiActionActive` — 是否处于会阻止编辑的 AI 运行阶段

已移除的状态（旧模型残留）：

- `draftRollbackResumeAtom`
- `resumeAutosaveSuspendedAtom`
- 页面级整份 resume 的 RHF form

### Modal 表单状态

- 由 modal 内部局部 `react-hook-form` 持有
- 打开时从 `applicationResumeDataAtom` 派生初始值
- save 时才向全局 resume 产生 mutation
- cancel 直接丢弃，不修改 resume

## 边界规则

- 新建 entry/section 只在 save 成功后才插入画布
- 删除保留二次确认交互，改为非乐观保存
- starter section 删空后保留空 section
- optional section 删掉最后一条 entry 后，整个 section 从 data 和 `sectionOrder` 移除
- truncate rollback 直接基于 persisted resume 做逆操作，不再依赖 draft
