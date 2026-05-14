"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Editor } from "@/components/editor/editor"
import { FocusedBlockFormShell } from "@/components/forms/focused-block-form-shell"
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field"
import { ProjectBlock, ResumeData } from "@/types/resume"

interface ProjectsFormProps {
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function ProjectsForm({
  focusIndex = null,
  onCancel,
  onSaveComplete
}: ProjectsFormProps) {
  const { control, getValues } = useFormContext<ResumeData>()
  const { update } = useFieldArray({
    control,
    name: "projects.blocks"
  })

  if (typeof focusIndex !== "number") {
    return null
  }

  const currentBlock = getValues(`projects.blocks.${focusIndex}`)

  if (!currentBlock) {
    return null
  }

  return (
    <div id="form-projects" className="space-y-4">
      <FocusedBlockFormShell<ProjectBlock>
        block={currentBlock}
        formId={`form-projects-${focusIndex}`}
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
