# Resume Editor Domain Naming Alignment

## 背景

简历编辑器已经能工作，但代码里的大量命名仍然混杂了：

- 领域词
- UI / 渲染词
- 历史实现残留
- 当前产品尚未成立的一等对象

这会让后续的状态收敛、模块重构、AI tool 建模和测试命名都持续变难。

与此同时，仓库根目录已经新增了 [CONTEXT.md](../../../CONTEXT.md)，其中明确了当前简历编辑器的 canonical language，例如：

- `Job Application`
- `Application Resume`
- `Uploaded Resume`
- `Job Description`
- `Evaluation Report`
- `Suggestion`
- `Section`
- `Entry`
- `Chat Session`
- `Exported Resume`
- `UI Language`
- `Resume Language`

本计划的目标不是立刻大规模重命名所有代码，而是先把“哪些命名和领域语言打架”显式整理出来，为后续分阶段收口提供依据。

## 目标

- 识别当前代码中最主要的领域命名冲突
- 为每个冲突给出建议的 canonical direction
- 按风险和收益排序，给后续重构提供执行顺序
- 避免继续引入和 `CONTEXT.md` 相冲突的新命名

## 非目标

- 本计划不要求本轮立即完成所有重命名
- 本计划不覆盖 UI 文案润色
- 本计划不引入新的持久化模型
- 本计划不处理与简历编辑器无关的全局命名问题

## Canonical Language Reference

后续命名调整应优先对齐根目录 [CONTEXT.md](../../../CONTEXT.md)：

- 顶层对象是 `Job Application`
- 可编辑内容对象是 `Application Resume`
- 上传来源对象是 `Uploaded Resume`
- 分析结果对象是 `Evaluation Report`
- 对话对象是单个 `Chat Session`
- 简历结构由 `Section` 和 `Entry` 组成
- 语言只区分 `UI Language` 与 `Resume Language`

## 主要冲突清单

### 1. `block` 混用了领域对象和渲染对象

现状：

- [types/resume.ts](/Users/yutao/IdeaProjects/jobi/types/resume.ts:23) 中存在 `SectionBlock`、`EducationBlock`、`EmploymentBlock`
- [components/resume-templates/section-blocks.tsx](/Users/yutao/IdeaProjects/jobi/components/resume-templates/section-blocks.tsx:1) 又把 `block` 用作模板渲染与交互单位

问题：

- `block` 同时在表达“简历里的一条内容”和“UI 上的一块区域”
- 很容易把领域建模和模板实现混成一层

建议方向：

- 领域侧统一向 `Entry` 收敛
- `block` 保留给 UI / 编辑器实现层

建议优先级：高

### 2. `sectionId` 同时在表示 section 种类和随机实例 id

现状：

- [types/resume.ts](/Users/yutao/IdeaProjects/jobi/types/resume.ts:138) 中 `SectionId` / `SortableSectionId` 实际表示 `education`、`employment` 这类 section 种类
- 同文件 [types/resume.ts](/Users/yutao/IdeaProjects/jobi/types/resume.ts:24) 中 `SectionBlock.sectionId: string` 又是运行时随机 id
- [server/ai/resume-parser.ts](/Users/yutao/IdeaProjects/jobi/server/ai/resume-parser.ts:21) 也在生成这个随机 `sectionId`

问题：

- 同一个词在表达两层完全不同的概念
- 而领域上每类 section 在一份简历里最多只出现一次，这让随机 `sectionId` 的必要性本身就变弱了

建议方向：

- `education` / `employment` / `skills` 这类 canonical term 保持为 `Section`
- 避免再把它们叫作 `sectionId`
- 审视随机 `sectionId` 是否可降级为实现细节，甚至逐步移除

建议优先级：高

### 3. `resume` 在代码里过于泛，但当前实际是 `Application Resume`

现状：

- [types/resume.ts](/Users/yutao/IdeaProjects/jobi/types/resume.ts:10) 的 `JobApplication.resume`
- [server/resume.ts](/Users/yutao/IdeaProjects/jobi/server/resume.ts:230) 中 `resumes` 表记录同时带 `job_id`
- `saveResumeChange()`、`getResumeData()` 等 API 都默认在操作当前申请下的简历

问题：

- 代码名字容易让人误以为这里存在用户级“母版简历”
- 与“我们不保存母版简历，只保存绑定某个 JD 的申请简历”这一领域判断不一致

建议方向：

- 后续新代码优先使用 `ApplicationResume` 心智
- 老代码若重命名，优先从公共接口、hooks、server function 开始

建议优先级：高

### 4. Chat 在领域上是单一 `Chat Session`，代码上却仍是多 session 模型

现状：

- [lib/hooks/use-chat-sessions.ts](/Users/yutao/IdeaProjects/jobi/lib/hooks/use-chat-sessions.ts:1) 暴露复数 `sessions`
- [lib/store/chat.ts](/Users/yutao/IdeaProjects/jobi/lib/store/chat.ts:8) 维护 `chatSessionsAtom`
- [lib/agent/chat-history.ts](/Users/yutao/IdeaProjects/jobi/lib/agent/chat-history.ts:101) 仍支持 `createSession()`

问题：

- 领域上已经明确“每份 `Application Resume` 只有一个 `Chat Session`”
- 复数结构会持续误导后续实现和维护

建议方向：

