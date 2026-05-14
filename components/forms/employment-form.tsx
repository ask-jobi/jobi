"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Editor } from "@/components/editor/editor"
import { FocusedBlockFormShell } from "@/components/forms/focused-block-form-shell"
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field"
import { EmploymentBlock, ResumeData } from "@/types/resume"

interface EmploymentFormProps {
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function EmploymentForm({
  focusIndex = null,
  onCancel,
  onSaveComplete
}: EmploymentFormProps) {
  const { control, getValues } = useFormContext<ResumeData>()
  const { update } = useFieldArray({
    control,
    name: "employment.blocks"
  })

  if (typeof focusIndex !== "number") {
    return null
  }

  const currentBlock = getValues(`employment.blocks.${focusIndex}`)

  if (!currentBlock) {
    return null
  }

  return (
    <div id="form-employment" className="space-y-4">
      <FocusedBlockFormShell<EmploymentBlock>
        block={currentBlock}
        formId={`form-employment-${focusIndex}`}
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
                  <label className="text-sm font-medium">Company</label>
                  <Input {...register("company")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input {...register("jobTitle")} />
                </div>
              </div>

              <MonthRangePickerFormField
                startName="start"
                endName="end"
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
