"use client"

import { Input } from "@/components/ui/input"
import { Editor } from "@/components/editor/editor"
import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field"
import type { EmploymentEntry } from "@/types/resume"

interface EmploymentFormProps {
  entry: EmploymentEntry
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
  onSaveEntry: (values: EmploymentEntry) => void | Promise<void>
}

export function EmploymentForm({
  entry,
  focusIndex = null,
  onCancel,
  onSaveComplete,
  onSaveEntry
}: EmploymentFormProps) {
  if (typeof focusIndex !== "number") {
    return null
  }

  return (
    <div id="form-employment" className="space-y-4">
      <FocusedEntryFormShell<EmploymentEntry>
        entry={entry}
        formId={`form-employment-${focusIndex}`}
        onCancel={onCancel}
        onSaveComplete={onSaveComplete}
        onSave={onSaveEntry}
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
      </FocusedEntryFormShell>
    </div>
  )
}
