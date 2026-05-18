# 架构 Deepening 候选项

这份文档整理了当前代码库里几类值得优先 deepening 的 **module**。

目标不是罗列“可以重构的地方”，而是识别那些当前 **interface** 过宽、**implementation** 分散、**seam** 泄漏，导致 **depth** 不足的区域。每个候选项都尽量用同一套结构描述，方便后续挑选一项进入更深入的设计讨论。

## 说明

- 本次梳理时，仓库根目录下没有 `CONTEXT.md`。
- 本次梳理时，仓库根目录下没有 `docs/adr/`。
- 因此本文使用当前代码中的现有领域词汇：`resume`、`section`、`chat session`、`access pass`、`token balance`。

## 候选项 1: Resume Edit Flow Layering

**Files**

- `components/resumes/resume-page.tsx`
- `lib/store/resume.ts`
- `lib/hooks/use-resume-draft.ts`
- `components/resumes/resume-section-edit-modal.tsx`
- `lib/hooks/use-section-click.ts`
- `components/resumes/resume-context.tsx`
- `components/resumes/resume-editor.tsx`
- `components/resumes/resume-canvas-section-entry.tsx`

**Problem**

当前“编辑一份 `resume`”这件事不是由一个深的 **module** 承接，而是横跨了 RHF 表单状态、Jotai atoms、导出的 singleton store、DOM id 约定、`setTimeout` 滚动以及 rollback 状态。

调用方需要同时理解：

- persisted `resume` 和 draft `resume` 的关系
- 当前聚焦的 `section` / `block`
- modal 的打开关闭时机
- rollback 何时生效
- 保存和自动保存何时触发

更具体地说，这里混在一起的是 4 类不同职责：

- draft mutation：创建 block、补齐可编辑 `section`、删除 block、应用 AI 输出
- editor state：当前选中的 `section` / `block`、rollback snapshot、自动保存是否应暂停
- persistence handoff：何时把 draft 提交给持久化，何时只停留在本地 draft
- UI adapter：modal 开关、popover 入口、滚动定位、DOM id 约定

现在的主要问题不是“少了一个大而全的 session 抽象”，而是这 4 类职责的 **seam** 没切干净。比如：

- 创建新 block 的入口同时负责创建 block、记录 rollback、设置 focus、打开 modal
- `focusSectionAtom` 同时承担选择状态和 DOM 滚动副作用
- 自动保存通过 `rollbackResumeAtom` 的存在与否来间接推断是否应该暂停

这说明它的 **interface** 几乎和 **implementation** 一样复杂，且不同层的规则正在互相泄漏。按 deletion test 看，删掉 `useSectionClickHandler`、`focusSectionAtom` 的副作用部分或导出的 `store`，复杂度并不会重新集中到一个地方，只会散回更多调用方里，说明这些 module 偏浅。

**Solution**

这里更合适的 deepening 方向，不是引入一个过大的 `resume edit session` **module**，而是先按职责把现有能力分层，再让每一层各自变深：

- `Resume Draft Mutation Module`
  - 只负责 draft 数据变更
  - 例如：创建 block、补齐空 `section`、删除 block、应用 AI 输出
  - 不负责 modal、scroll、popover 或入口 choreography
- `Resume Editor State Module`
  - 只负责当前编辑目标、rollback snapshot、自动保存暂停这类状态规则
  - 不直接做 DOM 操作，不直接渲染 UI
- `Resume Editor UI Adapters`
  - 只负责 modal、popover、点击入口、滚动定位
  - 通过前两层暴露的 **interface** 驱动行为，而不是自己持有业务规则

换句话说，像“创建新的 block”这样的动作，应该只负责创建 block；“打开 modal”应该是 UI adapter 层的独立动作。外层页面可以显式组合这些动作，但不必再跨层理解内部状态约定。

**Current functionality inventory**

当前系统里已经存在、但尚未收口的功能大致如下：

- draft mutation
  - `ensureEditableSection`
  - `addBlockBelow`
  - `deleteBlock`
  - `applyToolOutput`
- editor state
  - `selectedSectionId`
  - `selectedBlockId`
  - `selectedBlockIndex`
  - `rollbackResume`
  - “自动保存是否应暂停”的隐式规则
- persistence handoff
  - debounced autosave
  - modal 保存后的显式 commit
