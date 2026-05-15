import React from "react"
import type { Locale } from "@/lib/i18n/config"
import type { ResumeData, SectionId, SortableSectionId } from "@/types/resume"
import { DefaultTemplate } from "@/components/resume-templates/default-template"
import { ModernTemplate } from "@/components/resume-templates/modern-template"
import {
  DEFAULT_SECTION_ORDER,
  OPTIONAL_SECTION_IDS,
  REQUIRED_SECTION_IDS
} from "@/lib/templates/section-definitions"

export interface TemplateOptions {
  isInteractive?: boolean
  onBlockAdd?: (id: SortableSectionId, index: number) => void
  onBlockDelete?: (id: SortableSectionId, index: number) => void
  onSectionClick?: (id: SectionId, index?: number) => void
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
  supportedSections: SortableSectionId[]
  requiredSections: SortableSectionId[]
  optionalSections: SortableSectionId[]
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
  requiredSections: REQUIRED_SECTION_IDS,
  optionalSections: OPTIONAL_SECTION_IDS
})

registry.register("modern", ModernTemplate, {
  id: "modern",
  name: "Modern",
  description: "Modern single-column resume layout",
  supportedSections: DEFAULT_SECTION_ORDER,
  requiredSections: REQUIRED_SECTION_IDS,
  optionalSections: OPTIONAL_SECTION_IDS
})
