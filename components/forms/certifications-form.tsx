"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { nanoid } from "nanoid"
import { Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResumeData } from "@/types/resume"

interface CertificationsFormProps {
  focusIndex?: number | null
}

export function CertificationsForm({
  focusIndex = null
}: CertificationsFormProps) {
  const { control, register } = useFormContext<ResumeData>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "certifications.blocks"
  })

  const handleAddBlock = () => {
    append({
      blockId: nanoid(),
      name: "",
      issuer: "",
      date: ""
    })
  }

  const visibleFields =
    typeof focusIndex === "number"
      ? fields
          .map((field, blockIndex) => ({ field, blockIndex }))
          .filter(({ blockIndex }) => blockIndex === focusIndex)
      : fields.map((field, blockIndex) => ({ field, blockIndex }))

  return (
    <div
      id="form-certifications"
      className={focusIndex === null ? "space-y-4 pb-[70vh]" : "space-y-4"}
    >
      {visibleFields.map(({ field, blockIndex }) => (
        <div
          id={`form-certifications-${blockIndex}`}
          key={field.id}
          className="relative space-y-4 rounded-lg border border-border/60 p-4"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 text-destructive hover:text-destructive/80"
            onClick={() => remove(blockIndex)}
          >
            <Trash className="h-4 w-4" />
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium">Certification Name</label>
            <Input {...register(`certifications.blocks.${blockIndex}.name`)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Issuer</label>
              <Input
                {...register(`certifications.blocks.${blockIndex}.issuer`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                {...register(`certifications.blocks.${blockIndex}.date`)}
              />
            </div>
          </div>
        </div>
      ))}

      {focusIndex === null && (
        <Button
          type="button"
          variant="ghost"
          className="mt-4 w-full"
          onClick={handleAddBlock}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Certification
        </Button>
      )}
    </div>
  )
}
