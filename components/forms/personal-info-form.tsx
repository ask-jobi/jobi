"use client"

import { useFormContext } from "react-hook-form"
import { FocusedBlockFormShell } from "@/components/forms/focused-block-form-shell"
import { Input } from "@/components/ui/input"
import { PersonalInfo, ResumeData } from "@/types/resume"

interface PersonalInfoFormProps {
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function PersonalInfoForm({
  onCancel,
  onSaveComplete
}: PersonalInfoFormProps) {
  const { getValues, setValue } = useFormContext<ResumeData>()
  const personalInfo = getValues("personalInfo") as PersonalInfo

  return (
    <FocusedBlockFormShell
      block={personalInfo}
      formId="form-personalInfo"
      onCancel={onCancel}
      onSaveComplete={onSaveComplete}
      onSave={(values) => {
        setValue("personalInfo", values, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        })
      }}
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
    </FocusedBlockFormShell>
  )
}
