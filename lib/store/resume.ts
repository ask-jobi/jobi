import {atom, useAtom, useSetAtom} from 'jotai';
import {ResumeData, JobApplication, ResumeMetadata, ResumeJobDescription} from '@/types/resume';
import type { ResumeEvaluationOutput } from "@/lib/evaluation/types";

export const applicationAtom = atom<JobApplication | null>(null);
export const resumeDataAtom = atom(
  (get) => {
    const app = get(applicationAtom)
    return app ? app.resume.resume_json : {
      personalInfo: {
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
      },
      education: {
        title: "Education",
        order: 0,
        blocks: []
      },
      employment: {
        title: "Employment",
        order: 1,
        blocks: []
      },
      skills: {
        title: "Skills",
        order: 2,
        blocks: []
      }
    }
  },
  (get, set, update: ResumeData) => {
    const app = get(applicationAtom);
    if (!app) return;
    set(applicationAtom, {
      ...app,
      resume: {
        ...app.resume,
        resume_json: update,
      },
    })
  });
export const resumeMetadataAtom = atom<ResumeMetadata>(
  (get) => {
    const app = get(applicationAtom)
    if (!app) return {language: 'en'}
    return {language: app.resume.language}
  }
);
export const jobAtom = atom(
  (get) => {
    const app = get(applicationAtom)
    return app ? app.job : null
  },
  (get, set, update: Partial<ResumeJobDescription>) => {
    const app = get(applicationAtom);
    if (!app) return;
    set(applicationAtom, {
      ...app,
      job: {
        ...app.job,
        ...update,
      },
    })
  })
export const resumeEvaluationAtom = atom(
  (get) => {
    const app = get(applicationAtom)
    if (!app) return null
    return app.resume.evaluation_report
  },
  (get, set, update: ResumeEvaluationOutput) => {
    const app = get(applicationAtom);
    if (!app) return;
    set(applicationAtom, {
      ...app,
      resume: {
        ...app.resume,
        evaluation_report: update,
      },
    })
  }
);


export const isLoadingAtom = atom(false);
export const selectedSectionIdAtom = atom<string | null>(null);
export const rightPanelViewAtom = atom<'form' | 'evaluation'>('evaluation');
export const isRightPanelCollapsedAtom = atom(false);

export const openRightPanelAtom = atom(null, (get, set, view: 'form' | 'evaluation' = 'form') => {
  set(rightPanelViewAtom, view);
  set(isRightPanelCollapsedAtom, false)
})

export const focusSectionAtom = atom(null, (get, set, id: string, index?: number) => {
  set(selectedSectionIdAtom, id);
  let sectionId = `section-${id}`
  const formSectionId = `form-${id}-${index}`
  if (index && index > 0) {
    sectionId = `section-${id}-${index}`
  }
  const sectionElement = document.getElementById(sectionId);
  if (sectionElement) {
    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  setTimeout(() => {
    const formElement = document.getElementById(formSectionId);
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  })
})

export function useResumeLanguage() {
  const [resumeMetadata] = useAtom(resumeMetadataAtom);

  return resumeMetadata.language
}

export function useResume() {
  const [resumeData, setResumeData] = useAtom(resumeDataAtom);
  const [application] = useAtom(applicationAtom);
  const [isLoading, setLoading] = useAtom(isLoadingAtom);
  const [selectedSectionId] = useAtom(selectedSectionIdAtom);
  const [resumeEvaluation, setResumeEvaluation] = useAtom(resumeEvaluationAtom);
  const handleSectionClick = useSetAtom(focusSectionAtom)

  const updateResumeData = (data: ResumeData) => setResumeData(data);

  return {
    resumeData: resumeData as ResumeData,
    application: application as JobApplication,
    isLoading,
    setLoading,
    updateResumeData,
    selectedSectionId,
    handleSectionClick,
    resumeEvaluation,
    setResumeEvaluation,
  };
}