- UI adapter
  - 打开/关闭 modal
  - section 点击与新增入口
  - `scrollIntoView`
  - `form-${id}` / `form-${id}-${index}` 这类 DOM id 约定

**Phased plan**

1. 先梳理并命名现有职责
   - 在文档和代码中统一区分 draft mutation、editor state、persistence handoff、UI adapter
   - 避免继续把“编辑流程”统称成一个模糊的 session 概念
2. 提炼 `Resume Draft Mutation Module`
   - 把创建 block、补空 `section`、删除 block、apply AI output 这类能力收敛到同一组 **interface**
   - 要求这些接口只返回新的 draft / 目标 block 信息，不直接打开 modal 或触发 UI 副作用
3. 提炼 `Resume Editor State Module`
   - 把选中目标、rollback snapshot、清理选择、开始/结束 protected edit、自动保存暂停规则收敛到同一处
   - 用显式状态表达“当前是否允许 autosave”，而不是让页面通过 rollback snapshot 间接猜测
4. 把 modal 和滚动降回 UI adapter
   - `resume-section-edit-modal`、`use-section-click`、空态/新增入口组件只负责交互和渲染
   - 它们调用 mutation/state **module**，但不再持有 rollback 或 draft 规则
5. 最后收紧调用方
   - `resume-page` 只关心表单与 autosave
   - `resume-editor`、`resume-canvas-section-entry` 只显式编排“先改 draft，再更新 editor state，再打开 UI”
   - 不再依赖导出的 singleton `store` 在多个层次间做隐式协调

**Benefits**

- **Locality** 更好：draft 规则、editor state 规则、UI 交互规则各自集中，而不是散在 store、hook、modal、page 之间。
- **Leverage** 更高：调用方只需组合少量清晰动作，不需要理解跨层隐式协议。
- 测试会更稳：可以分别测试“数据变更”“状态切换”“UI 交互”，而不是每次都同时挂 `Provider`、`FormProvider`、atoms 和 imperative store 调用。

对应执行计划见 [docs/plans/current/2026-05-15-resume-edit-flow-layering.md](./plans/current/2026-05-15-resume-edit-flow-layering.md)。

## 候选项 2: Section Catalog Module

**Files**

- `lib/templates/section-definitions.ts`
- `lib/templates/section-helpers.ts`
- `lib/templates/section-factories.ts`
- `components/resumes/resume-section-form.tsx`
- `lib/agent/tools.ts`
- `lib/resume-thumbnail.ts`

**Problem**

`section` 已经是这个产品中的核心领域概念，但它的规则被拆散到了多个浅的 **module** 里。当前要理解一个 `section`，往往需要在这些地方来回跳转：

- 哪些 `section` 存在、哪些是 required
- 什么时候应该 add，什么时候应该 open
- 空 block 如何创建
- AI tool 对应哪类 block schema
- 缩略图如何为不同 `section` 生成摘要
- 编辑表单如何分发到具体实现

这里最明显的信号是多个重复的 `switch(sectionId)`。这意味着 `section` 的 **implementation** 不是被收在一个深的 **module** 里，而是被多个 **adapter** 分头解释。删除其中任一个 helper，大多数复杂度不会“重新出现”在调用方之间，而只是换个地方继续复制，说明这些 module 的 **depth** 偏低。

**Solution**

围绕 `section` 建立一个更深的 **module**，把以下能力收进同一个 **seam**：

- section catalog
- block factory
- edit rules
- display rules
- AI edit rules

调用方不再各自判断 `section` 的特殊性，而是依赖同一份集中规则。

**Benefits**

- **Locality** 更强：新增或修改一个 `section` 时，影响点会显著减少。
- **Leverage** 更高：UI、AI、thumbnail、form 可以共享同一份 section 语义，而不是重复维护。
- 测试更可维护：可以把“section 行为”当成真正的测试面，而不是分别在多处重复测试相同规则。

## 候选项 3: Resume AI Edit Log/Replay Module

**Files**

- `lib/agent/tools.ts`
- `components/agent/chat/resume-editor.ts`
- `components/agent/chat-interface.tsx`
- `app/api/chat/resume/route.ts`
- `app/api/chat/truncate/route.ts`
- `lib/agent/chat-history.ts`

