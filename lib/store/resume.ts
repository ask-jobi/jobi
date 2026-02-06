import { atom, useAtom, useSetAtom } from "jotai"
import {
  ResumeData,
  JobApplication,
  ResumeMetadata,
  ResumeJobDescription,
  SortableSectionId,
  SectionBlock
} from "@/types/resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import type {
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import { toast } from "sonner"
import { saveResumeChange } from "@/server/resume"

export const applicationAtom = atom<JobApplication | null>(null)
export const resumeDataAtom = atom(
  (get) => {
    const app = get(applicationAtom)
    return app ? app.resume.resume_json : null
  },
  (get, set, update: ResumeData) => {
    const app = get(applicationAtom)
    if (!app) return
    set(evaluationRefreshFlagAtom, true)
    set(applicationAtom, {
      ...app,
      resume: {
        ...app.resume,
        resume_json: update
      }
    })
  }
)

export type ResumeIndex = {
  sectionMap: Map<SortableSectionId, SectionBlock>
  blockMap: Map<string, { sectionId: SortableSectionId; block: any }>
}
export const resumeIndexAtom = atom((get): ResumeIndex => {
  const resume = get(resumeDataAtom)
  const sectionMap = new Map<SortableSectionId, SectionBlock>()
  const blockMap = new Map<
    string,
    { sectionId: SortableSectionId; block: any }
  >()

  if (!resume) return { sectionMap, blockMap }

  for (const sectionId of resume.sectionOrder) {
    const section = resume[sectionId] as SectionBlock | undefined
    if (!section) continue

    sectionMap.set(sectionId, section)

    for (const block of section.blocks) {
      blockMap.set(block.id, { sectionId, block })
    }
  }

  return { sectionMap, blockMap }
})

export const resumeMetadataAtom = atom<ResumeMetadata>((get) => {
  const app = get(applicationAtom)
  if (!app) return { language: "en" }
  return { language: app.resume.language }
})
export const jobAtom = atom(
  (get) => {
    const app = get(applicationAtom)
    return app ? app.job : null
  },
  (get, set, update: Partial<ResumeJobDescription>) => {
    const app = get(applicationAtom)
    if (!app) return
    set(evaluationRefreshFlagAtom, true)
    set(applicationAtom, {
      ...app,
      job: {
        ...app.job,
        ...update
      }
    })
  }
)
export const resumeEvaluationAtom = atom(
  (get) => {
    const app = get(applicationAtom)
    if (!app) return null
    return app.resume.evaluation_report
  },
  (get, set, update: ResumeEvaluationOutput) => {
    const app = get(applicationAtom)
    if (!app) return
    set(evaluationRefreshFlagAtom, false)
    set(applicationAtom, {
      ...app,
      resume: {
        ...app.resume,
        evaluation_report: update
      }
    })
  }
)
export const evaluationRefreshFlagAtom = atom(
  (get) => {
    const app = get(applicationAtom)
    if (!app) return null
    return app.resume.evaluation_report_refresh_flag ?? false
  },
  (get, set, flag: boolean) => {
    const app = get(applicationAtom)
    if (!app) return
    set(applicationAtom, {
      ...app,
      resume: {
        ...app.resume,
        evaluation_report_refresh_flag: flag
      }
    })
  }
)

export const isLoadingAtom = atom(false)
export const selectedSectionIdAtom = atom<string | null>(null)
export const rightPanelViewAtom = atom<"form" | "evaluation" | "chat">(
  "evaluation"
)
export const isRightPanelCollapsedAtom = atom(false)

export const openRightPanelAtom = atom(
  null,
  (get, set, view: "form" | "evaluation" | "chat" = "form") => {
    set(rightPanelViewAtom, view)
    set(isRightPanelCollapsedAtom, false)
  }
)

export const focusSectionAtom = atom(
  null,
  (get, set, id: string, index?: number) => {
    set(selectedSectionIdAtom, id)
    let sectionId = `section-${id}`
    const formSectionId = `form-${id}-${index}`
    if (index && index > 0) {
      sectionId = `section-${id}-${index}`
    }
    const sectionElement = document.getElementById(sectionId)
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    setTimeout(() => {
      const formElement = document.getElementById(formSectionId)
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    })
  }
)

export function useResumeLanguage() {
  const [resumeMetadata] = useAtom(resumeMetadataAtom)

  return resumeMetadata.language
}

