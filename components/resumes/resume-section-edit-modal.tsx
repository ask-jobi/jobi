"use client"

import { useCallback, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { useAtom, useAtomValue } from "jotai"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { ResumeSectionForm } from "@/components/resumes/resume-section-form"
import type { ResumeData } from "@/types/resume"
import {
  editModalOpenAtom,
  editModalRollbackResumeAtom,
  selectedBlockIdAtom,
  selectedBlockIndexAtom,
  selectedSectionIdAtom,
  useResume
} from "@/lib/store/resume"

export function ResumeSectionEditModal() {
  const t = useTranslations("rightPanel")
  const sectionT = useTranslations("chat.toolOutput.entity")
  const { getValues, reset } = useFormContext<ResumeData>()
  const { updateResumeDataWithSave } = useResume()
  const [isOpen, setIsOpen] = useAtom(editModalOpenAtom)
  const [rollbackResume, setRollbackResume] = useAtom(
    editModalRollbackResumeAtom
  )
  const [selectedBlockId, setSelectedBlockId] = useAtom(selectedBlockIdAtom)
  const [selectedSectionId, setSelectedSectionId] = useAtom(
    selectedSectionIdAtom
  )
  const selectedBlockIndex = useAtomValue(selectedBlockIndexAtom)

  const selectedSectionLabel = selectedSectionId
    ? sectionT(selectedSectionId as Parameters<typeof sectionT>[0])
    : null

  const clearSelection = useCallback(() => {
    setIsOpen(false)
    setSelectedSectionId(null)
    setSelectedBlockId(null)
  }, [setIsOpen, setSelectedBlockId, setSelectedSectionId])

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      setIsOpen(true)
      return
    }

    if (rollbackResume) {
      reset(rollbackResume)
      await updateResumeDataWithSave(rollbackResume)
    }

    setRollbackResume(null)
    clearSelection()
  }

  const handleSaveComplete = () => {
    const nextResume = getValues()
    setRollbackResume(null)
    clearSelection()
    void updateResumeDataWithSave(nextResume)
  }

  useEffect(() => {
    if (!isOpen || !selectedSectionId || !selectedBlockId) {
      return
    }

    if (selectedBlockIndex !== null) {
      return
    }

    setRollbackResume(null)
    clearSelection()
  }, [
    clearSelection,
    isOpen,
    selectedBlockId,
    selectedBlockIndex,
    selectedSectionId,
    setRollbackResume
  ])

  useEffect(() => {
    if (!isOpen || !selectedSectionId) {
      return
    }

    const targetId =
      typeof selectedBlockIndex === "number"
        ? `form-${selectedSectionId}-${selectedBlockIndex}`
        : `form-${selectedSectionId}`

    const timer = window.setTimeout(() => {
      const formElement = document.getElementById(targetId)
      formElement?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isOpen, selectedBlockIndex, selectedSectionId])

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
