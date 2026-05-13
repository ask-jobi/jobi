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
import type { SectionId } from "@/types/resume"

interface ResumeSectionFormProps {
  sectionId: SectionId | null
  blockIndex?: number | null
}

export function ResumeSectionForm({
  sectionId,
  blockIndex
}: ResumeSectionFormProps) {
  switch (sectionId) {
    case "personalInfo":
      return <PersonalInfoForm />
    case "education":
      return <EducationForm focusIndex={blockIndex} />
    case "employment":
      return <EmploymentForm focusIndex={blockIndex} />
    case "skills":
      return <SkillsForm focusIndex={blockIndex} />
    case "projects":
      return <ProjectsForm focusIndex={blockIndex} />
    case "research":
      return <ResearchForm focusIndex={blockIndex} />
    case "publications":
      return <PublicationsForm focusIndex={blockIndex} />
    case "awards":
      return <AwardsForm focusIndex={blockIndex} />
    case "certifications":
      return <CertificationsForm focusIndex={blockIndex} />
    default:
      return null
  }
}
