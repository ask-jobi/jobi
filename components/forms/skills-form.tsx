"use client"

import { Controller, useFieldArray, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { FocusedBlockFormShell } from "@/components/forms/focused-block-form-shell"
import { InputTags } from "@/components/ui/input-tags"
import { ResumeData, SkillBlock } from "@/types/resume"

interface SkillsFormProps {
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function SkillsForm({
  focusIndex = null,
  onCancel,
  onSaveComplete
}: SkillsFormProps) {
  const { control, getValues } = useFormContext<ResumeData>()
  const { update } = useFieldArray({
    control,
    name: "skills.blocks"
  })

  if (typeof focusIndex !== "number") {
    return null
  }

  const currentBlock = getValues(`skills.blocks.${focusIndex}`)

  if (!currentBlock) {
    return null
  }

  return (
    <div id="form-skills" className="space-y-4">
      <FocusedBlockFormShell<SkillBlock>
        block={currentBlock}
        formId={`form-skills-${focusIndex}`}
        onCancel={onCancel}
        onSaveComplete={onSaveComplete}
        onSave={(values) => update(focusIndex, values)}
      >
        {({ register, control: blockControl, setValue }) => (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Group</label>
              <Input {...register("group")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Skills</label>
              <Controller
                control={blockControl}
                name="content"
                render={({ field }) => (
                  <InputTags
                    {...field}
                    onChange={(value) => {
                      setValue("content", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true
                      })
                    }}
                    placeholder="Input skill and press Enter or comma to add"
                  />
                )}
              />
            </div>
          </>
        )}
      </FocusedBlockFormShell>
    </div>
  )
}
