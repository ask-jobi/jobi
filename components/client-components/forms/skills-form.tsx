"use client"

import {useFormContext, useFieldArray, Controller} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ResumeData } from "@/types/resume";
import {InputTags} from "@/components/ui/input-tags";
import React from "react";

export function SkillsForm() {
  const { control, register } = useFormContext<ResumeData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills.blocks",
  });

  const handleAddBlock = () => {
    append({
      group: "",
      content: [],
    });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, blockIndex) => (
        <div key={field.id} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Group</label>
            <Input
              {...register(`skills.blocks.${blockIndex}.group`)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Skills</label>
            <Controller
              control={control}
              name={`skills.blocks.${blockIndex}.content`}
              render={({field}) => {
                return <InputTags
                  {...field}
                  placeholder="Input skill and press Enter or comma to add"
                />
              }}
            />
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
