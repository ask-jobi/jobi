# 架构 Deepening 候选项

> **状态说明**：每个候选项头部标注了当前进度。已完成子项用 ✅，进行中用 🔄，未开始用 ❌。
> **最后更新**：2026-05-18（候选项 1 全部完成）

这份文档整理了当前代码库里几类值得优先 deepening 的 **module**。

目标不是罗列"可以重构的地方"，而是识别那些当前 **interface** 过宽、**implementation** 分散、**seam** 泄漏，导致 **depth** 不足的区域。每个候选项都尽量用同一套结构描述，方便后续挑选一项进入更深入的设计讨论。

## 说明

- 本文初始梳理时，仓库根目录下没有 `CONTEXT.md` 和 `docs/adr/`。
- 当前已新增 [CONTEXT.md](../../CONTEXT.md) 明确了 canonical domain language，以及 [docs/plans/current/2026-05-15-resume-editor-domain-naming-alignment.md](plans/current/2026-05-15-resume-editor-domain-naming-alignment.md) 制定了命名对齐计划。
- 命名对齐计划的 Phase 1-2 已大部分完成，为以下候选项的 deepening 打下了基础。

---

## 候选项 1: Resume Edit Flow Layering ✅ 完成

**进度**：已完成，并已从旧的 draft/RHF/autosave 模型收口到当前的 persisted-resume-only 模型。

> 注：本候选项最初讨论时仍存在 draft seam。`2026-05-18 remove-draft-resume-state` 重构完成后，这一项已经落地，且其最终形态不再包含 draft、rollback snapshot 或页面级 RHF resume state。

### 最终落地形态 ✅

- ✅ `Application Resume` 成为编辑器唯一真实状态源
- ✅ `resume-page` 不再持有页面级 `react-hook-form` / `FormProvider<ResumeData>`
- ✅ autosave 已删除
- ✅ modal 编辑改为局部表单：打开时读取 persisted resume，save 成功后才落库并更新本地 store
- ✅ `lib/resume/mutations.ts` 已成为纯 `ResumeData` 变更层
- ✅ `lib/store/resume-editor-state.ts` / `lib/hooks/use-resume-editor-state.ts` 只保留 UI/editor selection 状态
- ✅ `lib/hooks/use-entry-edit-workflow.ts` 成为入口编排层，统一 add/edit/delete 打开或持久化行为
- ✅ `ResumeEditor` / `ResumeCanvasSectionEntry` / `ResumeSectionEditModal` 均已切换到 persisted-only 语义
- ✅ AI resume mutation 与手动编辑互斥，且高风险入口已有显式 disabled UI

### 当前相关 files

- `lib/resume/mutations.ts`
- `lib/store/resume-editor-state.ts`
- `lib/hooks/use-resume-editor-state.ts`
- `lib/hooks/use-entry-edit-workflow.ts`
- `lib/hooks/use-section-click.ts`
- `lib/store/resume.ts`
- `components/resumes/resume-page.tsx`
- `components/resumes/resume-editor.tsx`
- `components/resumes/resume-canvas-section-entry.tsx`
- `components/resumes/resume-section-edit-modal.tsx`
- `components/forms/focused-entry-form-shell.tsx`

### 结果

这一项的核心收益已经兑现：

- **Locality**：resume mutation、editor selection、modal UI choreography 各自集中
- **Leverage**：新增/编辑/删除/AI/truncate 都复用同一套 persisted-resume 语义
- **Testability**：关键路径已经可以围绕“save 前不更新、save 后才落库”这一条稳定 contract 来测试

### 对后续 deepening 的影响

候选项 1 已不再是进行中的架构机会，而是当前 resume editor 的既成基础。后续若继续 deepening，更值得投入的是：

- 候选项 2：Section Catalog Module
- 候选项 3：Resume AI Edit Log/Replay Module

---

## 候选项 2: Section Catalog Module 🔄 进行中

**进度**：命名层已收口（`DEFAULT_STARTER_SECTION_IDS`、`isStarterSection` 等），但集中的 Section Catalog module 尚未建立，4 处 `switch(sectionId)` 仍然分散。

### 已完成 ✅

- ✅ `REQUIRED_SECTION_IDS` → `DEFAULT_STARTER_SECTION_IDS`（语义从"领域必备"改为"默认起步"）
- ✅ `isStarterSection()` / `isOptionalSection()` helper 函数提炼到 `section-definitions.ts`
- ✅ 命名对齐：`SortableSectionKey`、`SectionBlock` → 各 `*Entry` 类型已对齐 CONTEXT.md

