import React from "react"
import type { Locale } from "@/lib/i18n/config"
import type {
  SortableSectionKey,
  ResumeData,
  ResumeSectionKey
} from "@/types/resume"
import { DefaultTemplate } from "@/components/resume-templates/default-template"
import { ModernTemplate } from "@/components/resume-templates/modern-template"
import {
  DEFAULT_SECTION_ORDER,
  OPTIONAL_SECTION_IDS,
  DEFAULT_STARTER_SECTION_IDS
} from "@/lib/templates/section-definitions"

export interface TemplateOptions {
  isInteractive?: boolean
  onEntryAdd?: (id: SortableSectionKey, index: number) => void
  onEntryDelete?: (id: SortableSectionKey, index: number) => void
  onEntryReorder?: (
    id: SortableSectionKey,
    fromIndex: number,
    toIndex: number
  ) => void | Promise<boolean>
  onSectionMoveUp?: (id: SortableSectionKey) => void | Promise<boolean>
  onSectionMoveDown?: (id: SortableSectionKey) => void | Promise<boolean>
  onSectionClick?: (id: ResumeSectionKey, index?: number) => void
  entryDragDisabled?: boolean
  sectionMoveDisabled?: boolean
}

export type ResumeTemplateComponent = React.ComponentType<{
  data: ResumeData | null
  language: Locale
  options?: TemplateOptions
}>

export interface TemplateConfig {
  id: string
  name: string
  description?: string
  supportedSections: SortableSectionKey[]
  starterSections: SortableSectionKey[]
  optionalSections: SortableSectionKey[]
}

export class TemplateRegistry {
  private templates = new Map<
    string,
    { component: ResumeTemplateComponent; config: TemplateConfig }
  >()

  register(
    id: string,
    component: ResumeTemplateComponent,
    config: TemplateConfig
  ) {
    this.templates.set(id, { component, config })
  }

  get(id: string): ResumeTemplateComponent | null {
    return this.templates.get(id)?.component || null
  }

  getConfig(id: string): TemplateConfig | null {
    return this.templates.get(id)?.config || null
  }

  getAll(): TemplateConfig[] {
    return Array.from(this.templates.values()).map((t) => t.config)
  }
}

export const registry = new TemplateRegistry()

registry.register("default", DefaultTemplate, {
  id: "default",
  name: "Default",
  description: "Classic single-column resume layout",
  supportedSections: DEFAULT_SECTION_ORDER,
  starterSections: DEFAULT_STARTER_SECTION_IDS,
  optionalSections: OPTIONAL_SECTION_IDS
})

registry.register("modern", ModernTemplate, {
  id: "modern",
  name: "Modern",
  description: "Modern single-column resume layout",
  supportedSections: DEFAULT_SECTION_ORDER,
  starterSections: DEFAULT_STARTER_SECTION_IDS,
  optionalSections: OPTIONAL_SECTION_IDS
})
