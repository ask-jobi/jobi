"use client"

import { PersonalInfoForm } from "@/components/forms/personal-info-form"
import { EducationForm } from "@/components/forms/education-form"
import { EmploymentForm } from "@/components/forms/employment-form"
import { SkillsForm } from "@/components/forms/skills-form"
import { ProjectsForm } from "@/components/forms/projects-form"
import { ResearchForm } from "@/components/forms/research-form"
import { PublicationsForm } from "@/components/forms/publications-form"
import { AwardsForm } from "@/components/forms/awards-form"
import { CertificationsForm } from "@/components/forms/certifications-form"
import type {
  AwardEntry,
  CertificationEntry,
  EducationEntry,
  EmploymentEntry,
  PersonalInfo,
  ProjectEntry,
  PublicationEntry,
  ResearchEntry,
  ResumeSectionKey,
  SkillEntry
} from "@/types/resume"

export type ResumeSectionFormValue =
  | PersonalInfo
  | EducationEntry
  | EmploymentEntry
  | SkillEntry
  | ProjectEntry
  | ResearchEntry
  | PublicationEntry
  | AwardEntry
  | CertificationEntry

interface ResumeSectionFormProps {
  sectionId: ResumeSectionKey | null
  entry: ResumeSectionFormValue | null
  entryIndex?: number | null
  onCancel: () => void
  onSaveEntry: (value: ResumeSectionFormValue) => void | Promise<void>
}

export function ResumeSectionForm({
  sectionId,
  entry,
  entryIndex,
  onCancel,
  onSaveEntry
}: ResumeSectionFormProps) {
  switch (sectionId) {
    case "personalInfo":
      return (
        <PersonalInfoForm
          entry={entry as PersonalInfo}
          onCancel={onCancel}
          onSaveEntry={(value) => onSaveEntry(value)}
        />
      )
    case "education":
      return (
        <EducationForm
          entry={entry as EducationEntry}
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveEntry={(value) => onSaveEntry(value)}
        />
      )
    case "employment":
      return (
        <EmploymentForm
          entry={entry as EmploymentEntry}
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveEntry={(value) => onSaveEntry(value)}
        />
      )
    case "skills":
      return (
        <SkillsForm
          entry={entry as SkillEntry}
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveEntry={(value) => onSaveEntry(value)}
        />
      )
    case "projects":
      return (
        <ProjectsForm
          entry={entry as ProjectEntry}
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveEntry={(value) => onSaveEntry(value)}
        />
      )
    case "research":
      return (
        <ResearchForm
          entry={entry as ResearchEntry}
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveEntry={(value) => onSaveEntry(value)}
        />
      )
    case "publications":
      return (
        <PublicationsForm
          entry={entry as PublicationEntry}
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveEntry={(value) => onSaveEntry(value)}
        />
      )
    case "awards":
      return (
        <AwardsForm
          entry={entry as AwardEntry}
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveEntry={(value) => onSaveEntry(value)}
        />
      )
    case "certifications":
      return (
        <CertificationsForm
          entry={entry as CertificationEntry}
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveEntry={(value) => onSaveEntry(value)}
        />
      )
    default:
      return null
  }
}
