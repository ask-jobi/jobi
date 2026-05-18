import type { Locale } from "@/lib/i18n/config"
import { addSection, removeSection } from "@/lib/templates/section-helpers"
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

export function applyToolOutputToResume(
  baseResume: ResumeData,
  output: ResumeEditorModifyOutput | ResumeEditorReorderOutput
): ResumeData {
  const copiedResume = structuredClone(baseResume) as ResumeData

  if (
    output.operation === "rewrite" ||
    output.operation === "delete" ||
    output.operation === "add"
  ) {
    const modifyOutput = output as ResumeEditorModifyOutput
    const section = copiedResume[modifyOutput.entity]

    if (!section || !("entries" in section)) {
      return copiedResume
    }

    if (modifyOutput.operation === "rewrite") {
      section.entries.forEach((item) => {
        if (item.entryId === modifyOutput.id && modifyOutput.field in item) {
          // @ts-expect-error field comes from tool schema
          item[modifyOutput.field] = modifyOutput.value
        }
      })
    }

    if (modifyOutput.operation === "delete") {
      section.entries = section.entries.filter(
        (item) => item.entryId !== modifyOutput.id
      ) as typeof section.entries

      if (section.entries.length === 0) {
        return removeSection(copiedResume, modifyOutput.entity)
      }
    }

    if (modifyOutput.operation === "add") {
      section.entries.push(modifyOutput.newEntry as never)
    }

    return copiedResume
  }

  const reorderOutput = output as ResumeEditorReorderOutput

  if (reorderOutput.operation === "reorderEntries") {
    const entity = reorderOutput.entity
    if (!entity) {
      return copiedResume
    }

    const section = copiedResume[entity]
    if (!section || !("entries" in section)) {
      return copiedResume
    }

    const orderedEntries = reorderOutput.orderedEntryIds
      ?.map((id) =>
        section.entries.find(
          (entry: { entryId: string }) => entry.entryId === id
        )
      )
      .filter(Boolean)

    if (orderedEntries) {
      section.entries = orderedEntries as typeof section.entries
    }

    return copiedResume
  }

  if (
    reorderOutput.operation === "reorderSections" &&
    reorderOutput.orderedSectionIds
  ) {
    copiedResume.sectionOrder = reorderOutput.orderedSectionIds
  }

  return copiedResume
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
