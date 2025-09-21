"use client"

import useResumeTemplate from "@/lib/hooks/use-resume-template";

interface ResumeEditorProps {
  onSelectionClick?: () => void;
}

export default function ResumeEditor({ onSelectionClick }: ResumeEditorProps) {
  const template = useResumeTemplate()

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
    <div className="w-full flex justify-center items-start">
      <div className="w-[210mm] bg-white shadow-lg border border-gray-200 overflow-y-auto">
        {template.renderDocument()}
      </div>
    </div>
  );
}
