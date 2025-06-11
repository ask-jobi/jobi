"use client"

import {useEffect} from "react";
import {useSidebar} from "@/components/ui/sidebar";
import { useResume } from "./resume-context";
import { DefaultTemplate } from "@/components/resume-templates/default-template";


export default function ResumeEditor() {
  const { resumeData, setSelectedSectionId } = useResume();
  const sidebar = useSidebar();

  useEffect(() => {
    sidebar.setOpen(false)
  }, []);

  const defaultTemplate = new DefaultTemplate();

  return (
    <div className="w-full h-full flex justify-center items-start">
      <div className="w-[210mm] bg-white shadow-lg border border-gray-200 overflow-y-auto">
        {defaultTemplate.renderDocument(resumeData, setSelectedSectionId)}
      </div>
    </div>
  );
}
