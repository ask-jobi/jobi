# Resume Editor Post-Refactor Audit & Cleanup

## 背景

前几轮重构已经把简历编辑器从 `draft + autosave + 页面级 RHF` 模型收口到当前的 `persisted resume only` 模型。

本轮梳理的重点不是再做一轮大重构，而是回答三个问题：

1. 这轮重构是否已经真正完成
2. 是否还存在未删除的遗留实现或过时语义
3. 当前数据流和接口边界是否已经稳定、合理

基于当前代码审查与测试结果，可以给出结论：

- 主路径重构已经完成
- persisted-only 数据流已经成为事实上的唯一实现
- 但仍有一批收尾任务未完成，尤其集中在：
  - dead code / 过时文案清理
  - AI resume mutation contract 与真实 domain model 对齐
  - truncate rollback 与 mutation 层的重复实现收口

## 当前结论

### 已完成

- `Application Resume` 已成为编辑页唯一简历数据源
- 页面级 `FormProvider<ResumeData>` / autosave / draft rollback 已移除
- modal 已切换为局部表单，save 成功后才更新 store
- 新建 section / entry 不再预写入 persisted resume
- 删除已改为非乐观保存
- chat / AI tool 已改成基于 persisted resume 直接保存
- 关键行为测试通过（本轮抽查 19 tests passed）

### 仍待收尾

- 存在少量无生产引用的 helper / atom
- 存在过时 autosave 文案
- AI tool schema 与 `ResumeData` 真实结构仍有偏差
- truncate rollback 仍是单独维护的一套逆操作逻辑
- 类型系统里仍有若干 `@ts-expect-error`

## 目标

- 清理 resume editor 重构后的遗留代码与过时语义
- 对齐手动编辑、AI 编辑、truncate rollback 三条 mutation 路径
- 收紧 AI tool 接口，使其与真实 `ResumeData` 结构一致
- 用更少的特判与 `@ts-expect-error` 维持同样行为
- 补齐文档与回归验证，关闭本轮重构尾巴

## 非目标

- 本轮不重做 evaluation report 流程
- 本轮不重构 chat session 模型
- 本轮不引入协同编辑或版本冲突解决机制
- 本轮不处理 section catalog 全量 deepening（仅记录依赖）
- 本轮不调整简历模板视觉样式

## 代码现状摘要

### 当前主数据流

#### 手动编辑

1. `applicationAtom` 持有 job application
2. `applicationResumeDataAtom` 派生 persisted resume
3. 画布点击 -> `useEntryEditWorkflow`
4. editor selection 写入 `resume-editor-state`
5. 打开 `ResumeSectionEditModal`
6. modal 从 persisted resume 派生初始值
7. 保存时通过 `lib/resume/mutations.ts` 生成 `nextResume`
8. `saveApplicationResumeChange()` 成功后才更新 store

#### AI 编辑

1. chat route 从 DB 读取最新 resume 生成 prompt
2. 前端 tool call 基于当前 persisted resume 生成 tool output
3. `applyToolOutputToResume()` 生成 `nextResume`
4. `saveApplicationResumeChange()` 成功后才更新 store

#### truncate rollback

1. 读取被截断消息后的 tool outputs
2. 基于 output 中记录的 original value 做逆操作
3. 保存回 DB
4. 前端拿最新 persisted resume 替换本地 store

## 任务清单

## P0 - 收尾清理（低风险，优先完成）

### 1. 删除无效或无生产引用的实现

- [x] 确认并删除 `lib/store/resume.ts` 中未使用的 `resumeIndexAtom`
- [x] 确认并删除 `lib/templates/section-helpers.ts` 中未再参与主流程的 helper：
  - [x] `ensureSectionHasEditableEntry`
  - [x] `insertEntryBelow`
- [x] 删除与上述 dead code 绑定的过时测试，或改写为当前仍保留模块的测试
- [x] 全仓再检索一次 `draft/autosave/working copy` 残留语义

### 2. 修正文案与命名残留

