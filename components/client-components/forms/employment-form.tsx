"use client"

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ResumeData } from "@/types/resume";
import { Editor } from "@/components/blocks/editor-00/editor";

export function EmploymentForm() {
  const { control, register, setValue } = useFormContext<ResumeData>();
  const { fields, append } = useFieldArray({
    control,
    name: "employmentHistory.blocks",
  });

  const handleAddBlock = () => {
    append({
      company: "",
      jobTitle: "",
      start: "",
      end: "",
      content: "",
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, blockIndex) => (
        <div key={field.id} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                {...register(`employmentHistory.blocks.${blockIndex}.company`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input
                {...register(`employmentHistory.blocks.${blockIndex}.jobTitle`)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                {...register(`employmentHistory.blocks.${blockIndex}.start`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                {...register(`employmentHistory.blocks.${blockIndex}.end`)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Editor
              markdown={field.content || ""}
              onChange={(md) => {
                setValue(`employmentHistory.blocks.${blockIndex}.content`, md);
              }}
            />
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
    </div>
  );
}
