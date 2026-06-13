# Resume Entry Drag Reorder

## 背景

当前 resume editor 的 entry hover 交互只支持：

- 编辑
- 在当前 entry 下方新增
- 删除

用户希望在画布上直接调整同一 section 内 entry 的顺序。现有代码里虽然已经存在 AI tool 用的 `reorderEntries` contract，但本地编辑器还没有桌面端可用的拖拽排序交互。

结合当前实现，`default` / `modern` 模板的 entry 列表都复用 `components/resume-templates/section-entries.tsx`，因此这项能力适合在共享 entry 渲染层一次落地，而不是为单个模板单独实现。

## 目标

- 为所有可排序 section 提供统一的 entry 拖拽排序能力
- 用户 hover 到 entry 时，在左侧显示悬浮拖拽手柄
- 仅支持同一 section 内的 entry 重排
- 拖动过程中实时预览顺序变化
- drop 后立即保存到服务端
- 保存失败时回退到原顺序，并给出明确错误提示
- 与现有编辑 / 新增 / 删除 hover 交互共存

## 非目标

- 不做上下移动按钮版本
- 不支持跨 section 拖拽
- 不处理移动端 / 触屏交互
- 本轮不补键盘排序能力
- 不重做现有编辑 / 新增 / 删除按钮组视觉结构
- 不改动 AI reorder contract 本身

## 已确认决策

### 1. 能力范围

- 全局通用，覆盖所有可排序 section 与模板
- 仅支持同一 section 内排序
- 只有 section 内 entry 数量大于 1 时才显示拖拽手柄

### 2. 交互形式

- 不使用上下按钮，改为鼠标拖拽
- 仅允许通过左侧拖拽手柄触发拖拽
- 桌面端仅在 hover entry 时显示手柄
- entry 本体与左侧手柄视为同一个 hover 区域，避免手柄闪烁消失
- 手柄悬浮在左侧，不挤动正文布局
- 使用极简 grip 图标，无文字
- 设置一个很小的拖拽激活阈值，减少误触

### 3. 拖拽反馈与保存语义

- 拖动过程中实时预览顺序变化
- drop 后立即持久化保存
- 原位 drop 不保存
- 保存失败时回退到原顺序并 toast 提示
- AI 正在执行 resume action 时禁用拖拽

### 4. 与现有交互的关系

- 保留现有 hover 按钮组（编辑 / 新增 / 删除）
- 拖拽排序是新增能力，不替换现有内容编辑入口

## 代码现状

### 共享 entry 渲染层

- `components/resume-templates/section-entries.tsx`
  - 负责渲染各 section 的 entry 列表
  - 每个 entry 当前包裹在 `ResumeSectionActionButtonGroup` 中
- `components/resume-templates/resume-section-action-button-group.tsx`
  - 负责 hover 显示编辑 / 新增 / 删除操作

### 数据与保存层

- `lib/store/resume.ts`
  - `applicationResumeDataAtom` 是当前唯一 resume 数据源
  - `saveApplicationResume()` 负责落库并在成功后更新 store
- `lib/hooks/use-entry-edit-workflow.ts`
  - 当前已封装新增 / 编辑 / 删除 entry 的工作流
- `lib/resume/mutations.ts`
  - 已有插入、替换、删除等 resume 纯函数 mutation
  - 当前缺少本地 entry reorder helper

### 现有依赖

项目已安装：

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

可直接用于实现桌面端拖拽排序。

## 建议方案

## 1. 在共享 entry 层接入 sortable 能力

在 `section-entries.tsx` 中把 section 内 `entries` 渲染为 sortable list：

- 以 `entry.entryId` 作为 sortable item id
- 每个 entry 包装成 sortable item
- 只在当前 section 内建立 `SortableContext`
- 不支持跨 section 的 drag target

这样 `default` / `modern` 模板可以自动复用，无需分别接线。

## 2. 把拖拽手柄并入现有 action 容器

在 `ResumeSectionActionButtonGroup` 层新增左侧 drag handle 能力：

- 由父层传入 `dragHandleProps` / `dragListeners` / `dragAttributes`
- 左侧悬浮显示，不占正文布局
- 仅在 hover 可见
- 与 entry 本体共享 hover 区
- 当 entry 不可拖拽时不渲染手柄

这里仍保留右侧现有编辑 / 新增 / 删除按钮。

## 3. 新增本地 reorder mutation helper

