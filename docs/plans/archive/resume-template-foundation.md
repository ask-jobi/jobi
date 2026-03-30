# Resume Template Foundation

## 背景

当前项目已经具备简历模板的基础形态：

- 通过 `lib/templates/registry.ts` 注册模板
- 通过 `lib/hooks/use-resume-template.ts` 获取当前模板组件
- 通过 `components/resume-templates/section-blocks.tsx` 抽象 section 渲染

这套实现已经足够支撑当前编辑页预览，但距离“可扩展、可切换、可稳定打印”的模板底座还有明显差距。

现状问题：

- 模板系统仍以组件硬编码为主，缺少统一的模板配置层
- `default` 与 `modern` 的能力不对齐，模板覆盖的 section 范围不一致
- 模板切换状态没有进入正式产品流，也没有持久化
- 共享渲染逻辑不足，随着模板增多会快速出现重复代码
- 打印页对模板的分页、边距、断页控制还没有建立稳定策略
- section 标题目前来自数据层，缺少“按 section 类型固定标题”的统一约束
- section 的增删能力还没有作为模板底座的一等能力来定义
- 模板层部分实现与项目当前 Tailwind 约定不一致

## 目标

- 把当前模板实现升级为一个可持续扩展的模板底座
- 明确“数据渲染逻辑”和“模板视觉布局”的边界
- 为后续新增模板、模板切换、模板持久化、打印优化打下基础
- 明确 section 类型、固定标题与动态增删的边界
- 降低新增模板时的复制成本和回归风险
- 在底座重构过程中保持现有模板的视觉样式不变

## 非目标

- 本次不追求一次性上线大量新模板
- 本次不做模板商城、模板推荐或复杂商业化能力
- 本次不重做整个简历编辑页交互
- 本次不引入完全独立的可视化拖拽模板编辑器

## 设计原则

- 模板只负责布局和视觉表达，不重复承载业务逻辑
- section 渲染规则尽可能共享，模板主要定义“如何排”和“如何看”
- 编辑态预览和打印态输出应基于同一套模板语义，而不是两套分叉实现
- 模板扩展应以声明式配置优先，而不是不断复制 JSX
- 设计风格保持 `专业、克制、可信`，不脱离当前产品气质
- print 体验优先依赖浏览器原生打印能力，模板层负责输出稳定、可打印的 DOM
- section 标题默认由 section 类型决定，不依赖用户在数据层自由输入
- 底座重构不主动改变 `default` 和 `modern` 的现有样式
- 如需把模板层 CSS 迁移到 Tailwind，必须保持视觉结果等价
- 简历相关标题与文案语言以简历记录自身的 `language` 字段为准
- 语言支持范围以中文和英文为准

## 现状评估

### 1. 模板注册层过薄

当前 `registry` 只存储：

- `id`
- `name`
- `component`

缺少后续演进非常关键的元信息，例如：

- 支持的 section 集
- 模板描述与预览信息
- 打印策略
- 布局类型（单栏、双栏、紧凑型）
- 是否适合 ATS

这会导致模板系统很难支撑选择器、缩略图、持久化和按能力分层。

### 2. 模板实现不一致

`default-template.tsx` 基于 `sectionOrder` 做动态渲染，覆盖范围更完整；`modern-template.tsx` 只实现了部分 section，且没有沿用统一的 section 顺序策略。

这会导致：

- 不同模板间的数据表现不一致
- 某些 section 在切换模板后直接缺失
- 后续测试难以建立统一基线

### 3. 共享渲染 primitive 不足

当前虽然有 `SectionBlocks`，但很多 section 头部、时间行、标签组、Markdown 内容等模式仍在模板内重复声明。

问题在于：

- 每增加一个模板都要重复实现一套 section JSX
- 一处显示规则变更需要多处同步修改
- 很难保证不同模板对同一类数据的结构一致性

### 4. 模板状态未产品化

`useResumeTemplate` 内部使用本地 state，当前编辑页实际总是走默认模板，没有看到完整的模板切换入口和存储链路。

这意味着：

- 模板只是代码能力，不是产品能力
- 用户无法稳定感知模板差异
- 打印、缩略图、编辑预览之间也无法保证统一模板来源

### 5. 打印策略未成体系

`/resume-print/[id]` 目前主要是复用 viewer，`print.css` 还是空的。

对于简历模板来说，打印和导出质量是底层能力的一部分，但结合当前产品方向，建议把打印能力明确建立在浏览器原生打印之上，而不是额外构建复杂的导出排版系统。

模板底座至少需要保证：

- 页边距约束
- section 断页控制
- 长内容压缩规则
- 打印态专用 spacing 与字号策略

