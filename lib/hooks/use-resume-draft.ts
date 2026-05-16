"use client"

import { useMemo } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useResume, useResumeLanguage } from "@/lib/store/resume"
import {
  ensureSectionHasEditableEntry,
  insertDraftEntryBelow
} from "@/lib/templates/section-helpers"
import type {
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import type {
  SortableSectionKey,
  ResumeData,
  ResumeSectionKey
} from "@/types/resume"

type ResumeDraftSelection = {
  resume: ResumeData
  entryId: string | null
  entryIndex: number | null
}

function applyToolOutputToResume(
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
      // @ts-expect-error filtered by id
      section.entries = section.entries.filter(
        (item) => item.entryId !== modifyOutput.id
      )
    }

    if (modifyOutput.operation === "add") {
      // @ts-expect-error adding new entry from validated tool payload
      section.entries.push(modifyOutput.newEntry)
    }

    return copiedResume
  }

  const reorderOutput = output as ResumeEditorReorderOutput

  if (reorderOutput.operation === "reorderEntries") {
    const entity = reorderOutput.entity
    if (!entity) return copiedResume

    const section = copiedResume[entity]
    if (!section || !("entries" in section)) return copiedResume

    const orderedEntries = reorderOutput.orderedEntryIds
      ?.map((id: string) =>
        section.entries.find((entry: { entryId: string }) => entry.entryId === id)
      )
      .filter(Boolean)

    if (orderedEntries) {
      // @ts-expect-error reordering filtered existing entries
      section.entries = orderedEntries
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

export function useResumeDraft() {
  const { control, getValues, reset } = useFormContext<ResumeData>()
  const draft = useWatch({ control }) as ResumeData
  const { saveResume } = useResume()
  const resumeLanguage = useResumeLanguage()

  const commands = useMemo(
    () => ({
      getDraft: () => getValues(),
      resetDraft: (nextResume: ResumeData) => {
        reset(nextResume)
      },
      commitDraft: async (nextResume?: ResumeData) => {
        await saveResume(nextResume ?? getValues())
      },
      ensureEditableSection: (
        sectionId: ResumeSectionKey
      ): ResumeDraftSelection => {
        if (sectionId === "personalInfo") {
          return {
            resume: getValues(),
            entryIndex: null,
            entryId: null
          }
        }

        const { resume, entryIndex } = ensureSectionHasEditableEntry(
          getValues(),
          sectionId,
          resumeLanguage
        )
        const entryId = resume[sectionId]?.entries[entryIndex]?.entryId ?? null
        reset(resume)

        return {
          resume,
          entryIndex,
          entryId
        }
      },
      addEntryBelow: (
        sectionId: SortableSectionKey,
        index: number
      ): ResumeDraftSelection => {
        const { resume, entryIndex } = insertDraftEntryBelow(
          getValues(),
          sectionId,
          index
        )
        const entryId = resume[sectionId]?.entries[entryIndex]?.entryId ?? null
        reset(resume)

        return {
          resume,
          entryIndex,
          entryId
        }
      },
      deleteEntry: (sectionId: SortableSectionKey, index: number) => {
        const nextResume = structuredClone(getValues()) as ResumeData
        const section = nextResume[sectionId]

        if (!section || !("entries" in section) || !section.entries[index]) {
          return nextResume
        }

        section.entries = section.entries.filter((_, entryIndex) => {
          return entryIndex !== index
        }) as typeof section.entries

        reset(nextResume)
        return nextResume
      },
      applyToolOutput: (
        output: ResumeEditorModifyOutput | ResumeEditorReorderOutput
      ) => {
        const nextResume = applyToolOutputToResume(getValues(), output)
        reset(nextResume)
        return nextResume
      }
    }),
    [getValues, reset, resumeLanguage, saveResume]
  )

  return {
    draft,
    ...commands
  }
}