- [x] 将 `saveApplicationResume()` 中的错误提示 `"Auto save failed"` 改成符合当前语义的文案
- [x] 检查注释中是否还有“draft / autosave / rollback snapshot”旧模型表述
- [x] 检查用户可见文案是否仍暗示自动保存

### 3. 基础类型债务清理

- [x] 梳理 resume editor 相关 `@ts-expect-error`
- [x] 能通过收紧类型消除的，优先消除而不是继续保留注释
- [x] 对无法立即消除的类型洞，补上明确 TODO 和原因

## P1 - AI 接口与真实 domain model 对齐（本轮核心）

### 4. 修复 `personalInfo` AI rewrite 与 apply contract 不一致

现状：

- tool schema 允许 `entity: "personalInfo"`
- tool executor 能读取 `personalInfo`
- 但 `applyToolOutputToResume()` 只处理有 `entries` 的 section

任务：

- [ ] 明确 `personalInfo` 是否继续允许 AI rewrite
- [ ] 若允许：为 `applyToolOutputToResume()` 补齐 `personalInfo` 分支
- [ ] 若不允许：从 schema / prompt / UI output 一并收口
- [ ] 为该行为补测试：成功保存、保存失败、truncate rollback

### 5. 修复 AI add 无法创建缺失 optional section 的问题

现状：

- 手动编辑允许“保存时创建 section 并写入第一条 entry”
- AI `add` 当前默认要求 section 已存在

任务：

- [ ] 决定 AI add 的产品语义：
  - [ ] 允许自动创建缺失 section
  - [ ] 或显式禁止并让模型改用别的路径
- [ ] 若允许，复用 `addSection()` / entry insert 语义
- [ ] 补测试覆盖“缺失 optional section 首次 AI add”

### 6. 对齐 AI entry schema 与 `ResumeData` 真实结构

重点风险：

- `ProjectEntry` / `ResearchEntry` 在 domain 中使用 `date.start/date.end`
- AI schema 目前仍有根级 `start/end` 表达

任务：

- [ ] 对齐 `lib/agent/tools.ts` 中各 section schema
- [ ] 对齐 tool output card / truncate rollback / apply mutation 对新结构的处理
- [ ] 补充针对 `projects` / `research` 的 add/rewrite 测试

### 7. 收紧 AI mutation contract

现状：

- `rewrite` 使用 `field: string` + `value: string`
- 容易出现字段过宽、嵌套字段难约束、类型洞扩散

建议方向：

- [ ] 设计更显式的 mutation contract，至少覆盖：
  - [ ] `rewritePersonalInfoField`
  - [ ] `rewriteSectionEntryField`
  - [ ] `createSectionEntry`
  - [ ] `deleteSectionEntry`
  - [ ] `reorderSectionEntries`
  - [ ] `reorderResumeSections`
- [ ] 评估是否拆成 v2 schema，而不是在现有 `rewrite` 上继续打补丁
- [ ] 同步更新 prompt、tool schema、tool executor、tool output renderer、truncate rollback

## P1 - Mutation 层收口

### 8. 统一正向 mutation 与逆向 rollback 语义

现状：

- `lib/resume/mutations.ts` 负责正向 apply
- `app/api/chat/truncate/route.ts` 里又单独维护一套逆操作逻辑

任务：

- [ ] 设计统一的 mutation event / inverse model
- [ ] 让 truncate rollback 尽量复用同一套领域操作，而不是手写特判
- [ ] 消除 `truncate` 中与 resume mutation 相关的 `@ts-expect-error`
- [ ] 补测试保证 add/delete/rewrite/reorder 都能正确回滚

### 9. 明确 starter/optional section 规则在 AI 路径中的一致性

- [ ] 校验 AI delete 删除最后一条 entry 时，是否与手动删除保持同样语义
  - [ ] starter section 留空
  - [ ] optional section 从 `sectionOrder` 和 payload 中移除
