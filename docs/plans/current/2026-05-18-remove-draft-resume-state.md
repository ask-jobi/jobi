# Remove Draft Resume State

## 背景

当前简历编辑器围绕一条显式的 `draft` seam 运作：

- 页面级 `react-hook-form` 持有整份 resume 的本地工作副本
- modal 打开前会先把新 entry 或空 section 写入 draft
- cancel 依赖 rollback snapshot 回滚 draft
- autosave 会把 draft 持续落库
- AI tool 也是先改 draft，再 commit

这条模型已经和新的产品判断冲突：

- 系统中不再保留 `draft resume` 这个概念
- 不再允许存在页面级中间态
- modal 的表单状态只在 modal 内局部存在
- 只有显式用户保存和 AI 修改才会持久化
- 保存策略改为“先落库，再更新 UI”

## 目标

- 从领域语言和实现结构上移除 `draft resume` 概念
- 让 `Application Resume` 成为编辑页唯一的简历状态源
- 移除 autosave
- 让 modal 在本地维护独立表单状态，save 后 merge 到 resume，cancel 直接丢弃
- 让 AI 修改和用户表单编辑互斥，避免并发覆盖
- 用 TDD 的 vertical slices 渐进完成重构

## 非目标

- 本轮不重构 evaluation report 流程
- 本轮不改变 chat session 模型
- 本轮不调整 resume template 产品能力边界
- 本轮不顺带做大规模命名清洗（仅在触及处收口）

## 已确认决策

### 1. 不再存在 draft / working copy

- 不保留页面级 `draft`
- 不保留 rollback snapshot
- 不保留 autosave suspension 这类围绕 draft 的状态

### 2. modal 自己维护表单状态

- 打开 modal 时读取当前 persisted `Application Resume`
- modal 内部使用局部表单
- cancel 只关闭 modal，不修改 resume
- save 时根据编辑目标生成 `nextResume`

### 3. 保存为非乐观更新

所有 resume mutation 统一改成：

1. 基于当前 persisted resume 计算 `nextResume`
2. 先调用 server 保存
3. 保存成功后再更新本地 store
4. 保存失败时 UI 保持原状，并给出错误提示

### 4. 新建 entry / section 不再预写入画布

- 点击新增只打开 modal
- 画布在 save 前不发生变化
- save 成功后才把新 section / entry 插入 resume

### 5. 表单编辑与 AI 修改双向互斥

- AI 正在执行 resume mutation 时，禁止打开表单
- modal 打开时，禁止触发 AI resume mutation
- 所有会修改 resume 的外部入口都应遵循同一互斥规则

### 6. 删除规则

- 保留现有“用户确认后才删除”的交互
- 删除改为非乐观保存
- starter section 删空后保留空 section
- optional section 删掉最后一条 entry 后，直接移除整个 section 并同步更新 `sectionOrder`

### 7. 新增 entry 的插入位置

- entry 级 “+” 保存后插入在当前 entry 下方
- 不改成统一追加到 section 末尾

## 新方案

## 状态模型

### 单一简历状态

- `applicationResumeDataAtom` 是唯一简历数据源
- 画布、右侧面板、AI 输入都从这份 persisted resume 读取

### 编辑器状态

保留纯 UI/交互状态：

- modal 是否打开
- 当前编辑目标：`sectionId` / `entryIndex` / 编辑模式
- 是否处于会阻止编辑的 AI 运行阶段

不再保留：

- `draftRollbackResumeAtom`
- `resumeAutosaveSuspendedAtom`
- 页面级整份 resume 的 RHF form

### modal 表单状态

- 由 modal 内部的表单组件局部持有
- 打开时从 persisted resume 派生初始值
- save 才向全局 resume 产生 mutation

## 数据流

### 编辑已有 entry

1. 用户点击 entry edit
2. 记录编辑目标并打开 modal
3. modal 读取当前 persisted entry 作为初始值
4. 用户保存
5. 生成 `nextResume`
6. server 保存成功
7. 更新 `applicationResumeDataAtom`
8. 关闭 modal

### 新建 entry

1. 用户点击某条 entry 的 “+”
2. 记录“在 section X 的 index Y 下方创建新 entry”并打开 modal
3. modal 使用 `createEmptySectionEntry(sectionId)` 作为初始值
4. 用户保存
5. 把新 entry 插入到目标 index 下方，生成 `nextResume`
6. server 保存成功
7. 更新本地 resume 并关闭 modal

### 新建 section

