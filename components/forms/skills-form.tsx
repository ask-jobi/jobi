"use client"

import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import { InputTags } from "@/components/ui/input-tags"
import type { SkillEntry } from "@/types/resume"

interface SkillsFormProps {
  entry: SkillEntry
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
  onSaveEntry: (values: SkillEntry) => void | Promise<void>
}

export function SkillsForm({
  entry,
  focusIndex = null,
  onCancel,
  onSaveComplete,
  onSaveEntry
}: SkillsFormProps) {
  if (typeof focusIndex !== "number") {
    return null
  }

  return (
    <div id="form-skills" className="space-y-4">
      <FocusedEntryFormShell<SkillEntry>
        entry={entry}
        formId={`form-skills-${focusIndex}`}
        onCancel={onCancel}
        onSaveComplete={onSaveComplete}
        onSave={onSaveEntry}
      >
        {({ register, control, setValue }) => (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Group</label>
              <Input {...register("group")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Skills</label>
              <Controller
                control={control}
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
      </FocusedEntryFormShell>
    </div>
  )
}
