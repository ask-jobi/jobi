# Resume Section Manual Reorder

## 背景

当前 resume editor 已支持：

- section 的新增 / 编辑 / 删除
- entry 级新增 / 编辑 / 删除
- AI tool 层的 `reorderSections` contract
- `default` 模板基于 `sectionOrder` 渲染 section

但用户在本地编辑器里仍然不能直接调整 section 顺序。同时，现有 `sectionOrder` 与 section 生命周期语义还不够干净：

- `modern` 模板没有统一遵守 `sectionOrder`
- `normalizeSectionOrder()` 仍会把顺序拉回 `DEFAULT_SECTION_ORDER`
- starter section 仍有特殊生命周期
- 空白简历默认创建 `education` / `skills`
- `sectionOrder` 可能保留当前简历里并未真实存在或不可见的 section

如果要支持 section 手动 reorder，上述语义必须一并收敛，否则会出现：

- 用户刚手动调好的顺序被系统自动“纠正”
- 不同模板、打印页、预览页顺序不一致
- 画布里能看到的 section 顺序与底层 `sectionOrder` 不一致
- 空白简历和 starter section 继续带来隐藏分支

## 目标

- 支持桌面端在简历画布里手动调整 section 顺序
- 使用 section title 旁的上移 / 下移按钮，而不是拖拽
- 让 `sectionOrder` 成为所有渲染面共同遵守的真实顺序源
- 收敛 section 生命周期语义，移除 starter section 特殊规则
- 让空白简历真正从 `personalInfo + 空 sectionOrder` 起步
- 让新增 / 删除 / 重排 section 的行为更可预测、更易测试

## 非目标

- 本轮不做 section 拖拽排序
- 不考虑移动端交互
- 不让 `personalInfo` 参与排序
- 不改 AI reorder contract 本身
- 不引入独立的“管理 section 顺序”面板
- 不在本轮扩展键盘排序能力
- 不重做模板产品化或模板切换 UI

## 已确认决策

### 1. 排序范围与语义

- `personalInfo` 固定在顶部，不参与排序
- 其他 section 可任意排序
- `sectionOrder` 应成为编辑画布 / 模板渲染 / 预览 / 导出的统一顺序源
- `sectionOrder` 不再按 `DEFAULT_SECTION_ORDER` 自动重排

### 2. 交互形式

- 不用拖拽，改为 section title 旁两个圆形 icon 按钮
- 按钮语义是单步上移 / 单步下移
- 按钮在桌面端编辑态下 hover / focus 当前 section 时显示
- icon-only 按钮必须带 tooltip + aria-label
- 边界 section 保留两个按钮，但不可移动方向置灰禁用

### 3. 保存与反馈语义

- 点击上移 / 下移后，先乐观更新本地顺序，再立即持久化
- 保存失败时回滚到原顺序
- 保存成功后，对当前 section 轻量 `scrollIntoView({ behavior: "smooth", block: "nearest" })`
- AI 正在执行 resume action 时禁用 section reorder

### 4. sectionOrder 新语义

- `sectionOrder` 只保存当前 resume data 中存在的 section
- `存在` 的定义是：该 section 在当前 resume data 中有数据结构
- `undefined` / 缺失表示该 section 不存在
- 不再保留“在顺序里存在、但当前简历里不可见或并不存在”的 section

### 5. 生命周期统一

- 取消 starter section 的特殊生命周期
- `education` / `skills` 不再享有“删空后仍保留”的特殊规则
- 任一 section 删除到空后，都可以从 resume data 和 `sectionOrder` 中移除
- 空白简历初始不默认创建任何 sortable section，`sectionOrder = []`

### 6. 新增 section 规则

- 新增 section 默认追加到当前 `sectionOrder` 末尾
- 继续沿用现有行为：Add section 先确保 section 结构存在，再进入 entry 编辑；只有保存后才真正写入 entry

### 7. personalInfo 规则

- `personalInfo` 继续单独渲染
- `personalInfo` 不显示排序按钮

### 8. 模板与文档范围

- `modern` 也必须遵守相同的 `sectionOrder` 语义
- 本次同步更新相关文档，至少更新 `docs/web-structure.md`

## 代码现状

### 渲染层

- `components/resume-templates/default-template.tsx`
  - 已按 `data.sectionOrder` 动态渲染
- `components/resume-templates/modern-template.tsx`
  - 仍按固定 JSX 顺序渲染，且仅覆盖部分 section
- `components/resume-templates/section-entries.tsx`
  - 是各 section 共享的容器与标题入口，适合承载 section-level reorder controls
- `components/resume-templates/resume-section-action-button-group.tsx`
  - 已有 hover/focus 显示交互，可复用类似显隐模式

### 数据与 mutation 层

