"use client"

import { Input } from "@/components/ui/input"
import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import { Textarea } from "@/components/ui/textarea"
import type { AwardEntry } from "@/types/resume"

interface AwardsFormProps {
  entry: AwardEntry
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
  onSaveEntry: (values: AwardEntry) => void | Promise<void>
}

export function AwardsForm({
  entry,
  focusIndex = null,
  onCancel,
  onSaveComplete,
  onSaveEntry
}: AwardsFormProps) {
  if (typeof focusIndex !== "number") {
    return null
  }

  return (
    <div id="form-awards" className="space-y-4">
      <FocusedEntryFormShell<AwardEntry>
        entry={entry}
        formId={`form-awards-${focusIndex}`}
        onCancel={onCancel}
        onSaveComplete={onSaveComplete}
        onSave={onSaveEntry}
      >
        {({ register }) => (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Award Title</label>
                <Input {...register("title")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Issuer</label>
                <Input {...register("issuer")} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
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
