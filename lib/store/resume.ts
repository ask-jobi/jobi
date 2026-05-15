import { atom, useAtom } from "jotai"
import {
  ResumeData,
  JobApplication,
  ResumeMetadata,
  ResumeJobDescription,
  SortableSectionId,
  SectionBlock,
  SectionId
} from "@/types/resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import { toast } from "sonner"
import { saveResumeChange } from "@/server/resume"
import { notifyTokenBalanceUpdated } from "@/lib/token-balance-events"

export const applicationAtom = atom<JobApplication | null>(null)
export const persistedResumeAtom = atom(
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
  const resume = get(persistedResumeAtom)
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
export const selectedSectionIdAtom = atom<SectionId | null>(null)
export const selectedBlockIdAtom = atom<string | null>(null)
const selectedBlockIndexStateAtom = atom<number | null>(null)
export const selectedBlockIndexAtom = atom(
  (get) => {
    const explicitIndex = get(selectedBlockIndexStateAtom)

    if (explicitIndex !== null) {
      return explicitIndex
    }

    const selectedSectionId = get(selectedSectionIdAtom)
    const selectedBlockId = get(selectedBlockIdAtom)
    const resumeData = get(persistedResumeAtom)

    if (!selectedSectionId || !selectedBlockId || !resumeData) {
      return null
    }

    const section = resumeData[selectedSectionId]

    if (!section || !("blocks" in section)) {
      return null
    }

    const blockIndex = section.blocks.findIndex(
      (block: { blockId: string }) => block.blockId === selectedBlockId
    )

    return blockIndex >= 0 ? blockIndex : null
  },
  (_get, set, index: number | null) => {
    set(selectedBlockIndexStateAtom, index)
  }
)
export const rightPanelViewAtom = atom<"evaluation" | "chat">("evaluation")
export const editModalOpenAtom = atom(false)
export const draftRollbackResumeAtom = atom<ResumeData | null>(null)
export const editModalRollbackResumeAtom = draftRollbackResumeAtom

export const resumeAutosaveSuspendedAtom = atom(
  (get) => get(editModalOpenAtom) && get(draftRollbackResumeAtom) !== null
)

export const clearEditorSelectionAtom = atom(null, (_get, set) => {
  set(selectedSectionIdAtom, null)
  set(selectedBlockIdAtom, null)
  set(selectedBlockIndexAtom, null)
})

export const focusSectionAtom = atom(
  null,
  (get, set, id: SectionId, index?: number, blockId?: string | null) => {
    const resumeData = get(persistedResumeAtom)
    set(selectedSectionIdAtom, id)
    set(selectedBlockIndexAtom, typeof index === "number" ? index : null)
    if (typeof index === "number" && resumeData) {
      const section = resumeData[id]
      if (section && "blocks" in section) {
        set(
          selectedBlockIdAtom,
          blockId ?? section.blocks[index]?.blockId ?? null
        )
      } else {
        set(selectedBlockIdAtom, blockId ?? null)
      }
    } else {
      set(selectedBlockIdAtom, null)
    }
  }
)

export function useResumeLanguage() {
  const [resumeMetadata] = useAtom(resumeMetadataAtom)

  return resumeMetadata.language
}

export function useResume() {
  const [persistedResume, setPersistedResume] = useAtom(persistedResumeAtom)
  const [application] = useAtom(applicationAtom)
  const [jobDescription, setJobDescription] = useAtom(jobAtom)
  const [isLoading, setLoading] = useAtom(isLoadingAtom)
  const [resumeEvaluation, setResumeEvaluation] = useAtom(resumeEvaluationAtom)
  const [evaluationRefreshFlag, setEvaluationRefreshFlag] = useAtom(
    evaluationRefreshFlagAtom
  )

  const replacePersistedResume = (data: ResumeData) => setPersistedResume(data)

  const saveResume = async (data: ResumeData) => {
    if (!application?.resume.id) return
    setPersistedResume(data)
    try {
      await saveResumeChange(application.resume.id, data)
    } catch (error) {
      console.error("Save failed:", error)
      toast.error("Auto save failed")
    }
  }

  const refreshEvaluationReport = async () => {
    const response = await fetch("/api/evaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        resumeId: application?.resume.id,
        resumeData: persistedResume,
        jobDescription: jobDescription
      })
    })
    const result = await response.json()
    if (!response.ok) {
      toast.error(result.error)
    } else {
      setResumeEvaluation(result)
      setEvaluationRefreshFlag(false)
      notifyTokenBalanceUpdated()
    }
  }

  return {
    persistedResume,
    application: application as JobApplication,
    isLoading,
    setLoading,
    replacePersistedResume,
    saveResume,
    resumeEvaluation,
    setResumeEvaluation,
    jobDescription,
    setJobDescription,
    evaluationRefreshFlag,
    setEvaluationRefreshFlag,
    refreshEvaluationReport
  }
}
