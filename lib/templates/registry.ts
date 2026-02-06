import React from "react"
import type { ResumeData } from "@/types/resume"
import { DefaultTemplate } from "@/components/resume-templates/default-template"
import { ModernTemplate } from "@/components/resume-templates/modern-template"

export interface TemplateOptions {
  isInteractive?: boolean
  onSectionClick?: (id: keyof ResumeData, index?: number) => void
}

export type ResumeTemplateComponent = React.ComponentType<{
  data: ResumeData | null
  options?: TemplateOptions
}>

interface TemplateConfig {
  id: string
  name: string
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
  name: "Default"
})

registry.register("modern", ModernTemplate, {
  id: "modern",
  name: "Modern"
})
