"use client"

import { useState, useMemo } from "react"
import {
  registry,
  type ResumeTemplateComponent
} from "@/lib/templates/registry"

interface UseResumeTemplateOptions {
  initialId?: string
  templateId?: string | null
}

interface UseResumeTemplateReturn {
  Template: ResumeTemplateComponent
  templates: { id: string; name: string }[]
  switchTemplate: (id: string) => void
}

export function useResumeTemplate(
  options: UseResumeTemplateOptions = {}
): UseResumeTemplateReturn {
  const { initialId = "default", templateId: controlledTemplateId } = options
  const [internalTemplateId, setInternalTemplateId] = useState(initialId)
  const activeTemplateId = controlledTemplateId ?? internalTemplateId

  const templates = useMemo(() => registry.getAll(), [])

  const Template = useMemo(() => {
    const component = registry.get(activeTemplateId)
    return component || registry.get("default")!
  }, [activeTemplateId])

  return {
    Template,
    templates,
    switchTemplate: setInternalTemplateId
  }
}