### 6. section 标题语义不稳定

当前 `SectionBlocks` 默认直接渲染 `section.title`。这会带来两个问题：

- 标题语义可能被数据层随意改写，影响模板一致性
- 切换模板后，不同模板对同一 section 的标题表达可能继续漂移

如果产品希望 section title 对不同类型保持固定，那么模板底座应把标题分成两层：

- `section type label`
- 可选的补充说明或副标题

其中主标题应优先由 section 类型和简历 `language` 对应的 i18n 字典决定，例如：

- `Education`
- `Employment`
- `Skills`
- `Projects`

### 7. section 增删能力需要进入底座定义

当前模板层主要处理“已有 section 如何显示”，但没有把“section 能否出现/消失”抽象成正式能力。

如果希望支持在简历中动态添加或删除 section，底座需要明确：

- 哪些 section 是核心 section
- 哪些 section 是可选 section
- section 被删除时，是从 `sectionOrder` 中移除，还是保留空结构但隐藏
- section 被添加时，默认标题、默认 block 和默认排序如何确定

## 建议方案

### 1. 建立模板定义层

新增统一的模板定义结构，例如：

- `id`
- `name`
- `description`
- `layout`
- `supportedSections`
- `previewVariant`
- `printOptions`
- `component`

目标是让模板注册从“注册一个 React 组件”升级为“注册一个完整模板定义”。

收益：

- 为后续模板选择器和缩略图提供稳定元数据
- 支持不同模板能力分层
- 为打印、导出、持久化提供统一入口

### 2. 提取共享渲染 primitive

从模板组件中抽出高频结构组件，例如：

- `ResumeHeader`
- `SectionTitle`
- `EntryHeading`
- `MetaRow`
- `TagList`
- `RichTextBlock`

同时保留 `SectionBlocks` 作为 section 级容器抽象。

目标不是把模板都做成一个样，而是把重复的业务型渲染模式抽出来，让模板只覆盖差异化布局。

### 3. 统一 section 渲染策略

引入“共享 section renderer + 模板样式变体”的方式：

- section 是否显示由数据和模板能力共同决定
- section 顺序优先遵循 `sectionOrder`
- 模板只定义该 section 使用哪种版式变体

例如：

- `employment` 使用 `timeline` 或 `compact-list`
- `skills` 使用 `chips` 或 `inline-list`
- `projects` 使用 `cardless-stacked` 或 `two-column-compact`

这样能避免每个模板从零实现所有 section。

### 4. 正式接入模板状态

把模板状态从局部 hook state 提升到正式数据链路。

建议路线：

- 在简历数据或独立 metadata 中增加 `templateId`
- 编辑页、打印页、缩略图统一读取该值
- 后续再补模板切换 UI

第一阶段即使不立刻做 UI，也应该先把底层状态打通。

### 5. 建立基于浏览器原生打印的打印约束

模板底座需要内建打印语义，但打印执行本身交给浏览器原生打印能力处理。

建议统一约束：

- A4 宽度与页边距 token
- section `break-inside: avoid`
- 标题与首条内容避免断页分离
- 列表、标签、Markdown 段落在打印态的最小行高策略
- 长简历的压缩回退策略

不建议在这一阶段额外建设复杂的自定义 PDF 排版系统。更合适的路线是：

- 编辑页和打印页输出稳定的 HTML 结构
- 在 `/resume-print/[id]` 中加载打印专用样式
- 由浏览器原生打印和保存为 PDF 完成最终输出

### 6. 固定 section 标题策略

把 section 主标题从数据层中解耦出来，建立统一标题映射。

建议：

- section 主标题由 `sectionId + resume.language` 决定
- 数据层中的 `section.title` 逐步降级为兼容字段，或仅作为旧数据回退
- 模板层优先读取统一标题映射，不直接信任任意数据标题

这样能保证：

- 不同模板的标题语义统一
- 用户动态新增 section 时标题自动正确
- 中英文下标题可以稳定 i18n
- 标题语言与该份简历自身语言保持一致，不跟随用户界面 locale 漂移

### 7. 支持动态添加或删除 section

模板底座需要正式支持 section 生命周期，而不只是 block 生命周期。

建议定义：

- `requiredSections`
  - 例如 `personalInfo`、`education`、`skills`
- `optionalSections`
  - 例如 `employment`、`projects`、`research`、`awards`、`certifications`

并建立统一行为：

- 添加 section 时：
  - 创建对应 section 结构
  - 注入固定标题
  - 生成默认空 block 或最小可编辑内容
  - 插入到默认排序位置
- 删除 section 时：
  - 从 `sectionOrder` 中移除
  - 隐藏该 section 的表单与预览
  - 保证模板渲染不报错

