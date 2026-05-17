# 添加双栏布局简历模版实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个新的双栏布局简历模版，左侧为边栏（联系信息、技能、工作经验），右侧为主要内容区（教育背景、项目经验等），配色为深色系。

**Architecture:** 基于现有的 DefaultTemplate 和 ModernTemplate 组件结构，创建 TwoColumnTemplate 组件。使用 CSS Grid 或 Flexbox 实现双栏布局，左侧边栏宽度约 30%，使用深灰色背景。

**Tech Stack:** React, TypeScript, Tailwind CSS

---

### Task 1: 创建 TwoColumnTemplate 组件文件

**Files:**
- Create: `components/resume-templates/two-column-template.tsx`

**Step 1: 创建基础组件结构**

```tsx
"use client"

import React from "react"
import type { Locale } from "@/lib/i18n/config"
import type { ResumeData } from "@/types/resume"
import MarkdownRender from "@/components/resume-templates/markdown/MarkdownRender"
import { SectionBlocks } from "@/components/resume-templates/section-blocks"
import ResumeSkeleton from "@/components/skeletons/resume-skeleton"
import { TemplateOptions } from "@/lib/templates/registry"
import { getSectionLabel } from "@/lib/templates/section-labels"

interface Props {
  data: ResumeData | null
  language: Locale
  options?: TemplateOptions
}

export const TwoColumnTemplate: React.FC<Props> = ({
  data,
  language,
  options
}) => {
  const { onSectionClick, isInteractive } = options ?? {}
  
  if (!data) {
    return (
      <div className="w-full flex justify-center items-start py-4">
        <ResumeSkeleton />
      </div>
    )
  }

  return (
    <article id="resume" data-resume-ready="true" className="bg-white p-8 pdf">
      {/* 双栏布局 */}
      <div className="grid grid-cols-1 md:grid-cols-[30%_70%] gap-6">
        {/* 左侧边栏 */}
        <aside className="bg-gray-800 text-white p-4 rounded-l">
          {/* 个人信息 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {data.personalInfo.firstName} {data.personalInfo.lastName}
            </h1>
            <div className="text-sm text-gray-300 space-y-1">
              <p>{data.personalInfo.email}</p>
              <p>{data.personalInfo.phone}</p>
              {data.personalInfo.linkedin && <p>LinkedIn: {data.personalInfo.linkedin}</p>}
              {data.personalInfo.website && <p>Website: {data.personalInfo.website}</p>}
            </div>
          </div>

          {/* 技能 */}
          <SectionBlocks
            sectionId="skills"
            section={data.skills}
            sectionTitle={getSectionLabel("skills", language)}
            isInteractive={isInteractive}
            onBlockClick={onSectionClick}
            sectionClassName="two-col-skill-section"
            headRender={(block) => (
              <h3 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                {block.group}
              </h3>
            )}
            blockRender={(block) => (
              <div className="flex flex-wrap gap-2">
                {block.content?.split(",").map((item, itemIndex) => (
                  <span
                    key={itemIndex}
                    className="text-xs bg-gray-700 px-3 py-1.5 rounded-md text-gray-200"
                  >
                    {item.trim()}
                  </span>
                ))}
              </div>
            )}
          />

          {/* 工作经验 */}
          <SectionBlocks
            sectionId="employment"
            section={data.employment}
            sectionTitle={getSectionLabel("employment", language)}
            isInteractive={isInteractive}
            onBlockClick={onSectionClick}
            sectionClassName="two-col-employment-section"
            hideIfEmpty
            headRender={(block) => (
              <div className="mb-2">
                <h3 className="text-base font-semibold">{block.company}</h3>
                <p className="text-sm text-gray-400">{block.jobTitle}</p>
                <span className="text-xs text-gray-500">{block.start} - {block.end}</span>
              </div>
            )}
            blockRender={(block) => <MarkdownRender markdown={block.content} />}
          />
        </aside>

        {/* 右侧内容区 */}
        <main>
          {/* 教育背景 */}
          <SectionBlocks
            sectionId="education"
            section={data.education}
            sectionTitle={getSectionLabel("education", language)}
            isInteractive={isInteractive}
            onBlockClick={onSectionClick}
            sectionClassName="two-col-education-section"
            headRender={(block) => (
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-lg font-semibold text-gray-800">{block.school}</h3>
                <span className="text-sm text-gray-500 font-medium">{block.start} - {block.end}</span>
              </div>
            )}
            blockRender={(block) => (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">{block.degree}</p>
                <MarkdownRender markdown={block.content} />
              </div>
            )}
          />

          {/* 项目经验 */}
          <SectionBlocks
            sectionId="projects"
            section={data.projects}
            sectionTitle={getSectionLabel("projects", language)}
            isInteractive={isInteractive}
            onBlockClick={onSectionClick}
            sectionClassName="two-col-projects-section"
            hideIfEmpty
            headRender={(block) => (
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-lg font-semibold text-gray-800">{block.name}</h3>
                <span className="text-sm text-gray-500 font-medium">{block.start} - {block.end}</span>
              </div>
            )}
            blockRender={(block) => <MarkdownRender markdown={block.content} />}
          />
        </main>
      </div>
    </article>
  )
}
```

**Step 2: 提交创建的文件**

```bash
git add components/resume-templates/two-column-template.tsx
git commit -m "feat: create TwoColumnTemplate component"
```

---

### Task 2: 注册模版到 registry

**Files:**
- Modify: `lib/templates/registry.ts:78`

**Step 1: 添加模版注册**

在文件末尾添加：

```ts
registry.register("two-column", TwoColumnTemplate, {
  id: "two-column",
  name: "Two Column",
  description: "Two-column resume layout with left sidebar",
  supportedSections: DEFAULT_SECTION_ORDER,
  requiredSections: REQUIRED_SECTION_IDS,
  optionalSections: OPTIONAL_SECTION_IDS
})
```

需要先导入组件：

```ts
import { TwoColumnTemplate } from "@/components/resume-templates/two-column-template"
```

**Step 2: 验证构建**

运行: `npm run typecheck`
Expected: 无错误

**Step 3: 提交更改**

```bash
git add lib/templates/registry.ts
git commit -m "feat: register TwoColumnTemplate to registry"
```

---

### Task 3: 验证模版功能

**Step 1: 启动开发服务器**

```bash
npm run dev
```

**Step 2: 测试模版渲染**

访问简历编辑页面，确认 Two Column 模版可以正常渲染。

**Step 3: 运行类型检查**

```bash
npm run typecheck
```

---

### 执行方式选择

**Plan complete and saved to `docs/plans/2026-04-08-two-column-resume-template.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