- 短期先在命名和注释层统一成单 session 心智
- 中期逐步收缩 hooks / store / API 的复数接口
- 长期再评估是否需要真正简化存储结构

建议优先级：高

### 5. `language` 仍然一词多义

现状：

- [lib/store/resume.ts](/Users/yutao/IdeaProjects/jobi/lib/store/resume.ts:64) 的 `resumeMetadata.language`
- [components/resumes/resume-canvas-section-entry.tsx](/Users/yutao/IdeaProjects/jobi/components/resumes/resume-canvas-section-entry.tsx:66) 同时用 `useLocale()` 与 `useResumeLanguage()`
- [lib/templates/section-labels.ts](/Users/yutao/IdeaProjects/jobi/lib/templates/section-labels.ts:27) 让 section label 直接跟随 resume language

问题：

- UI language、resume language、section label language 容易在讨论中继续混掉

建议方向：

- 领域上只保留 `UI Language` 和 `Resume Language`
- section label 不单独建模，默认跟随 `Resume Language`
- 后续代码命名优先显式写出 `uiLocale` / `resumeLanguage`

建议优先级：高

### 6. `REQUIRED_SECTION_IDS` 容易把“默认起步 section”误说成“领域必备 section”

现状：

- [lib/templates/section-definitions.ts](/Users/yutao/IdeaProjects/jobi/lib/templates/section-definitions.ts:12) 把 `education` 与 `skills` 定义为 required

问题：

- 这更像当前空白简历初始化策略，而不是领域真理
- 容易误导后续产品与实现

建议方向：

- 重新命名为更接近产品初始化语义的词
- 例如 `DEFAULT_STARTER_SECTION_IDS`、`INITIAL_SECTION_IDS` 一类

建议优先级：高

### 7. `title` 被持久化在 section 数据里，但领域上只是显示标签

现状：

- [types/resume.ts](/Users/yutao/IdeaProjects/jobi/types/resume.ts:25) 中 section 自带 `title`
- [lib/templates/section-factories.ts](/Users/yutao/IdeaProjects/jobi/lib/templates/section-factories.ts:26) 创建空 section 时直接写 label

问题：

- 容易把多语言显示文案和简历内容本体绑在一起
- 会放大模板和语言层的耦合

建议方向：

- 先在领域文档中明确 `title` 不是核心对象
- 后续如继续收口，可逐步把 label 计算挪向显示层

建议优先级：中

### 8. `Template` 在接口层看起来像正式产品能力，但当前还没有 `Selected Template` 业务对象

现状：

- [lib/hooks/use-resume-template.ts](/Users/yutao/IdeaProjects/jobi/lib/hooks/use-resume-template.ts:9) 暴露 `templates`、`switchTemplate`
- [lib/templates/registry.ts](/Users/yutao/IdeaProjects/jobi/lib/templates/registry.ts:21) 有完整 registry 配置

问题：

- 接口形态比当前产品现实更“完整版”
- 容易让后续实现误以为模板选择已是正式业务对象

建议方向：

- 保留 `Template` 作为呈现概念
- 暂不把 `Selected Template` 升为核心领域对象
- 新代码不要默认假设模板选择链路已经产品化

建议优先级：中

### 9. `AISuggestion` 与当前词汇表中的 `Suggestion` 已开始分叉

现状：

- [types/resume.ts](/Users/yutao/IdeaProjects/jobi/types/resume.ts:141) 定义了 `AISuggestion`

问题：

- 领域上目前统一用 `Suggestion`
- 且 `Evaluation Report` 后续还会重建模

建议方向：

- 新讨论和新文档优先使用 `Suggestion`
- 等 `Evaluation Report` 重建模时，再决定代码里的最终结构名

建议优先级：中

## 建议的收口顺序

### Phase 1: 高收益命名收口

- `REQUIRED_SECTION_IDS` -> 更贴近“默认起步”的命名
- 明确 `resumeLanguage` / `uiLocale`
- 停止在新代码里继续扩大 `block` / `sectionId` 的语义污染

### Phase 2: 结构性命名收口

- 收缩 chat 的复数 session 心智
- 逐步把 `resume` 相关公共接口向 `Application Resume` 心智靠拢
- 评估随机 `sectionId` 的去留

### Phase 3: 深层模型去耦

- 评估 section `title` 是否继续持久化
- 等 `Evaluation Report` 重建模后，统一 `Suggestion` 系列术语
- 如果模板选择进入产品流，再补 `Selected Template` 的正式建模

## 执行建议

- 任何新代码优先对齐根目录 [CONTEXT.md](../../../CONTEXT.md)
- 在改动公共类型、hooks、server 函数时，优先修正命名，再扩行为
- 如果某次重构会触及多个模块，先把命名收口单独做成一个垂直 slice，避免和业务变更强耦合

## 验收标准

- 团队在讨论简历编辑器时，不再把 `block` 当作领域词
- `sectionId` 不再同时代表 section 类别和随机实例 id
- 新代码不再默认使用“多 chat sessions”心智
- 新文档与新实现默认沿用 `Application Resume`、`Job Application`、`Resume Language` 等 canonical terms

## 预期结果

完成这轮收口后，简历编辑器相关代码会更贴近当前领域语言，后续无论继续做状态重构、评估模型重建，还是模板产品化，都会更容易在“同一套词”上推进，而不是在实现细节和业务概念之间反复翻译。