- `types/resume.ts`
  - `sectionOrder` 当前仍是 `SortableSectionKey[]`
- `lib/templates/section-helpers.ts`
  - `normalizeSectionOrder()` 仍按默认顺序过滤重排
  - `addSection()` 目前会经过 `normalizeSectionOrder()`
  - `removeSection()` 仍保留 starter section 特殊逻辑
- `lib/templates/section-definitions.ts`
  - 仍包含 `DEFAULT_STARTER_SECTION_IDS` / `isStarterSection()` 语义
- `lib/templates/section-factories.ts`
  - `buildEmptyResumeData()` 仍默认创建 `education` / `skills`

### 编辑工作流

- `lib/hooks/use-entry-edit-workflow.ts`
  - 已有 entry 级 optimistic reorder + persist + rollback 模式，可作为 section reorder 的实现参考
- `lib/store/resume.ts`
  - `applicationResumeDataAtom` 是当前 resume 数据源
  - `saveApplicationResume()` 是统一保存入口

### 文档现状

- `docs/web-structure.md`
  - 仍描述空白简历默认创建 starter section
  - 仍描述删除 starter section 最后一条 entry 后只会清空，不会移除
- `docs/plans/current/blank-resume-defaults.md`
  - 部分描述仍基于“required / starter section 保留结构”的旧语义

## 建议方案

### 1. 收敛 sectionOrder 为用户顺序源

调整 `normalizeSectionOrder()` 与相关 helper 的职责：

- 只做去重与未知 section 过滤
- 不再按 `DEFAULT_SECTION_ORDER` 重排用户顺序
- 保持传入顺序稳定

并同步调整：

- `addSection()`：若新增 section，不插默认语义位置，直接追加到末尾
- `removeSection()`：删除 section 时同步从 data 与 `sectionOrder` 移除

### 2. 统一 section 生命周期

移除 starter section 特例：

- 删除 `isStarterSection()` 相关分支，或把它从生命周期逻辑中剥离
- `education` / `skills` 与其他 section 一样按存在/不存在管理
- 空白简历初始只保留 `personalInfo` 与空 `sectionOrder`

这样可保证：

- `sectionOrder` 与真实存在 section 一一对应
- section reorder 不必再处理“隐藏但保留”的 section
- 空白简历从 0 到 1 的 section 添加路径与后续行为一致

### 3. 在共享 section 标题层接入上移 / 下移按钮

在 `section-entries.tsx` 中为 section title 增加统一的 section-level reorder controls：

- 使用两个圆形 icon-only button
- 图标建议 `ChevronUp` / `ChevronDown`
- 带 tooltip 与 aria-label
- 仅在 `isInteractive` 且提供 `onSectionMoveUp` / `onSectionMoveDown` 时启用
- hover/focus 当前 section 时显示
- `personalInfo` 不接这组控件

建议抽一个小组件，例如：

- `ResumeSectionReorderControls`

职责：

- 渲染上移 / 下移按钮
- 根据可见 section 位置计算禁用态
- 封装 tooltip / icon button 视觉

### 4. 基于“当前可见 section”计算移动方向

section 上移 / 下移的心智只基于当前画布可见 section 列表：

- 只对当前可渲染出来的 section 计算前一个 / 后一个可见 section
- 生成新的完整 `sectionOrder` 时，只重排这些可见 section 的相对顺序
- 不再保留“顺序里有但当前并不存在”的 section，因此这条规则在新语义下会自然简化

### 5. 新增 section reorder + persist 工作流

参考 entry reorder 的模式，在 `use-entry-edit-workflow.ts`（或相邻专用 hook）新增能力，例如：

- `moveSectionUpAndPersist(sectionId)`
- `moveSectionDownAndPersist(sectionId)`
- 或统一为 `moveSectionAndPersist(sectionId, direction)`

职责：

1. 基于当前 resume 计算 `nextResume`
2. 先 `replacePersistedResume(nextResume)` 做乐观更新
3. 调用 `saveApplicationResume(nextResume)`
4. 保存失败则回滚到原 resume
5. 保存成功后滚动到该 section 容器
6. 保存进行中阻止额外 section reorder

必要时可增加一个 `isSectionReorderPending` 状态，避免连续点击导致并发保存。

### 6. 让 default / modern 统一遵守 sectionOrder

- `default-template.tsx` 保持动态渲染策略
- `modern-template.tsx` 改为至少对其已支持的 section 按 `data.sectionOrder` 动态渲染
- 对 `modern` 当前未支持的 section，要给出明确策略：
  - 要么本轮补齐共享 renderer
  - 要么至少在渲染时安全跳过，但不能再用写死顺序

目标不是本轮完成模板产品化，而是保证：

- 同一份 resume 在不同模板、预览、导出中的 section 顺序语义一致

