"use client"

import { useCallback, useEffect, useMemo } from "react"
import { useAtom } from "jotai"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  ResumeSectionForm,
  type ResumeSectionFormValue
} from "@/components/resumes/resume-section-form"
import { useResumeEditorState } from "@/lib/hooks/use-resume-editor-state"
import {
  editModalOpenAtom,
  useApplicationResume,
  useResumeLanguage
} from "@/lib/store/resume"
import {
  insertSectionEntryInResume,
  replacePersonalInfoInResume,
  replaceSectionEntryInResume
} from "@/lib/resume/mutations"
import { createEmptySectionEntry } from "@/lib/templates/section-factories"
import { normalizeDateEnd } from "@/lib/resume/date-ranges"

export function ResumeSectionEditModal() {
  const t = useTranslations("rightPanel")
  const sectionT = useTranslations("chat.toolOutput.entity")
  const { applicationResumeData, saveApplicationResume } =
    useApplicationResume()
  const resumeLanguage = useResumeLanguage()
  const [isOpen, setIsOpen] = useAtom(editModalOpenAtom)
  const {
    selectedEntryId,
    selectedEntryIndex,
    selectedSectionId,
    clearSelection
  } = useResumeEditorState()

  const selectedSectionLabel = selectedSectionId
    ? sectionT(selectedSectionId as Parameters<typeof sectionT>[0])
    : null

  const isCreatingEntry =
    selectedSectionId !== null &&
    selectedSectionId !== "personalInfo" &&
    selectedEntryId === null &&
    selectedEntryIndex !== null

  const initialFormValue = useMemo<ResumeSectionFormValue | null>(() => {
    if (!applicationResumeData || !selectedSectionId) {
      return null
    }

    if (selectedSectionId === "personalInfo") {
      return applicationResumeData.personalInfo
    }

    if (isCreatingEntry) {
      return createEmptySectionEntry(selectedSectionId)
    }

    if (selectedEntryIndex === null) {
      return null
    }

    const entry =
      applicationResumeData[selectedSectionId]?.entries[selectedEntryIndex] ??
      null

    return entry &&
      ["education", "employment", "projects", "research"].includes(
        selectedSectionId
      )
      ? { ...entry, end: normalizeDateEnd((entry as { end?: string }).end) }
      : entry
  }, [
    applicationResumeData,
    isCreatingEntry,
    selectedEntryIndex,
    selectedSectionId
  ])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const dismissEditor = useCallback(() => {
    clearSelection()
    closeModal()
  }, [clearSelection, closeModal])

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      setIsOpen(true)
      return
    }

    dismissEditor()
  }

  const handleSaveEntry = async (value: ResumeSectionFormValue) => {
    if (!applicationResumeData || !selectedSectionId) {
      return
    }

    let nextResume = applicationResumeData

    if (selectedSectionId === "personalInfo") {
      nextResume = replacePersonalInfoInResume(
        applicationResumeData,
        value as ResumeSectionFormValue &
          typeof applicationResumeData.personalInfo
      )
    } else if (selectedEntryIndex !== null) {
      nextResume = isCreatingEntry
        ? insertSectionEntryInResume(
            applicationResumeData,
            selectedSectionId,
            selectedEntryIndex,
            value as never,
            resumeLanguage
          )
        : replaceSectionEntryInResume(
            applicationResumeData,
            selectedSectionId,
            selectedEntryIndex,
            value as never
          )
    }

    const didSave = await saveApplicationResume(nextResume)

    if (didSave) {
      dismissEditor()
    }
  }

  useEffect(() => {
    if (!isOpen || !selectedSectionId) {
      return
    }

    if (selectedSectionId === "personalInfo") {
      return
    }

    if (selectedEntryIndex === null || !initialFormValue) {
      dismissEditor()
    }
  }, [
    dismissEditor,
    initialFormValue,
    isOpen,
    selectedEntryIndex,
    selectedSectionId
  ])

  if (!selectedSectionId || !initialFormValue) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => void handleOpenChange(open)}>
      <DialogContent className="flex max-h-[90vh] w-[min(960px,calc(100%-2rem))] max-w-none sm:max-w-none flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>{selectedSectionLabel ?? t("editSection")}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ResumeSectionForm
            sectionId={selectedSectionId}
            entry={initialFormValue}
            entryIndex={selectedEntryIndex}
            onCancel={() => void handleOpenChange(false)}
            onSaveEntry={(value) => void handleSaveEntry(value)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
