"use client"

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { MarkdownModal } from "@/components/ui/markdown-modal";
import { useState } from "react";
import { MonthRangePickerFormField } from "@/components/ui/monthrangepicker-form-field";

export function EmploymentForm() {
  const { control, register, setValue, getValues } = useFormContext<ResumeData>();
  const { fields, append } = useFieldArray({
    control,
    name: "employment.blocks",
  });
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);

  const handleAddBlock = () => {
    append({
      company: "",
      jobTitle: "",
      start: "",
      end: "",
      content: "",
    });
  };

  const handleContentChange = (md: string) => {
    if (editingBlockIndex !== null) {
      setValue(`employment.blocks.${editingBlockIndex}.content`, md, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
    }
  };

  return (
    <div className="space-y-4 pb-[70vh]">
      {fields.map((field, blockIndex) => (
        <div id={`form-employment-${blockIndex}`} key={field.id} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                {...register(`employment.blocks.${blockIndex}.company`)}
              />
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
            <div className="flex flex-col justify-between">
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
      <Button
        type="button"
        variant="ghost"
        className="w-full mt-4"
        onClick={handleAddBlock}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Experience
      </Button>

      <MarkdownModal
        isOpen={editingBlockIndex !== null}
        onClose={() => setEditingBlockIndex(null)}
        markdown={editingBlockIndex !== null ? getValues(`employment.blocks.${editingBlockIndex}.content`) || "" : ""}
        onChange={handleContentChange}
        title="Edit Experience Content"
      />
    </div>
  );
}
