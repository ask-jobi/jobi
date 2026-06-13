"use client"

import { FocusedEntryFormShell } from "@/components/forms/focused-entry-form-shell"
import { Input } from "@/components/ui/input"
import type { PersonalInfo } from "@/types/resume"

interface PersonalInfoFormProps {
  entry: PersonalInfo
  onCancel?: () => void
  onSaveComplete?: () => void
  onSaveEntry: (values: PersonalInfo) => void | Promise<void>
}

export function PersonalInfoForm({
  entry,
  onCancel,
  onSaveComplete,
  onSaveEntry
}: PersonalInfoFormProps) {
  return (
    <FocusedEntryFormShell
      entry={entry}
      formId="form-personalInfo"
      onCancel={onCancel}
      onSaveComplete={onSaveComplete}
      onSave={onSaveEntry}
    >
      {({ register }) => (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input {...register("firstName")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input {...register("lastName")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input {...register("email")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input {...register("phone")} />
          </div>
        </>
      )}
    </FocusedEntryFormShell>
  )
}
