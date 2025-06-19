"use client"

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { MarkdownModal } from "@/components/ui/markdown-modal";
import { useState } from "react";

export function EducationForm() {
  const { control, register, setValue, getValues } = useFormContext<ResumeData>();
  const { fields, append } = useFieldArray({
    control,
    name: "education.blocks",
  });
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);

  const handleAddBlock = () => {
    append({
      school: "",
      degree: "",
      start: "",
      end: "",
      content: "",
    });
  };

  const handleContentChange = (md: string) => {
    if (editingBlockIndex !== null) {
      setValue(`education.blocks.${editingBlockIndex}.content`, md, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field, blockIndex) => (
        <div key={field.id} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">School</label>
              <Input
                {...register(`education.blocks.${blockIndex}.school`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Degree</label>
              <Input
                {...register(`education.blocks.${blockIndex}.degree`)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                {...register(`education.blocks.${blockIndex}.start`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                {...register(`education.blocks.${blockIndex}.end`)}
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
        Add Education
      </Button>

      <MarkdownModal
        isOpen={editingBlockIndex !== null}
        onClose={() => setEditingBlockIndex(null)}
        markdown={editingBlockIndex !== null ? getValues(`education.blocks.${editingBlockIndex}.content`) || "" : ""}
        onChange={handleContentChange}
        title="Edit Education Content"
      />
    </div>
  );
}
