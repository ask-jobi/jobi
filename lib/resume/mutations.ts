import type { Locale } from "@/lib/i18n/config"
import { addSection, removeSection } from "@/lib/templates/section-helpers"
import { applyAiResumeEdit } from "@/lib/resume/ai-edits"
import type {
  PersonalInfo,
  ResumeData,
  ResumeSection,
  SortableSectionKey
} from "@/types/resume"
import type {
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"

type ResumeSectionEntry<ID extends SortableSectionKey> =
  NonNullable<ResumeData[ID]> extends ResumeSection<infer Entry> ? Entry : never

export function replacePersonalInfoInResume(
  resume: ResumeData,
  personalInfo: PersonalInfo
): ResumeData {
  return {
    ...resume,
    personalInfo
  }
}

export function replaceSectionEntryInResume<ID extends SortableSectionKey>(
  resume: ResumeData,
  sectionId: ID,
  entryIndex: number,
  entry: ResumeSectionEntry<ID>
): ResumeData {
  const section = resume[sectionId]

  if (!section || !section.entries[entryIndex]) {
    return resume
  }

  return {
    ...resume,
    [sectionId]: {
      ...section,
      entries: section.entries.map((currentEntry, currentIndex) =>
        currentIndex === entryIndex ? entry : currentEntry
      ) as typeof section.entries
    }
  }
}

export function deleteSectionEntryInResume<ID extends SortableSectionKey>(
  resume: ResumeData,
  sectionId: ID,
  entryIndex: number
): ResumeData {
  const section = resume[sectionId]

  if (!section || !section.entries[entryIndex]) {
    return resume
  }

  const nextEntries = section.entries.filter(
    (_entry, currentIndex) => currentIndex !== entryIndex
  ) as typeof section.entries

  if (nextEntries.length === 0) {
    return removeSection(
      {
        ...resume,
        [sectionId]: {
          ...section,
          entries: nextEntries
        }
      },
      sectionId
    )
  }

  return {
    ...resume,
    [sectionId]: {
      ...section,
      entries: nextEntries
    }
  }
}

export function reorderSectionEntriesInResume<ID extends SortableSectionKey>(
  resume: ResumeData,
  sectionId: ID,
  fromIndex: number,
  toIndex: number
): ResumeData {
  const section = resume[sectionId]

  if (
    !section ||
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= section.entries.length ||
    toIndex >= section.entries.length
  ) {
    return resume
  }

  const nextEntries = [...section.entries] as Array<ResumeSectionEntry<ID>>
  const [movedEntry] = nextEntries.splice(fromIndex, 1)

  if (!movedEntry) {
    return resume
  }

  nextEntries.splice(toIndex, 0, movedEntry)

  return {
    ...resume,
    [sectionId]: {
      ...section,
      entries: nextEntries as typeof section.entries
    }
  }
}

export function moveSectionInResume(
  resume: ResumeData,
  sectionId: SortableSectionKey,
  direction: "up" | "down"
): ResumeData {
  const visibleSectionIds = resume.sectionOrder.filter((currentSectionId) => {
    const section = resume[currentSectionId]
    return !!section && section.entries.length > 0
  })
  const currentIndex = visibleSectionIds.indexOf(sectionId)

  if (currentIndex === -1) {
    return resume
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

  if (targetIndex < 0 || targetIndex >= visibleSectionIds.length) {
    return resume
  }

  const nextVisibleSectionIds = [...visibleSectionIds]
  const [movedSectionId] = nextVisibleSectionIds.splice(currentIndex, 1)

  if (!movedSectionId) {
    return resume
  }

  nextVisibleSectionIds.splice(targetIndex, 0, movedSectionId)

  let visibleIndex = 0
  const nextSectionOrder = resume.sectionOrder.map((currentSectionId) => {
    const section = resume[currentSectionId]

    if (!section || section.entries.length === 0) {
      return currentSectionId
    }

    const nextSectionId = nextVisibleSectionIds[visibleIndex]
    visibleIndex += 1
    return nextSectionId ?? currentSectionId
  })

  return nextSectionOrder.every(
    (currentSectionId, index) => currentSectionId === resume.sectionOrder[index]
  )
    ? resume
    : {
        ...resume,
        sectionOrder: nextSectionOrder
      }
}

export function applyToolOutputToResume(
  baseResume: ResumeData,
  output: ResumeEditorModifyOutput | ResumeEditorReorderOutput
): ResumeData {
  return applyAiResumeEdit(baseResume, output)
}

export function insertSectionEntryInResume<ID extends SortableSectionKey>(
  resume: ResumeData,
  sectionId: ID,
  entryIndex: number,
  entry: ResumeSectionEntry<ID>,
  resumeLanguage: Locale
): ResumeData {
  const nextResume = addSection(resume, sectionId, resumeLanguage)
  const section = nextResume[sectionId]

  if (!section) {
    return nextResume
  }

  const nextEntries = [...section.entries] as Array<ResumeSectionEntry<ID>>
  const targetIndex = Math.min(Math.max(entryIndex, 0), nextEntries.length)

  nextEntries.splice(targetIndex, 0, entry)

  return {
    ...nextResume,
    [sectionId]: {
      ...section,
      entries: nextEntries as typeof section.entries
    }
  }
}
