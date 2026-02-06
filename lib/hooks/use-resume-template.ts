"use client"

import { useState, useMemo } from "react"
import {
  registry,
  type ResumeTemplateComponent
} from "@/lib/templates/registry"

interface UseResumeTemplateReturn {
  Template: ResumeTemplateComponent
  templates: { id: string; name: string }[]
  switchTemplate: (id: string) => void
}

export function useResumeTemplate(
  initialId: string = "default"
): UseResumeTemplateReturn {
  const [templateId, setTemplateId] = useState(initialId)

  const templates = useMemo(() => registry.getAll(), [])

  const Template = useMemo(() => {
    const component = registry.get(templateId)
    return component || registry.get("default")!
  }, [templateId])

  return {
    Template,
    templates,
    switchTemplate: setTemplateId
  }
}
