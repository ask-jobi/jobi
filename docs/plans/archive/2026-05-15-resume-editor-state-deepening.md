# Resume Editor State Deepening

## 背景

当前简历编辑页已经具备可用功能，但编辑态状态分布在多处：

- `react-hook-form` 持有页面内表单值
- `lib/store/resume.ts` 中的 Jotai store 同时持有一份 `resumeData`
- 画布操作、弹窗操作、自动保存各自拼接 `getValues()`、`reset()`、`updateResumeData()`、`updateResumeDataWithSave()`

这让 `resume editor` 这个 module 的 interface 偏复杂：

- 调用方需要理解 form state 和 store state 两套内容状态
- 新增 block、删除 block、section 引导、回滚、自动保存都在重复协调两套状态
- 改动一个编辑动作时，容易引入“先改哪一份状态”的隐式约束

同时，简历模板选择目前仍停留在代码能力层：

- `useResumeTemplate` 的 API 可以保留
- 本次不把模板切换接入产品流
- 本次不引入 `templateId` 持久化

## 目标

- 收敛简历编辑页的内容状态 ownership
- 让 `useResume` 成为 `jobApplication` 作用域下的全局会话 API
- 让 `/application/[id]/resume` 页面内部拥有一条更深的 `draft` seam
- 减少 `reset()`、`getValues()`、直接写 store 之间的重复协调代码
- 为后续模板切换、更多编辑动作和测试收缩创造更好的 locality

## 非目标

- 本次不实现模板切换 UI
- 本次不实现模板选择持久化
- 本次不重做右侧面板信息架构
- 本次不改动简历 section 的业务结构
- 本次不强制把所有 Jotai atom 全部移除

## 当前问题

### 1. 内容状态有两个 owner

当前编辑页里，`react-hook-form` 和 Jotai 都在持有“正在编辑的简历内容”。

结果是：

- `resume-page.tsx` 要监听 form change 再同步保存
- `resume-editor.tsx` 的画布操作会同时碰 form 和 store
- `resume-canvas-section-entry.tsx` 的 section 引导也在重复同样的同步过程

这说明“编辑中的简历草稿”还没有明确 seam。

### 2. `useResume` 的 interface 不够聚焦

`useResume` 现在同时承担：

- application 会话读取
- job 读取和更新
- evaluation 读取和刷新
- 简历内容读写
- 自动保存辅助

这会让 caller 很难判断：

- 这里拿到的是已保存内容，还是编辑中的草稿
- 这里应该更新 form，还是更新 store
- 这里为什么要 `reset()` 才能对齐 UI

### 3. 编辑动作缺少统一 command seam

当前常见编辑动作：

- 添加 section
- 添加 block
- 删除 block
- 打开 block 编辑
- 回滚草稿
- 提交草稿

这些行为分散在多个 caller 中各自实现，导致重复的实现细节外溢。

## 设计原则

- `useResume` 负责 `jobApplication` 作用域下的全局会话，不直接持有编辑中的内容草稿
- 编辑中的 `draft resume` 只在 `/application/[id]/resume` 页面范围内存在
- 画布、弹窗、表单围绕同一条 `draft` seam 协作
- `persisted resume` 和 `draft resume` 语义必须分开
- 尽量保留现有业务行为和 UI 流程，不做额外交互重构
- `useResumeTemplate` API 保留，但继续停留在默认模板能力，不进入产品流

## 建议方案

### 1. 把 `useResume` 收敛成会话 module

`useResume` 保留为全局 API，但 interface 收敛成稳定的会话数据与动作：

- `application`
- `job`
- `language`
- `persistedResume`
- `resumeEvaluation`
- `evaluationRefreshFlag`
- `refreshEvaluationReport`
- `saveResume`

这里的关键点是：

- `useResume` 不再作为编辑中的草稿 owner
- 它负责已保存数据和跨页面共享状态
- 只要页面在 `jobApplication id` 的作用域下，就可以访问这套 API

### 2. 在编辑页引入 `draft` seam

在 `/application/[id]/resume` 页面内部新增一层更深的编辑 module，例如：

- `ResumeDraftProvider`
- `useResumeDraft`

这层 module 的 interface 负责：

- `draft`
- `resetDraft`
- `commitDraft`
- `rollbackDraft`
- `addSection`
- `addBlockBelow`
- `deleteBlock`
- `focusSection`

`draft` 的实际 owner 由 `react-hook-form` 持有。

这样 caller 不需要再自己决定：

- 是调用 `getValues()` 还是读 Jotai
- 是先 `reset()` 还是先写 store
- rollback 时该恢复哪一份内容

