"use client"

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { ResumeData } from "@/types/resume";

export function PersonalInfoForm() {
  const { register } = useFormContext<ResumeData>();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">First Name</label>
          <Input {...register("personalInfo.firstName")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Last Name</label>
          <Input {...register("personalInfo.lastName")} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input {...register("personalInfo.email")} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Phone</label>
        <Input {...register("personalInfo.phone")} />
      </div>
    </div>
  );
} 