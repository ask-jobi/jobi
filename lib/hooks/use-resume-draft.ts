"use client"

import { useMemo } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useResume, useResumeLanguage } from "@/lib/store/resume"
import {
  ensureSectionHasEditableBlock,
  insertDraftBlockBelow
} from "@/lib/templates/section-helpers"
import type {
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import type { ResumeData, SectionId, SortableSectionId } from "@/types/resume"

type ResumeDraftSelection = {
  resume: ResumeData
  blockId: string | null
  blockIndex: number | null
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

    if (!section || !("blocks" in section)) {
      return copiedResume
    }

    if (modifyOutput.operation === "rewrite") {
      section.blocks.forEach((item) => {
        if (item.blockId === modifyOutput.id && modifyOutput.field in item) {
          // @ts-expect-error field comes from tool schema
          item[modifyOutput.field] = modifyOutput.value
        }
      })
    }

    if (modifyOutput.operation === "delete") {
      // @ts-expect-error filtered by id
      section.blocks = section.blocks.filter(
        (item) => item.blockId !== modifyOutput.id
      )
    }

    if (modifyOutput.operation === "add") {
      // @ts-expect-error adding new block from validated tool payload
      section.blocks.push(modifyOutput.newBlock)
    }

    return copiedResume
  }

  const reorderOutput = output as ResumeEditorReorderOutput

  if (reorderOutput.operation === "reorderBlocks") {
    const entity = reorderOutput.entity
    if (!entity) return copiedResume

    const section = copiedResume[entity]
    if (!section || !("blocks" in section)) return copiedResume

    const orderedBlocks = reorderOutput.orderedBlockIds
      ?.map((id: string) =>
        section.blocks.find((b: { blockId: string }) => b.blockId === id)
      )
      .filter(Boolean)

    if (orderedBlocks) {
      // @ts-expect-error reordering filtered existing blocks
      section.blocks = orderedBlocks
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
      ensureEditableSection: (sectionId: SectionId): ResumeDraftSelection => {
        if (sectionId === "personalInfo") {
          return {
            resume: getValues(),
            blockIndex: null,
            blockId: null
          }
        }

        const { resume, blockIndex } = ensureSectionHasEditableBlock(
          getValues(),
          sectionId,
          resumeLanguage
        )
        const blockId = resume[sectionId]?.blocks[blockIndex]?.blockId ?? null
        reset(resume)

        return {
          resume,
          blockIndex,
          blockId
        }
      },
      addBlockBelow: (
        sectionId: SortableSectionId,
        index: number
      ): ResumeDraftSelection => {
        const { resume, blockIndex } = insertDraftBlockBelow(
          getValues(),
          sectionId,
          index
        )
        const blockId = resume[sectionId]?.blocks[blockIndex]?.blockId ?? null
        reset(resume)

        return {
          resume,
          blockIndex,
          blockId
        }
      },
      deleteBlock: (sectionId: SortableSectionId, index: number) => {
        const nextResume = structuredClone(getValues()) as ResumeData
        const section = nextResume[sectionId]

        if (!section || !("blocks" in section) || !section.blocks[index]) {
          return nextResume
        }

        section.blocks = section.blocks.filter((_, blockIndex) => {
          return blockIndex !== index
        }) as typeof section.blocks

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