后续如果产品需要，也可以增加“删除 section”与“清空 section 内容”之间的区分。

### 8. 收敛模板样式实现方式

结合现有项目规范，逐步减少模板层独立 CSS 文件和 inline style，尽量收敛到：

- Tailwind utility
- 统一 class token
- 少量必要的 print 样式入口

这能让模板层和项目整体样式体系保持一致，降低维护成本。

前提约束：

- 迁移方式可以调整，但最终视觉样式不应变化
- 重点是“样式实现方式收敛”，不是“顺手做视觉改版”

## 实施步骤

### Phase 1: 梳理模板定义、section 语义与状态入口

- 扩展 `TemplateConfig` 为更完整的模板定义结构
- 明确模板元信息字段
- 定义 `requiredSections` / `optionalSections`
- 定义 section 固定标题映射与 i18n 来源，基于 `resume.language`
- 为简历补充 `templateId` 存储位，或设计独立 metadata 承载
- 调整 `useResumeTemplate`，支持从外部状态读取而不是只依赖本地 state

### Phase 2: 提取共享 primitive 与 section renderer

- 从 `default-template.tsx` 中抽离高频重复结构
- 为教育、经历、项目、研究、奖项等建立统一 entry renderer 模式
- 保持 `SectionBlocks` 作为容器，但收敛其职责，只负责 section 包装和 block 遍历
- 让 `SectionBlocks` 与模板层优先读取固定 section 标题映射
- 减少模板组件内部的大段重复 JSX
- 如需迁移现有模板 CSS 到 Tailwind，只做等价迁移

### Phase 3: 补齐模板能力一致性

- 让 `modern` 模板补齐对所有已支持 section 的处理
- 所有模板统一尊重 `sectionOrder`
- 对缺失 section 的模板表现建立明确策略：
  - 支持并渲染
  - 不支持但有明确 fallback
  - 不允许静默消失
- 建立 section 添加/删除后的统一渲染与回退行为

### Phase 4: 打通浏览器打印与缩略图一致性

- 让打印页明确读取当前模板定义
- 建立基础 `print.css` 规则和模板打印 token
- 检查缩略图生成是否与当前模板一致
- 为分页、长内容、标签换行等情况建立回归样例
- 打印动作默认走浏览器原生打印能力，不额外引入自定义导出排版链路

### Phase 5: 为模板选择器做准备

- 输出模板列表所需的元数据
- 预留缩略图、描述、适用场景字段
- 若产品优先级允许，再接入模板切换 UI 和保存逻辑
- 为 section 增删入口预留能力描述，便于后续接入表单和编辑器 UI

## 验收标准

- 模板定义不再只有 `id/name/component` 三个字段
- 新增一个模板时，不需要复制整套 section 业务渲染逻辑
- `default` 和 `modern` 对已支持数据类型有一致的 section 覆盖策略
- 编辑预览、打印页、缩略图可以读取同一个模板来源
- section 主标题在不同模板下保持语义一致，并可随 `resume.language` 在中文和英文之间正确切换
- 用户可以动态添加或删除可选 section，模板渲染与编辑链路保持稳定
- 长简历打印时，section 断页和页边距表现稳定
- 模板层实现基本符合项目 Tailwind 约定，额外样式出口收敛
- 模板底座重构前后，`default` 和 `modern` 的视觉样式无明显变化

## 风险与注意事项

- 如果过早追求“高度抽象”，容易把模板层做得难以理解，影响迭代速度
- 如果不先统一 section 语义，后续模板越多，重复逻辑和行为分叉会越严重
- `templateId` 放在 `resume_json` 还是独立 metadata，需要结合后端存储和兼容性一起判断
- 如果直接移除 `section.title` 的业务含义，需要处理旧数据兼容
- 如果错误使用用户 locale 而不是 `resume.language`，会导致简历标题语言和简历内容语言不一致
- section 删除行为要区分“隐藏 section”和“删除内容”，避免误伤用户数据
- 打印优化可能暴露现有 Markdown 内容在分页、列表、长文本下的边界问题
- 若模板切换进入产品流，需要同步考虑评估、导出、缩略图缓存失效等问题

## 推荐落地顺序

1. 先做模板定义层、固定标题映射和 section 增删语义
2. 再提取共享 primitive 与 section renderer
3. 然后补齐 `modern` 与其他模板的一致性
4. 最后统一浏览器打印和缩略图链路

## 预期结果

完成后，项目里的 resume template 将从“可运行的两套版式组件”升级为“可扩展的模板底座”。

后续无论是继续增加模板、开放模板切换、还是优化打印导出，都会建立在更稳定、更低重复、更容易测试的基础上。
