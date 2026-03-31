"use client"

import { useMemo, useState } from "react"
import { useFormContext } from "react-hook-form"
import { useSetAtom } from "jotai"
import { Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  isRightPanelCollapsedAtom,
  rightPanelViewAtom,
  selectedSectionIdAtom,
  useResume,
  useResumeLanguage
} from "@/lib/store/resume"
import {
  OPTIONAL_SECTION_IDS,
  REQUIRED_SECTION_IDS
} from "@/lib/templates/section-definitions"
import { addSection } from "@/lib/templates/section-helpers"
import { getSectionLabel } from "@/lib/templates/section-labels"
import type { ResumeData, SectionId, SortableSectionId } from "@/types/resume"

type OptionalSectionAction = {
  sectionId: SortableSectionId
  action: "add" | "open"
}

const QUICK_START_SECTIONS: SectionId[] = [
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
    (sectionId) => !REQUIRED_SECTION_IDS.includes(sectionId)
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
  const locale = useLocale()
  const { getValues, reset } = useFormContext<ResumeData>()
  const { resumeData, updateResumeDataWithSave } = useResume()
  const resumeLanguage = useResumeLanguage()
  const setRightPanelView = useSetAtom(rightPanelViewAtom)
  const setIsRightPanelCollapsed = useSetAtom(isRightPanelCollapsedAtom)
  const setSelectedSectionId = useSetAtom(selectedSectionIdAtom)
  const [open, setOpen] = useState(false)
  const [pendingSectionId, setPendingSectionId] = useState<SectionId | null>(
    null
  )

  const optionalSectionActions = useMemo(
    (): OptionalSectionAction[] =>
      OPTIONAL_SECTION_IDS.flatMap((sectionId): OptionalSectionAction[] => {
        const currentResume = resumeData ?? getValues()
        const section = currentResume[sectionId]
        const isInOrder = currentResume.sectionOrder.includes(sectionId)

        if (!section || !isInOrder) {
          return [{ sectionId, action: "add" as const }]
        }

        if (section.blocks.length === 0) {
          return [{ sectionId, action: "open" as const }]
        }

        return []
      }),
    [getValues, resumeData]
  )

  const isEmpty = isResumeCanvasEmpty(resumeData)
  const emptyPopoverDescription = t.has("emptyPopoverDescription")
    ? t("emptyPopoverDescription")
    : locale === "zh"
      ? "选择你想先开始填写的部分。"
      : "Choose where you want to start writing."
  const startWithLabel = t.has("startWith")
    ? t("startWith")
    : locale === "zh"
      ? "从这里开始"
      : "Start With"
  const personalInfoLabel = t.has("personalInfoSection")
    ? t("personalInfoSection")
    : locale === "zh"
      ? "个人信息"
      : "Personal Info"

  if (!resumeData) {
    return null
  }

  if (!isEmpty && optionalSectionActions.length === 0) {
    return null
  }

  const openFormPanel = () => {
    setRightPanelView("form")
    setIsRightPanelCollapsed(false)
  }

  const handleOpenSection = async (sectionId: SectionId) => {
    setPendingSectionId(sectionId)

    if (sectionId !== "personalInfo" && !resumeData[sectionId]) {
      const nextResume = addSection(getValues(), sectionId, resumeLanguage)
      reset(nextResume)
      await updateResumeDataWithSave(nextResume)
    }

    setSelectedSectionId(sectionId)
    openFormPanel()
    setOpen(false)
    setPendingSectionId(null)
  }

  const handleAddSection = async (sectionId: SortableSectionId) => {
    setPendingSectionId(sectionId)
    const nextResume = addSection(getValues(), sectionId, resumeLanguage)
    reset(nextResume)
    await updateResumeDataWithSave(nextResume)
    setSelectedSectionId(sectionId)
    openFormPanel()
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
                          sectionId as SortableSectionId,
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
              {optionalSectionActions.map(({ sectionId, action }) => (
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