1. 用户点击 Add Section
2. 记录“创建 section X”并打开 modal
3. 如果 section 不存在，则以空 entry 作为表单初始值
4. 保存时创建 section（若尚不存在）并写入第一条 entry
5. server 成功后再更新本地 resume

### 删除 entry

1. 用户点击删除并完成确认
2. 基于当前 persisted resume 计算删除后的 `nextResume`
3. 若 optional section 被删空，则移除整个 section
4. server 成功后再更新本地 resume

### AI 修改

1. AI tool 基于当前 persisted resume 计算输出
2. 将 output 应用到 persisted resume，得到 `nextResume`
3. server 成功后再更新本地 resume
4. modal 打开时不允许进入这条路径

## 影响范围

### 需要删除或重构的核心实现

- `lib/hooks/use-resume-draft.ts`
- `lib/resume-draft/mutations.ts`（应重命名或下沉为通用 resume mutation module）
- `components/resumes/resume-page.tsx`
- `components/resumes/resume-section-edit-modal.tsx`
- `lib/hooks/use-entry-edit-workflow.ts`
- `lib/store/resume-editor-state.ts`
- `components/resumes/resume-editor.tsx`
- `components/resumes/resume-canvas-section-entry.tsx`
- `components/agent/chat-interface.tsx`
- `components/agent/chat/user-message.tsx`

### 需要调整的表单接线

- `components/resumes/resume-section-form.tsx`
- `components/forms/personal-info-form.tsx`
- `components/forms/education-form.tsx`
- `components/forms/employment-form.tsx`
- `components/forms/skills-form.tsx`
- `components/forms/projects-form.tsx`
- `components/forms/research-form.tsx`
- `components/forms/publications-form.tsx`
- `components/forms/awards-form.tsx`
- `components/forms/certifications-form.tsx`

### 需要同步更新的测试

- `components/resumes/__tests__/resume-editor-add-block.test.tsx`
- `components/resumes/__tests__/resume-section-edit-modal.test.tsx`
- `components/agent/__tests__/chat-interface.test.tsx`
- 受表单接线影响的 `components/forms/__tests__/*`

## 推荐的模块收口

### 1. 把 draft mutation module 改成 persisted resume mutation module

建议将：

- `lib/resume-draft/mutations.ts`

收口为类似：

- `lib/resume/mutations.ts`

职责改为：

- 纯函数操作 `ResumeData`
- 不带 RHF 语义
- 不带 draft 语义
- 支持：
  - 更新 personal info
  - 更新某条 entry
  - 在指定位置插入 entry
  - 创建 section 并写入首条 entry
  - 删除 entry / 删除空 optional section
  - 应用 AI tool output

### 2. 显式建模 modal 编辑目标

建议新增轻量编辑目标模型，例如：

- `editPersonalInfo`
- `editEntry(sectionId, entryIndex)`
- `createEntryBelow(sectionId, index)`
- `createSection(sectionId)`

这比依赖“先把东西写进 draft 再根据 selectedEntryId 反推”更符合新方案。

## TDD 实施计划

采用 vertical slices，而不是先批量写完所有测试再实现。

### Slice 1: 删除页面级 draft 与 autosave

目标行为：

- 编辑页直接渲染 persisted resume
- resume-page 不再持有整份 resume 的 RHF form
- 不再因 watch 触发 autosave

测试：

- 编辑页不再因 form watch 自动调用 `saveApplicationResumeChange`
- persisted resume 变化时，画布直接反映新值

### Slice 2: modal 编辑已有内容只在 save 后生效

目标行为：

- 打开已有 entry / personal info 的 modal 不修改画布
- cancel 不修改 resume
- save 成功后才更新画布与 store

测试：

- 打开 modal 时 persisted resume 不变
- cancel 后 persisted resume 不变
- save 成功后 `saveApplicationResumeChange` 被调用且 UI 更新
- save 失败时 modal 保持打开且 UI 不更新

### Slice 3: 新建 entry / section 不再预写入 resume

目标行为：

- 点击新增只打开 modal
- save 成功后才创建 section / entry
- 新 entry 插入在当前 entry 下方

测试：

- 点击 entry add 时画布数量不变，modal 打开
- save 后数量增加且插入位置正确
- 新建 optional section 前画布无该 section，save 后出现
- cancel 后不产生空 section 或空 entry

### Slice 4: 删除走确认 + 非乐观保存

目标行为：

