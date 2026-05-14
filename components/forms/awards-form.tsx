"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { FocusedBlockFormShell } from "@/components/forms/focused-block-form-shell"
import { Textarea } from "@/components/ui/textarea"
import { AwardBlock, ResumeData } from "@/types/resume"

interface AwardsFormProps {
  focusIndex?: number | null
  onCancel?: () => void
  onSaveComplete?: () => void
}

export function AwardsForm({
  focusIndex = null,
  onCancel,
  onSaveComplete
}: AwardsFormProps) {
  const { control, getValues } = useFormContext<ResumeData>()
  const { update } = useFieldArray({
    control,
    name: "awards.blocks"
  })

  if (typeof focusIndex !== "number") {
    return null
  }

  const currentBlock = getValues(`awards.blocks.${focusIndex}`)

  if (!currentBlock) {
    return null
  }

  return (
    <div id="form-awards" className="space-y-4">
      <FocusedBlockFormShell<AwardBlock>
        block={currentBlock}
        formId={`form-awards-${focusIndex}`}
        onCancel={onCancel}
        onSaveComplete={onSaveComplete}
        onSave={(values) => update(focusIndex, values)}
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
      </FocusedBlockFormShell>
    </div>
  )
}
