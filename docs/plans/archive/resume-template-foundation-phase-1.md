# Resume Template Foundation Phase 1

> ⚠️ **已过期（superseded）** — 被 `resume-template-foundation.md` 和后续模板演进取代。`default` / `modern` 现已通过共享 `section-entries.tsx` 渲染层和 `sectionOrder` 统一语义对齐。本文件的 Phase 1 分步方案不再反映当前实现。

## 范围

本阶段只处理模板底座的基础语义与数据入口，不做视觉改版。

明确边界：

- 不改变现有 `default` / `modern` 模板的视觉样式
- 可以把局部 CSS 迁移为 Tailwind，但必须保持样式等价
- 不在本阶段上线模板切换 UI
- 不在本阶段重写所有模板组件

本阶段关注三件事：

1. 模板定义层补齐基础元信息
2. section 固定标题与动态增删语义落地
3. 模板状态与简历语言来源打通

## 当前现实约束

### 1. 简历语言来源

简历语言已经存在于数据库 `resumes.language` 字段，并在前端通过 `resumeMetadataAtom` 暴露。

当前可确认的事实：

- 简历语言不是由用户当前 UI locale 决定
- AI 流程已经依赖 `resume.language`
- 模板标题层还没有真正接入这条语言来源

因此，模板底座的所有固定标题映射都应以 `resume.language` 为准，只支持：

- `en`
- `zh`

### 2. section 目前是“数据内嵌标题”

当前 `ResumeData` 中每个 section 都包含：

- `sectionId`
- `title`
- `blocks`

模板层默认直接读取 `section.title` 渲染标题。

这会导致：

- 标题语义容易漂移
- 动态新增 section 时标题来源不统一
- 不同模板难以共享统一标题策略

### 3. 某些 section 在编辑链路中被视为必存在

表单当前直接绑定：

- `education.blocks`
- `employment.blocks`
- `skills.blocks`

这说明在实施动态 section 之前，需要先定义哪些 section 是“始终存在的数据结构”，哪些可以真正缺省。

## Phase 1 目标

- 为模板定义补上最低限度的结构化配置
- 建立基于 `resume.language` 的固定标题映射
- 设计 section 的 required / optional 语义
- 为新增/删除 section 提供统一数据操作入口
- 保持旧数据和现有模板可兼容运行

## 建议数据设计

### 1. 保留现有 `ResumeData` 主结构

本阶段不建议立即从 `ResumeData` 中删除 `section.title`。

建议策略：

- `section.title` 保留，作为兼容字段
- 模板层新增统一的标题解析逻辑
- 渲染时优先读固定标题映射，必要时回退到旧的 `section.title`

原因：

- 旧数据中已经存在标题
- AI parser / evaluator / tests 里大量用到了 `title`
- 一次性去掉会放大改动面

### 2. 新增 section 语义定义

建议在模板相关目录新增一组常量和 helper：

- `lib/templates/section-definitions.ts`

建议内容：

- `REQUIRED_SECTION_IDS`
- `OPTIONAL_SECTION_IDS`
- `DEFAULT_SECTION_ORDER`
- `SECTION_INSERTION_ORDER`

推荐定义：

- required
  - `education`
  - `skills`
- optional
  - `employment`
  - `research`
  - `projects`
  - `publications`
  - `awards`
  - `certifications`

说明：

- `personalInfo` 不在 `sectionOrder` 内，但它本质上始终存在
- `employment` 是否列为 required 取决于产品选择
- 如果希望支持“无工作经历”用户，建议把 `employment` 定义为 optional

### 3. 新增固定标题映射

建议新增：

- `lib/templates/section-labels.ts`

提供如下能力：

- `getSectionLabel(sectionId, language)`
- `getAllSectionLabels(language)`

建议映射：

- `education`
  - `en`: `Education`
  - `zh`: `教育经历`
- `employment`
  - `en`: `Employment`
  - `zh`: `工作经历`
- `skills`
  - `en`: `Skills`
  - `zh`: `技能`
- `research`
  - `en`: `Research`
  - `zh`: `科研经历`
- `projects`
  - `en`: `Projects`
  - `zh`: `项目经历`
- `publications`
  - `en`: `Publications`
  - `zh`: `论文发表`
- `awards`
  - `en`: `Awards`
  - `zh`: `奖项荣誉`
- `certifications`
  - `en`: `Certifications`
  - `zh`: `证书认证`

注意：

- 这里是模板展示标题，不必强行沿用当前空白简历里的 `Education History` / `Employment History`
- 但在真正替换渲染前，要确认不会引发视觉或文案回归争议
- 若要百分百保持旧文案，也可以先把英文映射设为旧值，再在后续阶段统一收敛

### 4. 新增 section 工厂函数

建议新增：

- `lib/templates/section-factories.ts`

职责：

- 根据 `sectionId + language` 生成最小合法 section 数据
- 为新增 section 提供统一入口
- 为空白简历创建提供统一默认值

建议接口：

```ts
function createEmptySection(
  sectionId: SortableSectionId,
  language: Locale
): NonNullable<ResumeData[SortableSectionId]>
```

每个 section 至少生成：

- `sectionId`
- 固定标题
- `blocks: []`

如果后续产品希望“新增 section 后立即可编辑”，可以在第二步引入 `createInitialBlockForSection(sectionId)`。

## 模板定义层设计

### 1. 扩展 `TemplateConfig`

当前 `TemplateConfig` 只有：