- 仍需用户确认
- 删除成功前 UI 不变
- 保存成功后才移除 entry / section

测试：

- 第一次点击 delete 仅进入确认态
- 第二次确认前 persisted resume 不变
- server 成功后 UI 更新
- optional section 删空后整个 section 消失
- starter section 删空后 section 保留为空

### Slice 5: AI 修改改为 persisted resume 直接保存

目标行为：

- AI tool 基于 persisted resume 生成 `nextResume`
- server 成功后才更新 UI
- modal 打开时 AI resume mutation 不可执行

测试：

- AI tool 成功时先保存后更新本地 resume
- 保存失败时 UI 不更新
- modal 打开时触发 AI resume mutation 被阻止

### Slice 6: AI / 表单双向互斥

目标行为：

- AI running 时不能打开表单
- modal 打开时不能触发 resume-modifying AI 操作
- 必要入口显示禁用态或直接拦截

测试：

- running 状态下点击 entry edit / add 不打开 modal
- modal 打开时 resume-modifying chat action 被阻止
- 非 resume mutation 的查看性 UI 不受影响

### Slice 7: truncate 与其他回写入口对齐 persisted 模型

目标行为：

- truncate 回写 resume 后，编辑页直接反映 persisted 数据
- 不再尝试 `resetDraft`

测试：

- truncate 成功后只更新 persisted resume
- 不依赖 draft reset 也能同步 UI

## 执行顺序建议

1. 先写 Slice 2 的首个行为测试，建立“modal save 才生效”的 tracer bullet
2. 再收口 `resume-page`，移除页面级 form 和 autosave
3. 把 mutation 能力收敛成纯 `ResumeData` helpers
4. 再逐步处理 create / delete / AI / truncate
5. 最后统一清理命名、死代码和遗留测试

## 当前进度（2026-05-18）

> 状态：已完成。以下仅保留最终完成项。

### 已完成

- Slice 1 已完成：`resume-page` 不再持有页面级 `react-hook-form`，autosave 已删除，编辑页直接读取 persisted resume
- Slice 2 已完成：modal 编辑已有内容只在 save 成功后落库并更新 UI，cancel 不再修改 resume
- Slice 3 已完成：新建 entry / optional section 不再预写入 resume，save 成功后才插入 persisted resume
- Slice 4 已完成：删除保留确认交互，并改为非乐观保存；optional/starter section 行为已锁定测试
- Slice 5 已完成：AI tool 直接基于 persisted resume 生成并保存 `nextResume`
- Slice 6 已完成：AI 运行时禁止手动打开 modal，resume canvas 的 add/edit/delete 入口显式 disabled；modal 打开时 chat thread 不渲染
- Slice 7 已完成：truncate 已对齐 persisted-only 模型
- 真实产品表单已切换为 modal 局部表单路径，不再依赖页面级 `FormProvider<ResumeData>`
- `components/forms/*` 中 resume editor 产品路径所需表单已移除 legacy `useFormContext<ResumeData>()` / `useFieldArray()` fallback
- `components/resumes/*` 产品代码已无页面级 `FormProvider` / `useForm` 依赖；仅 `FocusedEntryFormShell` 保留局部 form provider 作为 modal 内部实现

### 后续可选项（不在本计划 scope 内）

- 若后续继续 deepening，可把 `selectedEntryId + selectedEntryIndex` 收口为更显式的 edit target model

## 风险

- 当前主要风险已从实现风险转为**文档漂移风险**：部分历史文档仍可能引用旧的 draft / rollback / autosave 模型
- `selectedEntryId + selectedEntryIndex` 仍是编辑目标定位协议，后续若继续 deepening，可考虑进一步显式建模 edit target
- 表单 props 仍保留少量兼容性空值分支；若未来继续收紧 interface，需要同步更新对应测试与 mock

## 验收标准

- 代码中不再存在页面级 `draft resume` / `commitDraft` / `resetDraft` / rollback draft 模型
- 编辑页不再 autosave
- modal 打开与取消不再修改 resume
- 新建 section / entry 只有在保存成功后才进入画布
- 所有 resume mutation 都采用“先落库，再更新 UI”
- AI 与表单编辑双向互斥
- 关键交互路径有对应的行为测试并通过

## 预期结果

完成后，简历编辑器将从“draft + rollback + autosave”模型，收口为“单一 persisted Application Resume + modal 局部表单 + 显式保存”的模型。这样语义更简单，冲突更少，也更符合当前产品对简历编辑流程的判断。