### 3. 明确 `persisted resume` 与 `draft resume`

语义上需要拆成两类状态：

- `persisted resume`
  - 来自 server / store
  - 给其他非编辑页共享访问
  - 表示最近一次已保存结果

- `draft resume`
  - 只在编辑页内可见
  - 表示当前未必已保存的修改
  - 由 form state 驱动画布和弹窗

这样可以避免未来其他页面误用“未保存草稿”。

### 4. 统一编辑动作走 command module

现有这些辅助函数和流程可以向一处收拢：

- `ensureSectionHasEditableBlock`
- `insertDraftBlockBelow`
- 删除 block 的逻辑
- modal rollback / save 完成逻辑

目标是让 `ResumeEditor`、`ResumeCanvasSectionEntry`、`ResumeSectionEditModal` 只表达 UI，少做内容变更编排。

### 5. 保留模板 API，但不接产品流

本次对模板相关的约束是：

- `useResumeTemplate` 继续保留
- 当前编辑页、预览页、打印页继续默认使用现有模板
- 不新增模板状态持久化
- 不新增模板切换入口

这样能避免本次状态重构和模板产品化耦合在一起。

## 模块职责调整

### `useResume`

负责：

- application 作用域的会话读取
- job / evaluation / language 等共享状态
- 已保存简历的读取与保存动作

不再负责：

- 编辑页实时草稿内容的 owner
- 直接暴露“随手改简历内容”的快捷入口

### `useResumeDraft`

负责：

- 编辑页草稿内容
- 草稿级 command
- modal / 画布 / 表单共享的编辑行为

不负责：

- 跨页面共享
- evaluation 缓存
- job 信息共享

### `ResumePage`

负责：

- 初始化 form draft
- 承载 `ResumeDraftProvider`
- 处理自动保存节流策略

减少负责：

- form 和全局 store 的双向内容同步细节

### `ResumeEditor` / `ResumeCanvasSectionEntry` / `ResumeSectionEditModal`

负责：

- 消费统一的 `draft` seam
- 调用 command
- 渲染对应 UI

减少负责：

- 自己拼接 `getValues()`、`reset()`、`updateResumeDataWithSave()`

## 实施步骤

### Phase 1: 语义收敛

- 把 `resumeDataAtom` 的语义改成 `persistedResume`
- 梳理 `useResume` 暴露的字段和方法，剥离草稿 owner 角色
- 明确哪些 atom 属于 UI state，哪些属于 persisted session state

### Phase 2: 引入 draft seam

- 在编辑页增加 `ResumeDraftProvider` 或同等 module
- 让画布预览直接读取 form draft
- 把新增 section / 新增 block / 删除 block 迁移到统一 command

### Phase 3: 收缩 caller

- 简化 `ResumeEditor`
- 简化 `ResumeCanvasSectionEntry`
- 简化 `ResumeSectionEditModal`
- 去掉重复的 form/store 双写逻辑

### Phase 4: 验证与回归

- 补足 command 级测试
- 保留关键 UI 回归测试
- 检查自动保存、回滚、空白简历起步路径

## 测试建议

至少覆盖以下路径：

- 空白简历从画布添加 section 后进入编辑
- 已有 section 中新增 block
- 删除 block 后画布和表单同步更新
- modal 关闭时 rollback 正常
- modal 保存后 persisted 数据更新
- 自动保存不会因为 draft/provider 重构失效
- 打开同一 `jobApplication id` 下其他页面时，仍能读到 `useResume` 的共享会话数据

如果改动影响画布主流程，应补一次针对性 Playwright 回归。

## 风险与注意事项

- 如果过早移除 `resumeDataAtom`，可能影响现有依赖它的非编辑路径
- `persisted resume` 与 `draft resume` 命名必须清晰，否则容易重新混用
- 自动保存时机不能和 modal rollback 打架
- 不要在本次顺手把模板选择一起接入，否则会扩大变更面

## 验收标准

- `useResume` 仍可在 `jobApplication id` 作用域下作为全局 API 使用
- 编辑页内只有一条明确的 `draft` seam
- 新增 section / block / 删除 block 不再需要 caller 自己双写 form 和 store
- 画布、弹窗、表单基于同一份草稿工作
- 自动保存、回滚、空白简历起步路径行为保持稳定
- 模板相关 API 保留，但系统行为与当前一致，不新增模板切换产品能力

## 预期结果

完成后，`resume editor` 这个 module 会更深一些：

- caller 学习成本更低
- 状态 ownership 更清晰
- 编辑动作的 locality 更好
- 后续无论是接模板选择，还是扩更多 section 编辑能力，都不需要继续扩大状态同步复杂度
