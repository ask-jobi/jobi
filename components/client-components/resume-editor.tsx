"use client"

import useResumeTemplate from "@/lib/hooks/use-resume-template";
import { useResume } from "@/lib/store/resume";
import { FloatingButtonGroup } from "./floating-button-group";

interface ResumeEditorProps {
  onSelectionClick?: () => void;
}

export default function ResumeEditor({ onSelectionClick }: ResumeEditorProps) {
  const template = useResumeTemplate()
  const { resumeData } = useResume()

  if (!template) return null;

  // Override the template's onSectionClick to also expand the right panel
  const originalOnSectionClick = template.onSectionClick;
  template.onSectionClick = (id, index) => {
    originalOnSectionClick(id, index);
    if (onSelectionClick) {
      onSelectionClick();
    }
  };

  return (
    <div className="w-full flex justify-center items-start relative py-4">
      <div className="w-[210mm] bg-white shadow-lg border border-gray-200 overflow-y-auto overflow-x-hidden relative">
        {template.renderDocument()}
      </div>
      {resumeData && (
        <div className="sticky left-[calc(50%+205mm/2)] top-[20%] -translate-y-1/2">
          <FloatingButtonGroup resumeData={resumeData} />
        </div>
      )}
    </div>
  );
}