### 待完成 ⚠️

- ❌ 集中的 Section Catalog module 未建立（目前仍是 `section-definitions.ts` + `section-helpers.ts` + `section-factories.ts` 三个分散文件）
- ❌ `resume-section-form.tsx:27` 的 `switch(sectionId)` — 9 个 case 分发到不同 Form 组件
- ❌ `section-factories.ts:46` 的 `switch(sectionId)` — 8 个 case 创建不同类型的空 entry
- ❌ `resume-thumbnail.ts:136` 的 `switch(sectionId)` — 8 个 case 构建不同类型的 thumbnail summary
- ❌ `agent/tools.ts:81` 的 `switch(entity)` — 8 个 case 返回不同 entry schema

**Files**

- `lib/templates/section-definitions.ts`
- `lib/templates/section-helpers.ts`
- `lib/templates/section-factories.ts`
- `components/resumes/resume-section-form.tsx`
- `lib/agent/tools.ts`
- `lib/resume-thumbnail.ts`

**Problem**

`section` 已经是这个产品中的核心领域概念，但它的规则被拆散到了多个浅的 **module** 里。当前要理解一个 `section`，往往需要在这些地方来回跳转：

- 哪些 `section` 存在、哪些是默认起步（已收口 ✅）
- 什么时候应该 add，什么时候应该 open
- 空 entry 如何创建
- AI tool 对应哪类 entry schema
- 缩略图如何为不同 `section` 生成摘要
- 编辑表单如何分发到具体实现

这里最明显的信号是 4 处重复的 `switch(sectionId)`（见上方待完成列表）。这意味着 `section` 的 **implementation** 不是被收在一个深的 **module** 里，而是被多个 **adapter** 分头解释。删除其中任一个 switch，大多数复杂度不会"重新出现"在调用方之间，而只是换个地方继续复制，说明这些 module 的 **depth** 偏低。

**Solution**

围绕 `section` 建立一个更深的 **module**（如 `lib/section-catalog/`），把以下能力收进同一个 **seam**：

- section catalog（有哪些 section、哪些是默认起步、哪些可选）
- entry factory（每个 section 的空 entry 模板）
- edit rules（哪些 section 允许多 entry、排序约束）
- display rules（缩略图摘要规则、section 标签）
- AI edit rules（每个 section 的 entry schema）

调用方不再各自判断 `section` 的特殊性，而是依赖同一份集中规则。

**Benefits**

- **Locality** 更强：新增或修改一个 `section` 时，影响点从 4+ 处减少到 1 处。
- **Leverage** 更高：UI、AI、thumbnail、form 可以共享同一份 section 语义，而不是重复维护 switch。
- 测试更可维护：可以把"section 行为"当成真正的测试面，而不是分别在多处重复测试相同规则。

---

## 候选项 3: Resume AI Edit Log/Replay Module 🔄 进行中

**进度**：底层基础设施（chat_events 表、summary checkpoint、truncate/restore）已建立。工具执行已集中在 `resume-editor.ts`。但 AI edit 的 contract 仍分散在 tool schema / execute / apply / persist 四层。

### 已完成 ✅

- ✅ `chat_events` 表支持 `event_type`：`summary_checkpoint`、`rollback`、`tool_call`、`tool_result`、`tool_failed`
- ✅ `extractToolOriginalValues()` — 从 message parts 中统一提取 modification output
- ✅ `getLatestValidSummaryCheckpoint()` / `restoreConversationSummaryAfterTruncate()` — replay/revert 基础设施
- ✅ `executeResumeEditorModifyTool()` / `executeResumeEditorReorderTool()` — 工具执行集中到 `components/agent/chat/resume-editor.ts`
- ✅ `ChatThreadLifecycle` 状态机（`lib/store/chat.ts`）— 单 session 生命周期显式管理
- ✅ 命名对齐：`chatSessionsAtom` → `chatSessionAtom`（单数）、`use-chat-sessions.ts` → `use-chat-session.ts`

### 待完成 ⚠️

