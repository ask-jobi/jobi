"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { nanoid } from "nanoid"
import { Plus, Edit, Trash } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field"
import { MarkdownModal } from "@/components/ui/markdown-modal"
import { ResumeData } from "@/types/resume"

interface ResearchFormProps {
  focusIndex?: number | null
}

export function ResearchForm({ focusIndex = null }: ResearchFormProps) {
  const { control, register, setValue, getValues } =
    useFormContext<ResumeData>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "research.blocks"
  })
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(
    null
  )

  const handleAddBlock = () => {
    append({
      blockId: nanoid(),
      title: "",
      role: "",
      content: "",
      date: {
        start: "",
        end: ""
      }
    })
  }

  const handleContentChange = (md: string) => {
    if (editingBlockIndex !== null) {
      setValue(`research.blocks.${editingBlockIndex}.content`, md, {
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
      id="form-research"
      className={focusIndex === null ? "space-y-4 pb-[70vh]" : "space-y-4"}
    >
      {visibleFields.map(({ field, blockIndex }) => (
        <div
          id={`form-research-${blockIndex}`}
          key={field.id}
          className="relative space-y-4 rounded-lg border border-border/60 p-4"
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
              <label className="text-sm font-medium">Research Title</label>
              <Input {...register(`research.blocks.${blockIndex}.title`)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input {...register(`research.blocks.${blockIndex}.role`)} />
            </div>
          </div>

          <MonthRangePickerFormField
            startName={`research.blocks.${blockIndex}.date.start`}
            endName={`research.blocks.${blockIndex}.date.end`}
            label="Start/End Date"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Content</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingBlockIndex(blockIndex)}
              >
                <Edit className="mr-2 h-4 w-4" />
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
          className="mt-4 w-full"
          onClick={handleAddBlock}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Research
        </Button>
      )}

      <MarkdownModal
        isOpen={editingBlockIndex !== null}
        onClose={() => setEditingBlockIndex(null)}
        markdown={
          editingBlockIndex !== null
            ? getValues(`research.blocks.${editingBlockIndex}.content`) || ""
            : ""
        }
        onChange={handleContentChange}
        title="Edit Research Content"
      />
    </div>
  )
}
