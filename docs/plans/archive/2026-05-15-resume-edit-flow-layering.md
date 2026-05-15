# Resume Edit Flow Layering

## 背景

当前简历编辑页的核心问题，不是缺少一个更大的 “session module”，而是已经存在的几类职责混在了一起：

- draft mutation
- editor state
- persistence handoff
- UI adapter

这导致调用方经常需要同时理解：

- persisted `resume` 和 draft `resume` 的关系
- 当前编辑目标是谁
- rollback 何时存在、何时清理
- 自动保存何时应该暂停
- modal / scroll / popover 何时触发

结果是一个入口动作经常跨越多层。例如：

- 创建新 block 的入口同时负责创建 block、设置 rollback、设置 focus、打开 modal
- `focusSectionAtom` 同时承担选择状态和 DOM 滚动副作用
- 自动保存通过 rollback snapshot 的存在与否来间接推断自己是否应该暂停

本计划的目标，是把这些已有职责先分层，再逐步 deepening，而不是继续引入一个更大的抽象把问题包起来。

## 目标

- 明确区分 `draft mutation`、`editor state`、`persistence handoff`、`UI adapter`
- 让“创建 / 删除 / 补齐 block”这类动作只负责数据变更
- 让“选中谁、是否允许 autosave、是否有 rollback 保护”收敛为独立状态规则
- 让 modal、scroll、点击入口回到 UI adapter 层
- 降低 `resume-page`、`resume-editor`、`resume-canvas-section-entry`、`resume-section-edit-modal` 的跨层协调负担

## 非目标

- 本计划不重做简历编辑页的信息架构
- 本计划不改变现有 section / block 的业务结构
- 本计划不引入新的持久化模型
- 本计划不重构 AI edit log/replay 链路
- 本计划不强制一次性移除所有 Jotai atom

## 当前功能清单

### 1. Draft mutation

当前已存在的能力包括：

- `ensureEditableSection`
- `addBlockBelow`
- `deleteBlock`
- `applyToolOutput`

这些能力应该只负责：

- 返回新的 draft
- 在需要时返回目标 block 信息

这些能力不应该负责：

- 打开 modal
- 设置 popover / dialog 状态
- 执行 DOM 滚动

### 2. Editor state

当前已存在但尚未收口的状态包括：

- `selectedSectionId`
- `selectedBlockId`
- `selectedBlockIndex`
- `rollbackResume`
- “当前是否允许 autosave”的隐式规则

这些状态应该表达“当前编辑目标和保护语义”，而不是顺带承载 UI 副作用。

### 3. Persistence handoff

当前 persistence handoff 主要体现在：

- debounced autosave
- modal 保存后的显式 commit
- draft reset 与 persisted resume 对齐

这层职责应明确回答：

- 哪些变更只停留在 draft
- 哪些时机需要提交到持久化
- autosave 什么时候允许运行

### 4. UI adapter

当前 UI adapter 主要体现在：

- section 点击
- 空态 / 新增 section 入口
- modal 打开 / 关闭
- `scrollIntoView`
- `form-${id}` / `form-${id}-${index}` 这类 DOM id 约定

这层应该只负责交互和呈现，不再持有 rollback 或 draft mutation 规则。

## 目标分层

### `Resume Draft Mutation Module`

职责：

- 创建 block
- 补齐可编辑 `section`
- 删除 block
- 应用 AI output 到 draft

约束：

- 只负责 draft 数据变更
- 可以返回目标 block 的定位信息
- 不直接打开 modal
- 不直接操作 selection atom
- 不直接触发滚动

### `Resume Editor State Module`

职责：

- 表达当前选中的 `section` / `block`
- 管理 rollback snapshot
- 管理 protected edit 的开始 / 结束
- 用显式状态表达 autosave 是否允许

约束：

- 不直接修改 draft 结构
- 不直接渲染 UI
- 不直接依赖 DOM

### `Resume Editor UI Adapters`

职责：

- 响应点击和打开编辑入口
- 决定何时打开 / 关闭 modal
- 做滚动定位和视图对齐

约束：

- 不自己生成 rollback 规则
- 不自己持有 draft mutation 逻辑
- 只组合 mutation/state module 暴露的接口

## 设计原则

- “创建新的 block”只负责创建 block，不顺带打开 modal
- UI 逻辑和状态逻辑分离
- `persisted resume` 和 `draft resume` 语义分开
- autosave 是否暂停仍应属于 editor state；当前接受的实现是由 `editModalOpen` 与 rollback snapshot 共同表达 protected edit，而不是额外引入手动 start / end API
- DOM id 和滚动策略属于 adapter，不属于领域状态

## 分阶段计划

### Phase 1: 术语与职责收口

- 在文档和代码注释中统一区分 `draft mutation`、`editor state`、`persistence handoff`、`UI adapter`
- 标出当前跨层最严重的入口：
  - `resume-editor`
  - `resume-canvas-section-entry`
  - `use-section-click`
  - `resume-section-edit-modal`
- 避免继续把这些职责统称成模糊的 “edit session”

完成标志：

- 团队对现有功能分层有统一说法
- 后续重构能围绕这四层推进，而不是继续堆入口逻辑

