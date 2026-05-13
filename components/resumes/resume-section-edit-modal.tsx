"use client"

import { useEffect } from "react"
import { useAtom, useAtomValue } from "jotai"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  editModalOpenAtom,
  selectedBlockIdAtom,
  selectedBlockIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume"
import { ResumeSectionForm } from "@/components/resumes/resume-section-form"

export function ResumeSectionEditModal() {
  const t = useTranslations("rightPanel")
  const sectionT = useTranslations("chat.toolOutput.entity")
  const [isOpen, setIsOpen] = useAtom(editModalOpenAtom)
  const [selectedBlockId, setSelectedBlockId] = useAtom(selectedBlockIdAtom)
  const [selectedSectionId, setSelectedSectionId] =
    useAtom(selectedSectionIdAtom)
  const selectedBlockIndex = useAtomValue(selectedBlockIndexAtom)

  const selectedSectionLabel = selectedSectionId
    ? sectionT(selectedSectionId as Parameters<typeof sectionT>[0])
    : null

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)

    if (!open) {
      setSelectedSectionId(null)
      setSelectedBlockId(null)
    }
  }

  useEffect(() => {
    if (!isOpen || !selectedSectionId || !selectedBlockId) {
      return
    }

    if (selectedBlockIndex !== null) {
      return
    }

    setIsOpen(false)
    setSelectedSectionId(null)
    setSelectedBlockId(null)
  }, [
    isOpen,
    selectedBlockId,
    selectedBlockIndex,
    selectedSectionId,
    setIsOpen,
    setSelectedBlockId,
    setSelectedSectionId
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(960px,calc(100%-2rem))] max-w-none flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>{selectedSectionLabel ?? t("editSection")}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ResumeSectionForm
            sectionId={selectedSectionId}
            blockIndex={selectedBlockIndex}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
