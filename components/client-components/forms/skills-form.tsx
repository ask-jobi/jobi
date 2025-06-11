"use client"

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { ResumeData } from "@/types/resume";

export function SkillsForm() {
  const { control, register, getValues, setValue } = useFormContext<ResumeData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills.blocks",
  });

  const handleAddBlock = () => {
    append({
      group: "",
      content: [""],
    });
  };

  const handleAddSkill = (blockIndex: number) => {
    const currentContent = getValues(`skills.blocks.${blockIndex}.content`);
    append({
      group: fields[blockIndex].group,
      content: [...currentContent, ""],
    });
  };

  const handleRemoveSkill = (blockIndex: number, skillIndex: number) => {
    const currentContent = getValues(`skills.blocks.${blockIndex}.content`);
    const newContent = currentContent.filter((_: string, index: number) => index !== skillIndex);
    if (newContent.length === 0) {
      remove(blockIndex);
    } else {
      setValue(`skills.blocks.${blockIndex}.content`, newContent);
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field, blockIndex) => (
        <div key={field.id} className="space-y-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Group</label>
            <Input
              {...register(`skills.blocks.${blockIndex}.group`)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            {
              Array.isArray(field.content) && field.content.map((skill: string, skillIndex: number) => (
                <div key={skillIndex} className="flex items-center space-x-2">
                  <Input
                    {...register(`skills.blocks.${blockIndex}.content.${skillIndex}`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSkill(blockIndex, skillIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            }
            <Button
              type="button"
              variant="ghost"
              className="w-full mt-2"
              onClick={() => handleAddSkill(blockIndex)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>
          <Button
            type="button"
            variant="destructive"
            className="w-full mt-4"
            onClick={() => remove(blockIndex)}
          >
            Remove Skill Group
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="w-full mt-4"
        onClick={handleAddBlock}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Skill Group
      </Button>
    </div>
  );
} 