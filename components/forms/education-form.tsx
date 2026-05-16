"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Editor } from "@/components/editor/editor"
import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field"
import { EducationEntry, ResumeData } from "@/types/resume"

interface EducationFormProps {
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function EducationForm({
  focusIndex = null,
  onCancel,
  onSaveComplete
}: EducationFormProps) {
  const { control, getValues } = useFormContext<ResumeData>()
  const { update } = useFieldArray({
    control,
    name: "education.entries"
  })

  if (typeof focusIndex !== "number") {
    return null
  }

  const currentEntry = getValues(`education.entries.${focusIndex}`)

  if (!currentEntry) {
    return null
  }

  return (
    <div id="form-education" className="space-y-4">
      <FocusedEntryFormShell<EducationEntry>
        entry={currentEntry}
        formId={`form-education-${focusIndex}`}
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
                  <label className="text-sm font-medium">School</label>
                  <Input {...register("school")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Degree</label>
                  <Input {...register("degree")} />
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
      </FocusedEntryFormShell>
    </div>
  )
}