在 `lib/resume/mutations.ts` 增加纯函数，例如：

- `reorderSectionEntriesInResume(resume, sectionId, fromIndex, toIndex)`

要求：

- 不改变其他 section
- `fromIndex === toIndex` 时直接返回原 resume 或等价结果
- 保持 starter / optional section 语义不变，仅改变 entries 顺序

## 4. 新增 reorder + persist 工作流

在 `use-entry-edit-workflow.ts`（或相邻专用 hook）中新增工作流，例如：

- `reorderAndPersistEntry(sectionId, fromIndex, toIndex)`

职责：

1. 基于当前 persisted resume 计算 `nextResume`
2. 先乐观更新本地列表顺序用于拖拽完成后的即时反馈
3. 调用 `saveApplicationResume(nextResume)`
4. 保存成功则保持当前顺序
5. 保存失败则回退到原顺序并 toast 报错
6. 若 `fromIndex === toIndex`，直接跳过

注意：

- 这条路径虽然在 drop 后先更新本地再保存，但失败必须完整回退
- 需要防止拖拽中的重复保存或并发 drop

## 5. 禁用规则

以下情况禁用拖拽：

- `useIsResumeAiActionActive()` 为 `true`
- 当前 section entry 数量小于等于 1
- 当前 item 没有有效 `entryId`
- section 数据不存在

禁用后：

- 不显示可交互手柄
- 不启动 drag sensor
- 仍保留已有非拖拽显示逻辑

## 实施步骤

### Phase 1: 数据与工作流

- 在 `lib/resume/mutations.ts` 增加 entry reorder helper
- 在 `use-entry-edit-workflow.ts` 增加 reorder + persist 工作流
- 明确保存失败回退逻辑

### Phase 2: 共享 UI 接线

- 在 `section-entries.tsx` 接入 `dnd-kit` sortable list
- 为每个 entry 提供 sortable item 包装
- 在 `resume-section-action-button-group.tsx` 增加左侧拖拽手柄入口
- 调整 hover 区域，保证鼠标移向左侧手柄时不会闪烁

### Phase 3: 视觉与状态打磨

- 采用轻量拖拽反馈：阴影增强 + 透明度变化
- 控制手柄显隐与悬浮位置
- 加入 activation constraint，减少误触
- AI running 时禁用拖拽

### Phase 4: 测试与回归

- 补 Vitest 组件 / 行为测试
- 针对 resume editor 主路径做一轮 targeted UI regression

## 测试计划

### 组件 / 行为测试

至少覆盖：

- section 内有多条 entry 时显示拖拽手柄
- section 内只有一条 entry 时不显示拖拽手柄
- hover entry 时左侧手柄显示，移向手柄时不会消失
- reorder 成功后顺序变化且触发保存
- 原位 drop 不保存
- 保存失败时顺序回退
- AI 运行中禁用拖拽
- 现有编辑 / 新增 / 删除按钮不受影响

### 回归检查

建议完成代码后检查：

- `default` 模板下 education / employment / skills 的拖拽
- `modern` 模板下 education / employment / skills 的拖拽
- 拖拽后编辑 entry、删除 entry、在中间插入新 entry 仍正常
- 长内容 entry 拖拽时画布排版不抖动

如改动进入主流程稳定版，应补一轮 Playwright 定向回归。

## 并行执行建议

真正开始实施时，可按下面方式拆分：

- 一路并行做共享层代码探索与 `dnd-kit` 接线设计
- 一路并行做 mutation / workflow 设计
- 收敛后统一补测试与 UI 回归

由于共享层和数据层会在 `section-entries.tsx` / `use-entry-edit-workflow.ts` 处汇合，真正落地代码前应先统一接口，再分工实现。

## 验收标准

- 用户在桌面端 hover 任意可排序 section 的 entry 时，可看到左侧拖拽手柄
- 用户只能通过该手柄拖拽，同一 section 内顺序可实时预览
- drop 后顺序会立即保存
- 原位 drop 不触发保存
- 保存失败时顺序会回退，并给出清晰错误提示
- AI 运行时拖拽被禁用
- 现有编辑 / 新增 / 删除交互不回归
- `default` / `modern` 模板均可用

## 预期结果

这项计划完成后，resume editor 的 entry 排序将从“缺失能力”提升为“直接在画布上完成的自然操作”。用户不需要进入表单，也不需要依赖 AI 或未来的上下按钮，就能以更符合直觉的方式整理 section 内内容顺序。
