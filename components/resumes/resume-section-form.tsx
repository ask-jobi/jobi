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
import type { ResumeSectionKey } from "@/types/resume"

interface ResumeSectionFormProps {
  sectionId: ResumeSectionKey | null
  entryIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function ResumeSectionForm({
  sectionId,
  entryIndex,
  onCancel,
  onSaveComplete
}: ResumeSectionFormProps) {
  switch (sectionId) {
    case "personalInfo":
      return (
        <PersonalInfoForm onCancel={onCancel} onSaveComplete={onSaveComplete} />
      )
    case "education":
      return (
        <EducationForm
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveComplete={onSaveComplete}
        />
      )
    case "employment":
      return (
        <EmploymentForm
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveComplete={onSaveComplete}
        />
      )
    case "skills":
      return (
        <SkillsForm
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveComplete={onSaveComplete}
        />
      )
    case "projects":
      return (
        <ProjectsForm
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveComplete={onSaveComplete}
        />
      )
    case "research":
      return (
        <ResearchForm
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveComplete={onSaveComplete}
        />
      )
    case "publications":
      return (
        <PublicationsForm
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveComplete={onSaveComplete}
        />
      )
    case "awards":
      return (
        <AwardsForm
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveComplete={onSaveComplete}
        />
      )
    case "certifications":
      return (
        <CertificationsForm
          focusIndex={entryIndex}
          onCancel={onCancel}
          onSaveComplete={onSaveComplete}
        />
      )
    default:
      return null
  }
}
