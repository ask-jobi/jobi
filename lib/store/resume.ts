import { atom, useAtom } from "jotai"
import {
  ResumeData,
  AuthoritativeResumeState,
  JobApplication,
  ResumeMetadata,
  ResumeJobDescription
} from "@/types/resume"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import { toast } from "sonner"
import { saveApplicationResumeChange } from "@/server/resume"
import { notifyTokenBalanceUpdated } from "@/lib/token-balance-events"

export const applicationAtom = atom<JobApplication | null>(null)
export const applicationResumeDataAtom = atom(
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
export const rightPanelViewAtom = atom<"evaluation" | "chat">("evaluation")

/** Modal open state — consumed by UI adapter (ResumeSectionEditModal) and workflow hook. */
export const editModalOpenAtom = atom(false)

export function useResumeLanguage() {
  const [resumeMetadata] = useAtom(resumeMetadataAtom)

  return resumeMetadata.resumeLanguage
}

export function useApplicationResume() {
  const [persistedResume, setPersistedResume] = useAtom(
    applicationResumeDataAtom
  )
  const [application, setApplication] = useAtom(applicationAtom)
  const [jobDescription, setJobDescription] = useAtom(jobAtom)
  const [isLoading, setLoading] = useAtom(isLoadingAtom)
  const [resumeEvaluation, setResumeEvaluation] = useAtom(resumeEvaluationAtom)
  const [evaluationRefreshFlag, setEvaluationRefreshFlag] = useAtom(
    evaluationRefreshFlagAtom
  )

  const replacePersistedResume = (data: ResumeData) => setPersistedResume(data)
  const replaceAuthoritativeResume = ({
    resume,
    currentRevision
  }: AuthoritativeResumeState) => {
    if (!application) return

    setApplication({
      ...application,
      resume: {
        ...application.resume,
        resume_json: resume,
        current_revision: currentRevision,
        evaluation_report_refresh_flag: true
      }
    })
  }

  const saveApplicationResume = async (data: ResumeData) => {
    if (!application?.resume.id) return false
    try {
      const authoritativeState = await saveApplicationResumeChange(
        application.resume.id,
        data
      )
      replaceAuthoritativeResume(authoritativeState)
      return true
    } catch (error) {
      console.error("Save failed:", error)
      toast.error("Failed to save resume changes")
      return false
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
    applicationResumeData: persistedResume,
    application: application as JobApplication,
    isLoading,
    setLoading,
    replacePersistedResume,
    replaceAuthoritativeResume,
    saveApplicationResume,
    resumeEvaluation,
    setResumeEvaluation,
    jobDescription,
    setJobDescription,
    evaluationRefreshFlag,
    setEvaluationRefreshFlag,
    refreshEvaluationReport
  }
}
