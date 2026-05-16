import { DEFAULT_SECTION_ORDER } from "@/lib/templates/section-definitions"
import type { SortableSectionKey, ResumeData } from "@/types/resume"

export type SectionEntryAction = {
  sectionId: SortableSectionKey
  action: "add" | "open"
}

export function getSectionEntryActions(
  currentResume: ResumeData
): SectionEntryAction[] {
  return DEFAULT_SECTION_ORDER.flatMap((sectionId): SectionEntryAction[] => {
    const section = currentResume[sectionId]
    const isInOrder = currentResume.sectionOrder.includes(sectionId)

    if (!section || !isInOrder) {
      return [{ sectionId, action: "add" }]
    }

    if (section.blocks.length === 0) {
      return [{ sectionId, action: "open" }]
    }

    return []
  })
}
