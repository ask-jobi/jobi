"use client"

import { Input } from "@/components/ui/input"
import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import type { CertificationEntry } from "@/types/resume"

interface CertificationsFormProps {
  entry: CertificationEntry
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
  onSaveEntry: (values: CertificationEntry) => void | Promise<void>
}

export function CertificationsForm({
  entry,
  focusIndex = null,
  onCancel,
  onSaveComplete,
  onSaveEntry
}: CertificationsFormProps) {
  if (typeof focusIndex !== "number") {
    return null
  }

  return (
    <div id="form-certifications" className="space-y-4">
      <FocusedEntryFormShell<CertificationEntry>
        entry={entry}
        formId={`form-certifications-${focusIndex}`}
        onCancel={onCancel}
        onSaveComplete={onSaveComplete}
        onSave={onSaveEntry}
      >
        {({ register }) => (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Certification Name</label>
              <Input {...register("name")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Issuer</label>
                <Input {...register("issuer")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input {...register("date")} />
              </div>
            </div>
          </>
        )}
      </FocusedEntryFormShell>
    </div>
  )
}
