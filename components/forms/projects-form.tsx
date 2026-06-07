"use client"

import { Input } from "@/components/ui/input"
import { Editor } from "@/components/editor/editor"
import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field"
import type { ProjectEntry } from "@/types/resume"

interface ProjectsFormProps {
  entry: ProjectEntry
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
  onSaveEntry: (values: ProjectEntry) => void | Promise<void>
}

export function ProjectsForm({
  entry,
  focusIndex = null,
  onCancel,
  onSaveComplete,
  onSaveEntry
}: ProjectsFormProps) {
  if (typeof focusIndex !== "number") {
    return null
  }

  return (
    <div id="form-projects" className="space-y-4">
      <FocusedEntryFormShell<ProjectEntry>
        entry={entry}
        formId={`form-projects-${focusIndex}`}
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
                  <label className="text-sm font-medium">Project Title</label>
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
