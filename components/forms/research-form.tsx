"use client"

import { Input } from "@/components/ui/input"
import { Editor } from "@/components/editor/editor"
import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field"
import type { ResearchEntry } from "@/types/resume"

interface ResearchFormProps {
  entry: ResearchEntry
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
  onSaveEntry: (values: ResearchEntry) => void | Promise<void>
}

export function ResearchForm({
  entry,
  focusIndex = null,
  onCancel,
  onSaveComplete,
  onSaveEntry
}: ResearchFormProps) {
  if (typeof focusIndex !== "number") {
    return null
  }

  return (
    <div id="form-research" className="space-y-4">
      <FocusedEntryFormShell<ResearchEntry>
        entry={entry}
        formId={`form-research-${focusIndex}`}
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
                isCurrentName="date.isCurrent"
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
