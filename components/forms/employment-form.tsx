"use client"

import { useFormContext, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash } from "lucide-react"
import { ResumeData } from "@/types/resume"
import { MarkdownModal } from "@/components/ui/markdown-modal"
import { useState } from "react"
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field"
import { nanoid } from "nanoid"

interface EmploymentFormProps {
  focusIndex?: number | null
}

export function EmploymentForm({ focusIndex = null }: EmploymentFormProps) {
  const { control, register, setValue, getValues } =
    useFormContext<ResumeData>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "employment.blocks"
  })
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(
    null
  )

  const handleAddBlock = () => {
    append({
      blockId: nanoid(),
      company: "",
      jobTitle: "",
      start: "",
      end: "",
      content: ""
    })
  }

  const handleContentChange = (md: string) => {
    if (editingBlockIndex !== null) {
      setValue(`employment.blocks.${editingBlockIndex}.content`, md, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      })
    }
  }

  const handleRemoveBlock = (index: number) => {
    remove(index)
    if (editingBlockIndex !== null) {
      if (editingBlockIndex === index) {
        setEditingBlockIndex(null)
      } else if (editingBlockIndex > index) {
        setEditingBlockIndex(editingBlockIndex - 1)
      }
    }
  }

  const visibleFields =
    typeof focusIndex === "number"
      ? fields
          .map((field, blockIndex) => ({ field, blockIndex }))
          .filter(({ blockIndex }) => blockIndex === focusIndex)
      : fields.map((field, blockIndex) => ({ field, blockIndex }))

  return (
    <div
      id="form-employment"
      className={focusIndex === null ? "space-y-4 pb-[70vh]" : "space-y-4"}
    >
      {visibleFields.map(({ field, blockIndex }) => (
        <div
          id={`form-employment-${blockIndex}`}
          key={field.id}
          className="space-y-4 rounded-lg border border-border/60 p-4 relative"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 text-destructive hover:text-destructive/80"
            onClick={() => handleRemoveBlock(blockIndex)}
          >
            <Trash className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input {...register(`employment.blocks.${blockIndex}.company`)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input
                {...register(`employment.blocks.${blockIndex}.jobTitle`)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <MonthRangePickerFormField
                startName={`employment.blocks.${blockIndex}.start`}
                endName={`employment.blocks.${blockIndex}.end`}
                label="Start/End Date"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Content</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingBlockIndex(blockIndex)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Content
              </Button>
            </div>
          </div>
        </div>
      ))}
      {focusIndex === null && (
        <Button
          type="button"
          variant="ghost"
          className="w-full mt-4"
          onClick={handleAddBlock}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      )}

      <MarkdownModal
        isOpen={editingBlockIndex !== null}
        onClose={() => setEditingBlockIndex(null)}
        markdown={
          editingBlockIndex !== null
            ? getValues(`employment.blocks.${editingBlockIndex}.content`) || ""
            : ""
        }
        onChange={handleContentChange}
        title="Edit Experience Content"
      />
    </div>
  )
}