export function useResume() {
  const [resumeData, setResumeData] = useAtom(resumeDataAtom)
  const [application] = useAtom(applicationAtom)
  const [jobDescription, setJobDescription] = useAtom(jobAtom)
  const [isLoading, setLoading] = useAtom(isLoadingAtom)
  const [selectedSectionId] = useAtom(selectedSectionIdAtom)
  const [resumeEvaluation, setResumeEvaluation] = useAtom(resumeEvaluationAtom)
  const [evaluationRefreshFlag, setEvaluationRefreshFlag] = useAtom(
    evaluationRefreshFlagAtom
  )
  const handleSectionClick = useSetAtom(focusSectionAtom)

  const updateResumeData = (data: ResumeData) => setResumeData(data)

  const updateResumeDataWithSave = async (data: ResumeData) => {
    if (!application?.resume.id) return
    setResumeData(data)
    try {
      await saveResumeChange(application.resume.id, data)
    } catch (error) {
      console.error("Save failed:", error)
      toast.error("Auto save failed")
    }
  }

  const updateResumeByToolOutput = async (
    output: ResumeEditorModifyOutput | ResumeEditorReorderOutput
  ) => {
    const copiedResume = structuredClone(resumeData) as ResumeData

    if (
      output.operation === "rewrite" ||
      output.operation === "delete" ||
      output.operation === "add"
    ) {
      const modifyOutput = output as ResumeEditorModifyOutput

      if (modifyOutput.operation === "rewrite") {
        const section = copiedResume[modifyOutput.entity]
        if (!section || !("blocks" in section)) return resumeData as ResumeData

        section.blocks.forEach((item) => {
          if (item.blockId === modifyOutput.id && modifyOutput.field in item) {
            // @ts-expect-error ignore
            item[modifyOutput.field] = modifyOutput.value
          }
        })
      }

      if (modifyOutput.operation === "delete") {
        const section = copiedResume[modifyOutput.entity]
        if (!section || !("blocks" in section)) return resumeData as ResumeData

        // @ts-expect-error - filtered by id
        section.blocks = section.blocks.filter(
          (item) => item.blockId !== modifyOutput.id
        )
      }

      if (modifyOutput.operation === "add") {
        const section = copiedResume[modifyOutput.entity]
        if (!section || !("blocks" in section)) return resumeData as ResumeData

        // @ts-expect-error - adding new block
        section.blocks.push(modifyOutput.newBlock)
      }
    }

    if (
      output.operation === "reorderBlocks" ||
      output.operation === "reorderSections"
    ) {
      const reorderOutput = output as ResumeEditorReorderOutput

      if (reorderOutput.operation === "reorderBlocks") {
        const entity = reorderOutput.entity
        if (!entity) return resumeData as ResumeData

        const section = copiedResume[entity]
        if (!section || !("blocks" in section)) return resumeData as ResumeData

        const orderedBlocks = reorderOutput.orderedBlockIds
          ?.map((id: string) =>
            section.blocks.find((b: { blockId: string }) => b.blockId === id)
          )
          .filter(Boolean)

        if (orderedBlocks) {
          // @ts-expect-error - reordering blocks
          section.blocks = orderedBlocks
        }
      }

      if (reorderOutput.operation === "reorderSections") {
        if (reorderOutput.orderedSectionIds) {
          copiedResume.sectionOrder = reorderOutput.orderedSectionIds
        }
      }
    }

    await updateResumeDataWithSave(copiedResume)
  }

  const refreshEvaluationReport = async () => {
    const response = await fetch("/api/evaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        resumeId: application?.resume.id,
        resumeData: resumeData,
        jobDescription: jobDescription
      })
    })
    const result = await response.json()
    if (!response.ok) {
      toast.error(result.error)
    } else {
      setResumeEvaluation(result)
      setEvaluationRefreshFlag(false)
    }
  }

  return {
    resumeData,
    application: application as JobApplication,
    isLoading,
    setLoading,
    updateResumeData,
    updateResumeDataWithSave,
    updateResumeByToolOutput,
    selectedSectionId,
    handleSectionClick,
    resumeEvaluation,
    setResumeEvaluation,
    jobDescription,
    setJobDescription,
    evaluationRefreshFlag,
    setEvaluationRefreshFlag,
    refreshEvaluationReport
  }
}