### Phase 2: 提炼 `Resume Draft Mutation Module`

- 收敛以下能力到同一组 interface：
  - `ensureEditableSection`
  - `addBlockBelow`
  - `deleteBlock`
  - `applyToolOutput`
- 统一返回值形态，至少包含：
  - `nextResume`
  - `selectedSectionId`
  - 可选的 `selectedBlockId`
  - 可选的 `selectedBlockIndex`
- 清理 mutation interface 中与 modal / scroll / UI 状态直接相关的副作用

完成标志：

- 调用方可以只通过 mutation interface 完成 draft 变更
- mutation 层不再直接打开 modal 或操纵 UI

### Phase 3: 提炼 `Resume Editor State Module`

- 收敛以下状态规则：
  - 当前选择目标
  - rollback snapshot
  - clear selection
  - protected edit 的保护语义
  - autosave suspend / resume
- 让 `resume-page` 通过显式状态判断 autosave 是否可运行
- 逐步削弱 `focusSectionAtom` 中混合的状态 + DOM 副作用

完成标志：

- autosave 暂停规则被收敛到 editor state，并由调用方通过单一 state 读取
- editor state 的接口可独立测试

### Phase 4: UI adapter 回归展示层

- 让 `resume-section-edit-modal` 只负责渲染和转发用户动作
- 让 `use-section-click` 只表达 UI 入口，不再跨层隐式协调 singleton store
- 让空态 / 新增入口显式组合：
  - 先做 draft mutation
  - 再更新 editor state
  - 再打开 UI
- 把 DOM id 和滚动策略收敛到 adapter 层

完成标志：

- 打开 modal 不再是 mutation 的副作用
- 滚动逻辑不再藏在全局状态写入里

### Phase 5: 收紧调用方与测试面

- 简化 `resume-page`：只关心表单与 autosave
- 简化 `resume-editor`：只显式编排数据变更与 UI 打开
- 简化 `resume-canvas-section-entry`：只处理入口意图
- 简化 `resume-section-edit-modal`：只处理展示与确认/取消
- 根据新分层补测试：
  - mutation tests
  - editor state tests
  - 关键 component / flow tests

本轮范围说明：

- 本次收口以下沉 draft mutation、editor state、UI adapter 边界为主
- 测试完成标准以下列 targeted coverage 为准，不强制新增 Playwright resume edit flow regression
- 若后续再次大幅调整 resume edit 主流程，再补高风险 UI flow regression

完成标志：

- 关键入口不再自己拼装 rollback + focus + modal choreography
- 测试可以按层定位问题，而不是每次都挂整页环境

## 涉及文件

- [components/resumes/resume-page.tsx](/Users/yutao/IdeaProjects/jobi/components/resumes/resume-page.tsx)
- [lib/store/resume.ts](/Users/yutao/IdeaProjects/jobi/lib/store/resume.ts)
- [lib/hooks/use-resume-draft.ts](/Users/yutao/IdeaProjects/jobi/lib/hooks/use-resume-draft.ts)
- [components/resumes/resume-section-edit-modal.tsx](/Users/yutao/IdeaProjects/jobi/components/resumes/resume-section-edit-modal.tsx)
- [lib/hooks/use-section-click.ts](/Users/yutao/IdeaProjects/jobi/lib/hooks/use-section-click.ts)
- [components/resumes/resume-context.tsx](/Users/yutao/IdeaProjects/jobi/components/resumes/resume-context.tsx)
- [components/resumes/resume-editor.tsx](/Users/yutao/IdeaProjects/jobi/components/resumes/resume-editor.tsx)
- [components/resumes/resume-canvas-section-entry.tsx](/Users/yutao/IdeaProjects/jobi/components/resumes/resume-canvas-section-entry.tsx)

## 风险与注意点

- `selectedBlockIndex` 当前部分依赖 persisted resume 反推，重构时要防止选择状态和 draft 脱节
- `personalInfo` 是特殊 section，mutation interface 需要显式处理它的无 block 语义
- autosave 与 rollback 的关系如果改动不完整，容易引入“误保存临时 block”或“关闭 modal 后丢失真实修改”
- `focusSectionAtom` 目前混有 DOM 副作用，迁移时要避免 UI 行为回退

## 并行化建议

实施时可按下列方式拆分并行工作：

- `explorer`
  - 梳理 `resume-page`、`resume-editor`、`resume-canvas-section-entry` 当前入口调用链
  - 梳理 `focusSectionAtom`、rollback、autosave 的耦合点
- `worker`
  - 一个 worker 负责 mutation module 收口
  - 一个 worker 负责 editor state 收口
  - UI adapter 调整由主线程或第三个 worker 集成
- `playwright_tester`
  - 当改动触及列表页、表单、弹窗、导航跳转外的编辑主流程时，做针对性回归
  - 优先覆盖：空白简历起步、section 点击编辑、新增 block、取消回滚、保存提交

## 验证建议

至少验证以下路径：

- 空白简历从画布开始添加 section
- 已有 section 中新增 block 后进入编辑
- 打开 modal 后取消，draft 正确回滚
- 打开 modal 后保存，draft 正确提交
- autosave 不会在 protected edit 期间误触发
- `personalInfo` 的编辑路径仍然正常
