import {atom, useAtom, useSetAtom} from 'jotai';
import {ResumeData, JobApplication, ResumeMetadata} from '@/types/resume';

export const resumeDataAtom = atom<ResumeData | null>(null);
export const resumeMetadataAtom = atom<ResumeMetadata>({language: 'en'});
export const applicationAtom = atom<JobApplication | null>(null);
export const isLoadingAtom = atom(false);
export const selectedSectionIdAtom = atom<string | null>(null);

export const focusSectionAtom = atom(null, (get, set, id: string, index?: number) => {
  set(selectedSectionIdAtom, id);
  let sectionId = `section-${id}`
  if (index) {
    sectionId = `${id}-${index}`
  }
  const sectionElement = document.getElementById(sectionId);
  if (sectionElement) {
    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setTimeout(() => {
    const formElement = document.getElementById(`form-${id}-${index}`);
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
  };
}
