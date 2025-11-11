import {atom, useAtom, useSetAtom} from 'jotai';
import {ResumeData, JobApplication, ResumeMetadata} from '@/types/resume';
import type { ResumeEvaluationOutput } from "@/lib/evaluation/types";

export const resumeDataAtom = atom<ResumeData | null>(null);
export const resumeMetadataAtom = atom<ResumeMetadata>({language: 'en'});
export const applicationAtom = atom<JobApplication | null>(null);
export const isLoadingAtom = atom(false);
export const selectedSectionIdAtom = atom<string | null>(null);
export const rightPanelViewAtom = atom<'form' | 'evaluation'>('evaluation');
export const isRightPanelCollapsedAtom = atom(false);
export const resumeEvaluationAtom = atom<ResumeEvaluationOutput | null>(null);

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
