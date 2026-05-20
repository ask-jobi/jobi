# Resume Editor Canvas Interactions

**归档日期:** 2026-05-20
**来源计划:** `docs/plans/archive/2026-05-20-resume-entry-drag-reorder.md`、`docs/plans/archive/2026-05-20-resume-section-manual-reorder.md`、`docs/plans/archive/blank-resume-defaults.md`

## 实现了什么

简历画布支持三种交互：
1. **Entry 拖拽排序** — 同一 section 内通过拖拽手柄重排 entry
2. **Section 上/下移** — section title 旁的圆形按钮移动 section
3. **空白简历起步** — 空 sectionOrder 起步，画布 Add Section 入口

## 关键文件

| 文件 | 职责 |
|---|---|
| `components/resume-templates/section-entries.tsx` | 共享 entry 渲染层，承载 dnd-kit sortable + section reorder controls |
| `components/resume-templates/resume-section-action-button-group.tsx` | Hover 按钮组容器（含 drag handle、edit/add/delete、section move） |
| `components/resume-templates/resume-section-drag-handle.tsx` | Entry 拖拽手柄组件（grip 图标） |
| `components/resume-templates/resume-section-reorder-controls.tsx` | Section 上/下移圆形按钮（ChevronUp/Down） |
| `components/resumes/resume-canvas-section-entry.tsx` | 空白画布 Add Section 入口 + 非空画布底部 Add Section 入口 |
| `components/resumes/resume-editor.tsx` | 顶层接线：将 workflow hooks 与 Template props 对接 |
| `components/resume-templates/default-template.tsx` | 按 `sectionOrder` 动态渲染 section，计算 canMoveSectionUp/Down |
| `components/resume-templates/modern-template.tsx` | 按 `sectionOrder` 动态渲染（已对齐 default 语义） |
| `lib/hooks/use-entry-edit-workflow.ts` | `reorderAndPersistEntry` + `moveSectionAndPersist` 工作流 |

## Entry 拖拽排序

### 交互规则

- 通过左侧 drag handle 触发拖拽（grip 图标，无文字）
- 仅在 hover entry 时显示手柄
- entry 本体与左侧手柄视为同一个 hover 区域
- 拖拽激活阈值 4px，减少误触
- 仅同一 section 内排序，不支持跨 section
- section 内 entry > 1 时才显示手柄

### 保存语义

```
drop → 乐观更新本地顺序 → saveApplicationResume() → 成功保持 / 失败回退
原位 drop（fromIndex === toIndex）→ 不保存
```

### 禁用条件

- `isEntryReorderPending` 为 true
- AI 正在执行 resume action
- 移动端
- section entry 数量 ≤ 1
- entry 没有有效 entryId

### 技术实现

- 使用 `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
- `SortableContext` 以 `entry.entryId` 作为 item id
- `DndContext` 使用 `closestCenter` 碰撞检测 + `restrictToVerticalAxis` 修饰器
- `onDragOver` 实时更新本地顺序预览，`onDragEnd` 触发 persist
- `onDragCancel` 回退到 `persistedEntryIds`

## Section 上/下移

### 交互规则

- Section title 旁两个圆形 icon 按钮（ChevronUp / ChevronDown）
- 桌面端 hover/focus 当前 section 时显示
- 带 tooltip + aria-label
- 顶部 section 上移禁用，底部 section 下移禁用
- `personalInfo` 不显示排序按钮

### 保存语义

```
点击 → 乐观更新本地顺序 → saveApplicationResume() → 成功保持 + scrollIntoView / 失败回退
```

`isSectionReorderPending` 期间阻止额外 section reorder。

### 顺序计算

基于 `visibleSectionIds`（`sectionOrder` 中在当前 resume 有数据且 entries > 0 的 section）计算移动方向：

```ts
// default-template.tsx
const visibleIndex = visibleSectionIds.indexOf(sectionId)
canMoveSectionUp = visibleIndex > 0
canMoveSectionDown = visibleIndex !== -1 && visibleIndex < visibleSectionIds.length - 1
```

### sectionOrder 语义

`sectionOrder` 已成为所有渲染面的统一顺序源：

- `normalizeSectionOrder()` 只去重 + 过滤未知 section，不重排
- `removeSection()` 从 data 和 sectionOrder 同步移除
- `addSection()` 追加到末尾
- `modern-template.tsx` 按 `data.sectionOrder.map()` 动态渲染
- sectionOrder 只保存当前 resume data 中存在的 section

### Section 生命周期

- 取消 starter section 特殊规则：`DEFAULT_STARTER_SECTION_IDS = []`
- `education` / `skills` 与其他 section 一样按存在/不存在管理
- 删除任一 section 最后一条 entry → 整个 section 移除
- 新增 section → 自动追加到 sectionOrder 末尾

## 空白简历起步

### 初始结构

```ts
buildEmptyResumeData() → {
  sectionOrder: [],
  personalInfo: { entryId, firstName: "", lastName: "", email: "", phone: "", website: "", linkedin: "" }
}
```

无默认 sortable section，所有 section 按需创建。

### 画布入口

- **空白简历**：画布中央显示 `Add Section` 入口
- **非空简历**：画布底部显示 `Add Section` 入口
- 弹层内展示常见起步 section 列表
- 选中后立即打开对应编辑弹窗
- 已添加但空的 optional section 可从菜单重新进入
