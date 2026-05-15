"use client"

import { useCallback, useEffect } from "react"
import { useAtom } from "jotai"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { ResumeSectionForm } from "@/components/resumes/resume-section-form"
import { useResumeDraft } from "@/lib/hooks/use-resume-draft"
import { useResumeEditorState } from "@/lib/hooks/use-resume-editor-state"
import { editModalOpenAtom } from "@/lib/store/resume"

export function ResumeSectionEditModal() {
  const t = useTranslations("rightPanel")
  const sectionT = useTranslations("chat.toolOutput.entity")
  const { getDraft, commitDraft, resetDraft } = useResumeDraft()
  const [isOpen, setIsOpen] = useAtom(editModalOpenAtom)
  const {
    selectedBlockId,
    selectedBlockIndex,
    selectedSectionId,
    rollbackResume,
    clearSelection,
    clearRollbackResume
  } = useResumeEditorState()

  const selectedSectionLabel = selectedSectionId
    ? sectionT(selectedSectionId as Parameters<typeof sectionT>[0])
    : null

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const dismissEditor = useCallback(() => {
    clearRollbackResume()
    clearSelection()
    closeModal()
  }, [clearRollbackResume, clearSelection, closeModal])

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      setIsOpen(true)
      return
    }

    if (rollbackResume) {
      resetDraft(rollbackResume)
    }

    dismissEditor()
  }

  const handleSaveComplete = () => {
    const nextResume = getDraft()
    dismissEditor()
    void commitDraft(nextResume)
  }

  useEffect(() => {
    if (!isOpen || !selectedSectionId || !selectedBlockId) {
      return
    }

    if (selectedBlockIndex !== null) {
      return
    }

    dismissEditor()
  }, [
    dismissEditor,
    isOpen,
    selectedBlockId,
    selectedBlockIndex,
    selectedSectionId
  ])

  if (!selectedSectionId || (selectedBlockId && selectedBlockIndex === null)) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => void handleOpenChange(open)}>
      <DialogContent className="flex max-h-[90vh] w-[min(960px,calc(100%-2rem))] max-w-none flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>{selectedSectionLabel ?? t("editSection")}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ResumeSectionForm
            sectionId={selectedSectionId}
            blockIndex={selectedBlockIndex}
            onCancel={() => void handleOpenChange(false)}
            onSaveComplete={handleSaveComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
