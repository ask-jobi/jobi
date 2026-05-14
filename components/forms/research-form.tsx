"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Editor } from "@/components/editor/editor"
import { FocusedBlockFormShell } from "@/components/forms/focused-block-form-shell"
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field"
import { ResearchBlock, ResumeData } from "@/types/resume"

interface ResearchFormProps {
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function ResearchForm({
  focusIndex = null,
  onCancel,
  onSaveComplete
}: ResearchFormProps) {
  const { control, getValues } = useFormContext<ResumeData>()
  const { update } = useFieldArray({
    control,
    name: "research.blocks"
  })

  if (typeof focusIndex !== "number") {
    return null
  }

  const currentBlock = getValues(`research.blocks.${focusIndex}`)

  if (!currentBlock) {
    return null
  }

  return (
    <div id="form-research" className="space-y-4">
      <FocusedBlockFormShell<ResearchBlock>
        block={currentBlock}
        formId={`form-research-${focusIndex}`}
        onCancel={onCancel}
        onSaveComplete={onSaveComplete}
        onSave={(values) => update(focusIndex, values)}
      >
        {({ register, watch, setValue }) => {
          const content = watch("content") || ""

          return (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Research Title</label>
                  <Input {...register("title")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input {...register("role")} />
                </div>
              </div>

              <MonthRangePickerFormField
                startName="date.start"
                endName="date.end"
                label="Start/End Date"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <div className="h-[320px]">
                  <Editor
                    markdown={content}
                    onChange={(markdown) => {
                      setValue("content", markdown, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true
                      })
                    }}
                  />
                </div>
              </div>
            </>
          )
        }}
      </FocusedBlockFormShell>
    </div>
  )
}