### 7. 同步清理空白简历起步语义

由于 section 生命周期已经统一，本轮需要同步收敛空白简历的基础结构：

- `buildEmptyResumeData()` 不再默认创建 `education` / `skills`
- 画布空态继续通过 `Add Section` 入口引导用户开始
- 文档与测试数据同步更新为新的最小简历结构

## 实施步骤

### Phase 1: sectionOrder 与生命周期语义收敛

- 调整 `normalizeSectionOrder()`，取消默认顺序重排
- 调整 `addSection()` 追加策略
- 调整 `removeSection()`，移除 starter section 特殊逻辑
- 调整 `buildEmptyResumeData()`，让空白简历初始 `sectionOrder = []`
- 清理或降级 `DEFAULT_STARTER_SECTION_IDS` / `isStarterSection()` 的生命周期职责

### Phase 2: section reorder mutation 与工作流

- 在 `lib/resume/mutations.ts` 增加 section move helper
- 在 `use-entry-edit-workflow.ts` 或相邻 hook 增加 optimistic reorder + persist + rollback 工作流
- 增加保存中禁用状态与滚动回定位逻辑

### Phase 3: 共享 UI 接线

- 在 `section-entries.tsx` 接入 section title reorder controls
- 增加圆形 icon-only 按钮、tooltip、aria-label
- 与现有 hover/focus 显示逻辑对齐
- 边界禁用态稳定展示

### Phase 4: 模板一致性修正

- `default-template.tsx` 接入 section move callbacks
- `modern-template.tsx` 改为按 `sectionOrder` 渲染已支持 section
- 确保预览 / 导出链路同样遵守新顺序语义

### Phase 5: 文档与回归

- 更新 `docs/web-structure.md`
- 视情况同步收敛 `docs/plans/current/blank-resume-defaults.md` 中已过时描述
- 补测试并做定向 UI 回归

## 测试计划

### 单元 / 组件测试

至少覆盖：

- `normalizeSectionOrder()` 不再按默认顺序重排，只做去重和过滤
- 新增 section 时追加到末尾
- 删除任一 section 后，会从 data 与 `sectionOrder` 同步移除
- 空白简历初始 `sectionOrder = []`
- section title hover / focus 时显示上移 / 下移按钮
- 顶部可见 section 的上移按钮禁用
- 底部可见 section 的下移按钮禁用
- 点击上移 / 下移后触发正确的 section move workflow
- 保存失败时顺序回滚
- `personalInfo` 不显示排序按钮
- AI running 时 section reorder 被禁用
- `modern` 模板对已支持 section 遵守 `sectionOrder`

### 回归检查

建议完成代码后检查：

- 空白简历创建后，画布从真正空状态起步
- 从空白状态添加 section 后，section 出现在末尾并可继续编辑
- 删除任一 section 最后一条 entry 后，section 真正移除
- 在 `default` 模板中多 section 上移 / 下移行为正常
- 在 `modern` 模板中顺序语义与 `default` 一致
- 导出 PDF 后的 section 顺序与编辑页一致

如改动进入 UI 主流程稳定版，应补一轮 Playwright 定向回归。

## 并行执行建议

真正实施时，可按下面方式拆分：

- 一路并行梳理 `sectionOrder` / blank resume / 生命周期 helper 变更
- 一路并行实现 section reorder workflow 与共享 UI 控件
- 收敛后统一处理 `modern` 模板一致性、测试和文档

如果后续需要并行 agent 执行，优先保证先统一接口：

- `sectionOrder` helper 新语义
- section move workflow interface
- `SectionEntries` 的 section-level controls props

## 验收标准

- 用户可在桌面端编辑画布中，通过 section title 旁的上移 / 下移按钮调整 section 顺序
- `personalInfo` 固定顶部，且不显示排序按钮
- section 顺序调整后立即保存，失败回滚
- 保存成功后当前 section 仍保持在用户视野附近
- `sectionOrder` 只保存当前 resume data 中真实存在的 section
- 空白简历初始不默认创建 `education` / `skills`
- 删除 section 最后一条 entry 后，该 section 会从 data 与 `sectionOrder` 中移除
- `default` / `modern` / 预览 / 导出遵守同一顺序语义
- 相关文档与实现一致，不再保留 starter section 旧规则

## 预期结果

这项计划完成后，resume editor 的 section 顺序将从“仅存在于数据层与 AI tool 的能力”升级为“用户可直接在画布上控制的显式能力”。同时，`sectionOrder` 与 section 生命周期会收敛成更简单的一套规则：存在即在顺序里，不存在就不保留，新增默认追加，删除真正移除。这样不仅能让手动 reorder 更自然，也会让模板一致性、空白简历起步流程和后续测试维护成本一起下降。
