"use client"

import { useMemo, useState } from "react"
import { useSetAtom } from "jotai"
import { Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { editModalOpenAtom, useResumeLanguage } from "@/lib/store/resume"
import { DEFAULT_STARTER_SECTION_IDS } from "@/lib/templates/section-definitions"
import { getSectionEntryActions } from "@/lib/templates/section-entry-actions"
import { getSectionLabel } from "@/lib/templates/section-labels"
import { useResumeDraft } from "@/lib/hooks/use-resume-draft"
import { useResumeEditorState } from "@/lib/hooks/use-resume-editor-state"
import type {
  SortableSectionKey,
  ResumeData,
  ResumeSectionKey
} from "@/types/resume"

const QUICK_START_SECTIONS: ResumeSectionKey[] = [
  "personalInfo",
  "education",
  "employment",
  "skills"
]

export function isResumeCanvasEmpty(data: ResumeData | null) {
  if (!data) {
    return true
  }

  const hasPersonalInfo = [
    data.personalInfo.firstName,
    data.personalInfo.lastName,
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.website,
    data.personalInfo.linkedin
  ].some((value) => value?.trim())

  if (hasPersonalInfo) {
    return false
  }

  const hasStartedOptionalSection = data.sectionOrder.some(
    (sectionId) => !DEFAULT_STARTER_SECTION_IDS.includes(sectionId)
  )

  if (hasStartedOptionalSection) {
    return false
  }

  return data.sectionOrder.every((sectionId) => {
    const section = data[sectionId]
    return !section || section.blocks.length === 0
  })
}

export function ResumeCanvasSectionEntry() {
  const t = useTranslations("resumeCanvas")
  const uiLocale = useLocale()
  const resumeLanguage = useResumeLanguage()
  const { draft, ensureEditableSection, getDraft } = useResumeDraft()
  const setEditModalOpen = useSetAtom(editModalOpenAtom)
  const { clearRollbackResume, selectTarget, setRollbackResume } =
    useResumeEditorState()
  const [open, setOpen] = useState(false)
  const [pendingSectionId, setPendingSectionId] =
    useState<ResumeSectionKey | null>(null)

  const sectionActions = useMemo(
    () => (draft ? getSectionEntryActions(draft) : []),
    [draft]
  )

  const isEmpty = isResumeCanvasEmpty(draft)
  const emptyPopoverDescription = t.has("emptyPopoverDescription")
    ? t("emptyPopoverDescription")
    : uiLocale === "zh"
      ? "选择你想先开始填写的部分。"
      : "Choose where you want to start writing."
  const startWithLabel = t.has("startWith")
    ? t("startWith")
    : uiLocale === "zh"
      ? "从这里开始"
      : "Start With"
  const personalInfoLabel = t.has("personalInfoSection")
    ? t("personalInfoSection")
    : uiLocale === "zh"
      ? "个人信息"
      : "Personal Info"

  if (!draft) {
    return null
  }

  if (!isEmpty && sectionActions.length === 0) {
    return null
  }

  const openEditModal = (sectionId: ResumeSectionKey, blockIndex?: number) => {
    selectTarget(sectionId, blockIndex)
    setEditModalOpen(true)
  }

  const handleOpenSection = async (sectionId: ResumeSectionKey) => {
    setPendingSectionId(sectionId)

    if (sectionId === "personalInfo") {
      clearRollbackResume()
      openEditModal(sectionId)
      setOpen(false)
      setPendingSectionId(null)
      return
    }

    setRollbackResume(getDraft())
    const { blockIndex, blockId } = ensureEditableSection(sectionId)
    selectTarget(sectionId, blockIndex ?? undefined, blockId)
    setEditModalOpen(true)
    setOpen(false)
    setPendingSectionId(null)
  }

  const handleAddSection = async (sectionId: SortableSectionKey) => {
    setPendingSectionId(sectionId)

    setRollbackResume(getDraft())
    const { blockIndex, blockId } = ensureEditableSection(sectionId)
    selectTarget(sectionId, blockIndex ?? undefined, blockId)
    setEditModalOpen(true)
    setOpen(false)
    setPendingSectionId(null)
  }

  const trigger = isEmpty ? (
    <Button
      data-testid="resume-add-section-empty"
      type="button"
      size="lg"
      className="h-auto min-w-[220px] flex-col gap-3 rounded-2xl px-8 py-8 shadow-lg"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
        <Plus className="h-7 w-7" />
      </span>
      <span className="text-base font-semibold">{t("addSection")}</span>
      <span className="text-center text-sm text-primary-foreground/80">
        {t("emptyHint")}
      </span>
    </Button>
  ) : (
    <Button
      data-testid="resume-add-section-inline"
      type="button"
      variant="outline"
      size="sm"
      className="shadow-sm"
    >
      <Plus className="h-4 w-4" />
      {t("addSection")}
    </Button>
  )

  return (
    <div
      className={
        isEmpty
          ? "pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          : "pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center"
      }
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="pointer-events-auto">{trigger}</div>
        </PopoverTrigger>
        <PopoverContent
          align={isEmpty ? "center" : "end"}
          className="w-80 space-y-3"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{t("popoverTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {isEmpty ? emptyPopoverDescription : t("popoverDescription")}
            </p>
          </div>
          {isEmpty && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {startWithLabel}
              </p>
              {QUICK_START_SECTIONS.map((sectionId) => (
                <Button
                  key={sectionId}
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-between px-3 py-3"
                  disabled={pendingSectionId === sectionId}
                  onClick={() => handleOpenSection(sectionId)}
                >
                  <span>
                    {sectionId === "personalInfo"
                      ? personalInfoLabel
                      : getSectionLabel(
                          sectionId as SortableSectionKey,
                          resumeLanguage
                        )}
                  </span>
                  <Plus className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
          {!isEmpty && (
            <div className="space-y-2">
              {sectionActions.map(({ sectionId, action }) => (
                <Button
                  key={`${sectionId}-${action}`}
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-between px-3 py-3"
                  disabled={pendingSectionId === sectionId}
                  onClick={() =>
                    action === "open"
                      ? handleOpenSection(sectionId)
                      : handleAddSection(sectionId)
                  }
                >
                  <span>{getSectionLabel(sectionId, resumeLanguage)}</span>
                  <Plus className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