- [ ] 校验 AI reorder section 时是否始终满足当前 section order contract
- [ ] 为这些规则补行为测试

## P2 - 结构 deepening（可在本轮后半或下轮处理）

### 10. Section Catalog 收口准备

当前仍有多处 `switch(sectionId)` / `switch(entity)` 分散：

- `components/resumes/resume-section-form.tsx`
- `lib/templates/section-factories.ts`
- `lib/resume-thumbnail.ts`
- `lib/agent/tools.ts`

任务：

- [ ] 先记录所有 section-specific rule 的现状清单
- [ ] 提炼最小 catalog interface
- [ ] 判断该项是否拆成独立 plan，而不是混在本轮收尾中完成

### 11. 编辑目标模型再收口（可选）

当前编辑目标仍由：

- `selectedSectionId`
- `selectedEntryId`
- `selectedEntryIndex`

组合表达。

任务：

- [ ] 评估是否改成显式 edit target model：
  - [ ] `editPersonalInfo`
  - [ ] `editEntry(sectionId, index)`
  - [ ] `createEntryBelow(sectionId, index)`
  - [ ] `createSection(sectionId)`
- [ ] 如果暂不做，实现层至少补充注释，固定当前约定

## 测试与回归任务

### 单元 / 组件测试

- [ ] 为 `applyToolOutputToResume()` 补更完整测试矩阵
- [ ] 为 `truncate` rollback 补 `personalInfo`、optional section add/delete、nested date 字段测试
- [ ] 为 AI add 创建缺失 optional section 补测试
- [ ] 为 AI schema 与 domain 对齐后的 `projects/research` 行为补测试

### 端到端 / UI 回归

由于本轮涉及 UI 主流程与高风险交互，完成代码后应做针对性回归：

- [ ] 新建空白简历 -> Add Section -> modal save
- [ ] 编辑已有 entry -> save 成功后更新
- [ ] 删除 entry -> 二次确认 -> 保存后更新
- [ ] modal 打开时 chat thread 不渲染
- [ ] AI 修改成功后画布更新
- [ ] truncate 后 resume 回退并与 UI 同步
- [ ] 用 Playwright 跑一轮 targeted regression

## 文档任务

- [ ] 完成后更新 `docs/architecture-deepening-opportunities.md` 中与 resume editor 相关的状态说明
- [ ] 若 AI mutation contract 有显著变化，新增或更新对应 plan / ADR
- [ ] 若删除 dead code，更新相关 plan 中“当前状态”段落，避免文档继续引用历史结构

## 推荐执行顺序

### Phase 1: 快速收尾

- [ ] 删除 dead code
- [ ] 修正文案残留
- [ ] 清理最直接的类型洞

### Phase 2: AI contract 修复

- [ ] 处理 `personalInfo` rewrite contract
- [ ] 处理 AI add 创建缺失 optional section
- [ ] 对齐 `projects/research` schema

### Phase 3: rollback 收口

- [ ] 统一 truncate rollback 与 mutation 层
- [ ] 消除重复逆操作逻辑
- [ ] 补完整测试矩阵

### Phase 4: 回归与文档

- [ ] 跑组件测试 + API 测试
- [ ] 跑 Playwright 主流程回归
- [ ] 更新计划与架构文档

## 验收标准

- 代码中不再残留 resume editor 的 dead code / 过时 autosave 语义
- AI tool contract 与真实 `ResumeData` 结构一致
- `personalInfo`、optional section add/delete、nested date 字段在 AI 路径可正确处理
- truncate rollback 复用统一 mutation 语义，显著减少特判与类型逃逸
- resume editor 关键主流程测试稳定通过
- 相关文档与代码现状一致

## 预期结果

完成这份计划后，简历编辑器将不仅在“主路径上完成重构”，而且会把最后一批接口不一致、类型洞、回滚重复实现和历史残留真正收掉。

这样后续无论继续做 section catalog、AI edit log/replay，还是进一步产品化模板与编辑能力，都会建立在一套更干净、更一致的底座上。
