"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import { CertificationEntry, ResumeData } from "@/types/resume"

interface CertificationsFormProps {
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function CertificationsForm({
  focusIndex = null,
  onCancel,
  onSaveComplete
}: CertificationsFormProps) {
  const { control, getValues } = useFormContext<ResumeData>()
  const { update } = useFieldArray({
    control,
    name: "certifications.entries"
  })

  if (typeof focusIndex !== "number") {
    return null
  }

  const currentEntry = getValues(`certifications.entries.${focusIndex}`)

  if (!currentEntry) {
    return null
  }

  return (
    <div id="form-certifications" className="space-y-4">
      <FocusedEntryFormShell<CertificationEntry>
        entry={currentEntry}
        formId={`form-certifications-${focusIndex}`}
        onCancel={onCancel}
        onSaveComplete={onSaveComplete}
        onSave={(values) => update(focusIndex, values)}
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