- ⚠️ Tool schema 定义（`lib/agent/tools.ts`）、执行（`resume-editor.ts`）、客户端 apply/save（`chat-interface.tsx` + `lib/resume/mutations.ts`）、持久化（`chat-history.ts`）仍分布在四个文件中
- ⚠️ 新增一个 edit operation 仍需在 schema / execute / apply / persist 四处同步

**Files**

- `lib/agent/tools.ts`
- `components/agent/chat/resume-editor.ts`
- `components/agent/chat-interface.tsx`
- `app/api/chat/resume/route.ts`
- `app/api/chat/truncate/route.ts`
- `lib/agent/chat-history.ts`

**Problem**

"AI 修改 `resume`"其实是一个完整的领域动作，但现在它被拆成了多段分散的 **adapter**：

- tool schema 定义修改形态（`tools.ts`）
- 客户端执行工具并生成 output（`resume-editor.ts`）
- 客户端 apply/save 写回 persisted resume（`chat-interface.tsx` + `lib/resume/mutations.ts`）
- 服务端持久化消息（`chat-history.ts`）
- event logging 记录工具输出（`chat_events` 表 ✅）
- truncate / rollback 再反向解释这些输出（`chat-history.ts` ✅）

也就是说，同一个概念被多个模块分别"理解"了一次。任何新 operation 或 invariant，都需要在 schema、execute、apply、persist 至少四处保持同步。这不是深的 **module**，而是一个泄漏的 **seam**。

按 deletion test 看，删掉其中任一层，复杂度都不会消失，因为其他层仍然需要重复理解"AI edit"是什么。这说明真正缺少的是一个端到端拥有该概念的 **module**。

**Solution**

把 `resume AI edit` 收敛成一个更深的 **module**，统一拥有：

- edit intent 的表示（当前在 `tools.ts` 的 input schemas）
- edit output 的标准形态（当前在 `tools.ts` 的 output schemas）
- apply 规则（当前在 `lib/resume/mutations.ts` 的 `applyToolOutputToResume`）
- persist 规则（当前在 `chat-history.ts` 的 `saveMessage` / `updateMessage`）
- replay / revert 规则（当前在 `chat-history.ts` 的 truncate / checkpoint 函数）

其余位置只负责调用，不再分别解释 edit contract。

**Benefits**

- **Locality** 更好：AI 编辑相关 bug 会集中在一个地方，而不是跨 client/server/history 分布。
- **Leverage** 更高：新增 edit operation 时，不需要同步修改多个分散解释器。
- 测试更扎实：可以围绕一个稳定的 **interface** 做 apply/replay/revert 测试，而不是只测局部 adapter。

## 候选项对比（更新至 2026-05-18）

### 当前进度总览

| 候选项                       | 状态      | 已完成                                   | 剩余核心工作                      |
| ---------------------------- | --------- | ---------------------------------------- | --------------------------------- |
| 1. Resume Edit Flow Layering | ✅ 完成   | 全部四层分离完成 ✅                      | —                                 |
| 2. Section Catalog Module    | 🔄 进行中 | 命名收口 ✅, helper 提炼 ✅              | 建立集中 module，消除 4 处 switch |
| 3. Resume AI Edit Log/Replay | 🔄 进行中 | chat_events 基础设施 ✅, 工具执行集中 ✅ | contract 四层统一                 |

### 更新后的优先级建议

命名对齐（Phase 1-2）已大幅推进，且 Candidate 1 的 Editor State 提炼已完成。当前剩余工作的推荐顺序：

1. **Section Catalog Module**（Candidate 2 剩余部分）
   - leverage 最高：4 处 `switch` 是明确的收口信号
   - 改动面可控（~800 行文件），做完后所有 section 消费者（UI/AI/缩略图/表单）受益
   - 自包含，不跨 client/server 边界
2. **Resume AI Edit Log/Replay**（Candidate 3 剩余部分）
   - 基础设施已就位，下一步是把 tool schema + execute + apply + persist 的 contract 统一到一个 interface 后面
   - 建议等 Section Catalog 稳定后再做，因为 AI tools 会受益于统一的 section 语义
## 下一步建议

后续如果要继续推进，建议从上面的候选项里挑 1 个，进入下一轮更细的 grilling：

- 明确这个 **module** 的目标 **interface**
- 明确哪些规则应该藏在 **implementation** 后面
- 明确新的 **seam** 放在哪里
- 明确哪些现有 **adapter** 应该保留，哪些应该收编或删除
- 明确测试应该围绕哪一个 **interface** 来写
