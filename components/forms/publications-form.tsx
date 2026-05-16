"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import { Textarea } from "@/components/ui/textarea"
import { PublicationEntry, ResumeData } from "@/types/resume"

interface PublicationsFormProps {
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function PublicationsForm({
  focusIndex = null,
  onCancel,
  onSaveComplete
}: PublicationsFormProps) {
  const { control, getValues } = useFormContext<ResumeData>()
  const { update } = useFieldArray({
    control,
    name: "publications.entries"
  })

  if (typeof focusIndex !== "number") {
    return null
  }

  const currentEntry = getValues(`publications.entries.${focusIndex}`)

  if (!currentEntry) {
    return null
  }

  return (
    <div id="form-publications" className="space-y-4">
      <FocusedEntryFormShell<PublicationEntry>
        entry={currentEntry}
        formId={`form-publications-${focusIndex}`}
        onCancel={onCancel}
        onSaveComplete={onSaveComplete}
        onSave={(values) => update(focusIndex, values)}
      >
        {({ register }) => (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Publication Title</label>
              <Input {...register("title")} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Published Date</label>
              <Input {...register("date")} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea rows={4} {...register("description")} />
            </div>
          </>
        )}
      </FocusedEntryFormShell>
    </div>
  )
}