**Problem**

“AI 修改 `resume`”其实是一个完整的领域动作，但现在它被拆成了多段分散的 **adapter**：

- tool schema 定义修改形态
- 客户端生成 optimistic output
- draft apply 写回本地状态
- 服务端持久化消息
- event logging 记录工具输出
- truncate / rollback 再反向解释这些输出

也就是说，同一个概念被多个模块分别“理解”了一次。任何新 operation 或 invariant，都需要在 schema、apply、persist、revert 至少三处保持同步。这不是深的 **module**，而是一个泄漏的 **seam**。

按 deletion test 看，删掉其中任一层，复杂度都不会消失，因为其他层仍然需要重复理解“AI edit”是什么。这说明真正缺少的是一个端到端拥有该概念的 **module**。

**Solution**

把 `resume AI edit` 收敛成一个更深的 **module**，统一拥有：

- edit intent 的表示
- edit output 的标准形态
- apply 规则
- persist 规则
- replay / revert 规则

其余位置只负责调用，不再分别解释 edit contract。

**Benefits**

- **Locality** 更好：AI 编辑相关 bug 会集中在一个地方，而不是跨 client/server/history 分布。
- **Leverage** 更高：新增 edit operation 时，不需要同步修改多个分散解释器。
- 测试更扎实：可以围绕一个稳定的 **interface** 做 apply/replay/revert 测试，而不是只测局部 adapter。

## 候选项 4: Access Pass Lifecycle Module

**Files**

- `app/api/access-passes/create-free/route.ts`
- `app/api/checkout_sessions/route.ts`
- `app/api/stripe/webhook/route.ts`
- `server/quota.ts`
- `server/auth-helpers.ts`

**Problem**

`access pass`、`token balance`、免费试用领取、付费购买发放、token 消耗这些规则，目前分散在多个 route 和 helper 中。

尤其是这些 invariant 没有被一个深的 **module** 收住：

- 一个用户当前只有一条 `access pass`
- `FREE` 只能领取一次
- 付费购买会向现有额度叠加
- “active” 取决于剩余 token
- 某些 route 直接绕过现有 auth helper，自行做 `supabase.auth.getUser()`

这里的 **seam** 仍然是 route 层直接操作 Supabase，而不是一个拥有 access-pass 生命周期的 **module**。删除任一路由 helper 后，复杂度不会真正集中，只会分散到别的调用方里，说明当前 **depth** 不足。

**Solution**

引入一个更深的 `access pass lifecycle` **module**，统一拥有：

- free-trial eligibility
- paid purchase fulfillment
- token charging
- active/inactive 判定
- auth-aware access rules

route 只负责参数校验和调用，不再直接编排业务规则。

**Benefits**

- **Locality** 更强：支付、试用、配额规则修改时，不需要跨多个 route 同步排查。
- **Leverage** 更高：所有触达 `token balance` 的调用方都可以通过同一条 **interface** 获得一致行为。
- 测试更清晰：可以围绕 access-pass 生命周期做规则测试，而不是在每个 route test 里重复 mock 表级行为。

## 候选项对比

如果按“收益 / 改动面 / 风险”粗略排序，当前更值得优先考虑的是：

1. `Section Catalog Module`
2. `Resume AI Edit Log/Replay Module`
3. `Resume Edit Flow Layering`
4. `Access Pass Lifecycle Module`

原因：

- `section` 是当前 `resume`、AI 编辑、表单、缩略图共同依赖的核心概念，deepening 后的 **leverage** 最大。
- `resume AI edit` 是高复杂度链路，当前 contract 分散，最容易产生跨层漂移。
- `resume edit flow layering` 会明显改善前端编辑体验和测试稳定性，但更偏前端分层收敛。
- `access pass lifecycle` 价值很高，但涉及支付与配额，改动风险和验证成本更高。

## 下一步建议

后续如果要继续推进，建议从上面的 4 个候选项里挑 1 个，进入下一轮更细的 grilling：

- 明确这个 **module** 的目标 **interface**
- 明确哪些规则应该藏在 **implementation** 后面
- 明确新的 **seam** 放在哪里
- 明确哪些现有 **adapter** 应该保留，哪些应该收编或删除
- 明确测试应该围绕哪一个 **interface** 来写