- `id`
- `name`

Phase 1 建议扩展为：

```ts
interface TemplateConfig {
  id: string
  name: string
  description?: string
  supportedSections: SortableSectionId[]
  requiredSections: SortableSectionId[]
  optionalSections: SortableSectionId[]
  previewVariant?: "document"
  printMode?: "browser-native"
}
```

目标：

- 先把模板语义补齐
- 不要求一次性把所有字段都在 UI 中消费

### 2. `registry` 仍然保留

本阶段不需要推翻 `TemplateRegistry`。

只需要：

- 扩展配置类型
- 给 `default` / `modern` 都补齐 metadata
- 让后续渲染层可以读取 `supportedSections`

## 模板状态入口设计

### 1. 短期做法

本阶段建议先保留 `useResumeTemplate()` 的消费方式，但允许其从外部接受：

- `templateId`
- `resumeLanguage`

例如：

```ts
useResumeTemplate({
  templateId,
  language
})
```

这样可以避免继续把模板状态锁死在 hook 内部 `useState`。

### 2. `templateId` 存储策略

Phase 1 先设计，不一定马上落库存储。

推荐优先级：

1. 先在前端状态层支持外部传入 `templateId`
2. 再决定存到：
   - `resume_json`
   - 或独立 metadata / DB 字段

原因：

- 当前用户还没有模板切换 UI
- 先解耦状态读取，再决定持久化位置，风险更低

## section 增删设计

### 1. 数据语义

建议把“section 是否显示”与“section 是否存在结构”分开看待。

短期约束：

- required section
  - 必须有结构
  - 默认在 `sectionOrder` 中
- optional section
  - 可以存在但不显示
  - 也可以完全不存在

### 2. 删除 section 的推荐行为

建议定义一个显式 helper：

- `removeSection(data, sectionId)`

行为：

- 从 `sectionOrder` 中移除该 `sectionId`
- 删除对应 section 数据，或保留为空结构但不渲染

Phase 1 更推荐：

- 对 optional section，允许直接从 `ResumeData` 中移除对应属性
- 对 required section，不允许真正删除，只允许清空 blocks

原因：

- 语义更清晰
- 能避免表单层直接绑定缺失路径导致错误

### 3. 新增 section 的推荐行为

建议定义 helper：

- `addSection(data, sectionId, language)`

行为：

- 如果 section 已存在，不重复添加
- 如果不存在，则通过 `createEmptySection` 创建
- 按默认插入规则写入 `sectionOrder`

插入顺序建议依然遵守当前产品心智：

- `education`
- `employment`
- `research`
- `projects`
- `publications`
- `awards`
- `certifications`
- `skills`

## 兼容策略

### 1. 标题兼容

在完全切换到固定标题之前，建议渲染顺序为：

1. 若模板层有 `language + sectionId` 映射，则优先显示映射标题
2. 否则回退到 `section.title`
3. 若 `section.title` 也不存在，则显示硬编码兜底值

### 2. 数据兼容

旧简历可能存在：

- 标题为旧英文值
- optional section 缺失
- section 顺序不标准

因此需要新增轻量 normalize helper，例如：

- `normalizeResumeSections(data, language)`

职责：

- 保证 `sectionOrder` 只包含合法 section
- 对已存在 section 保持原内容
- 在需要时补 required section

### 3. 表单兼容

由于当前表单直接访问固定路径，本阶段建议：

- 不立刻让 required section 变成真正可缺省
- 先把 optional section 的新增/删除能力放在模板与数据 helper 层
- 等表单层具备动态 section 容器后，再全面开放 section 生命周期

## 文件级实施建议

### 新增文件

- `lib/templates/section-definitions.ts`
- `lib/templates/section-labels.ts`
- `lib/templates/section-factories.ts`
- `lib/templates/section-helpers.ts`

### 修改文件

- `lib/templates/registry.ts`
  - 扩展 `TemplateConfig`
- `lib/hooks/use-resume-template.ts`
  - 改为可接受外部 `templateId`
- `components/resume-templates/section-blocks.tsx`
  - 增加可传入的 `resolvedTitle`
- `components/resume-templates/default-template.tsx`
  - 接入统一标题解析
- `components/resume-templates/modern-template.tsx`
  - 接入统一标题解析
- `server/resume.ts`
  - 抽出空白简历 section 工厂逻辑
- `types/resume.ts`
  - 仅做必要的类型补充，不做激进破坏性调整

## 测试建议

### 单元测试

- `section-labels`
  - 英文标题正确
  - 中文标题正确
- `section-factories`
  - 能按语言生成合法 section
- `section-helpers`
  - add section 不重复
  - remove optional section 生效
  - required section 不允许真正删除

### 集成测试

- 空白简历创建时：
  - `language = en` 生成英文标题
  - `language = zh` 生成中文标题
- 模板渲染时：
  - 即使旧数据标题不一致，也优先显示固定标题

## 开发顺序建议

1. 先补 `section-labels` 和 `section-definitions`
2. 再补 `section-factories` / `section-helpers`
3. 然后扩展 `TemplateConfig`
4. 最后让模板组件开始消费统一标题

## Phase 1 完成标志

- 模板层不再直接依赖任意 `section.title`
- 标题语言统一来自 `resume.language`
- 已有模板样式保持不变
- section 增删有统一 helper 可复用
- 为后续模板切换 UI 和 section 管理 UI 留出稳定接口
