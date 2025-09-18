"use client"

import useResumeTemplate from "@/lib/hooks/use-resume-template";

export default function ResumeEditor() {
  const template = useResumeTemplate()

  if (!template) return null;

  return (
    <div className="w-full flex justify-center items-start">
      <div className="w-[210mm] bg-white shadow-lg border border-gray-200 overflow-y-auto">
        {template.renderDocument()}
      </div>
    </div>
  );
}
