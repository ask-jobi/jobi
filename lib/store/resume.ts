import { atom, useAtom } from "jotai"
import {
  ResumeData,
  JobApplication,
  ResumeMetadata,
  ResumeJobDescription,
  SortableSectionKey,
  ResumeSection,
  ResumeSectionKey
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
  sectionMap: Map<SortableSectionKey, ResumeSection>
  entryMap: Map<string, { sectionKey: SortableSectionKey; entry: any }>
}
export const resumeIndexAtom = atom((get): ResumeIndex => {
  const resume = get(persistedResumeAtom)
  const sectionMap = new Map<SortableSectionKey, ResumeSection>()
  const entryMap = new Map<
    string,
    { sectionKey: SortableSectionKey; entry: any }
  >()

  if (!resume) return { sectionMap, entryMap }

  for (const sectionKey of resume.sectionOrder) {
    const section = resume[sectionKey] as ResumeSection | undefined
    if (!section) continue

    sectionMap.set(sectionKey, section)

    for (const entry of section.entries) {
      entryMap.set(entry.entryId, { sectionKey, entry })
    }
  }

  return { sectionMap, entryMap }
})

export const resumeMetadataAtom = atom<ResumeMetadata>((get) => {
  const app = get(applicationAtom)
  if (!app) return { resumeLanguage: "en" }
  return { resumeLanguage: app.resume.language }
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
export const selectedSectionIdAtom = atom<ResumeSectionKey | null>(null)
export const selectedEntryIdAtom = atom<string | null>(null)
const selectedEntryIndexStateAtom = atom<number | null>(null)
export const selectedEntryIndexAtom = atom(
  (get) => {
    const explicitIndex = get(selectedEntryIndexStateAtom)

    if (explicitIndex !== null) {
      return explicitIndex
    }

    const selectedSectionId = get(selectedSectionIdAtom)
    const selectedEntryId = get(selectedEntryIdAtom)
    const resumeData = get(persistedResumeAtom)

    if (!selectedSectionId || !selectedEntryId || !resumeData) {
      return null
    }

    const section = resumeData[selectedSectionId]

    if (!section || !("entries" in section)) {
      return null
    }

    const entryIndex = section.entries.findIndex(
      (entry: { entryId: string }) => entry.entryId === selectedEntryId
    )

    return entryIndex >= 0 ? entryIndex : null
  },
  (_get, set, index: number | null) => {
    set(selectedEntryIndexStateAtom, index)
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
  set(selectedEntryIdAtom, null)
  set(selectedEntryIndexAtom, null)
})

export const focusSectionAtom = atom(
  null,
  (
    get,
    set,
    id: ResumeSectionKey,
    entryIndex?: number,
    entryId?: string | null
  ) => {
    const resumeData = get(persistedResumeAtom)
    set(selectedSectionIdAtom, id)
    set(selectedEntryIndexAtom, typeof entryIndex === "number" ? entryIndex : null)
    if (typeof entryIndex === "number" && resumeData) {
      const section = resumeData[id]
      if (section && "entries" in section) {
        set(
          selectedEntryIdAtom,
          entryId ?? section.entries[entryIndex]?.entryId ?? null
        )
      } else {
        set(selectedEntryIdAtom, entryId ?? null)
      }
    } else {
      set(selectedEntryIdAtom, null)
    }
  }
)

export function useResumeLanguage() {
  const [resumeMetadata] = useAtom(resumeMetadataAtom)

  return resumeMetadata.resumeLanguage
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
