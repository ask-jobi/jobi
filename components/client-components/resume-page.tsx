"use client"

import {useEffect, useState} from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { saveResumeChange } from "@/server/resume";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PersonalInfoForm } from "./forms/personal-info-form";
import { EducationForm } from "./forms/education-form";
import { EmploymentForm } from "./forms/employment-form";
import { SkillsForm } from "./forms/skills-form";
import { ResumeData } from "@/types/resume";
import { useResume } from "@/lib/store/resume";
import ResumeEditor from "./resume-editor";
import {useDebouncedCallback} from "@mantine/hooks";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";


export default function ResumePage() {
  const { updateResumeData, setLoading, selectedSectionId, resumeData, application } = useResume();
  const resumeId = application.resume.id;
  const methods = useForm<ResumeData>({
    defaultValues: resumeData,
    mode: "onChange"
  });
  const { watch, getValues, formState: {isDirty}, reset } = methods;

  // Resizable handled by react-resizable-panels
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(true);

  // Reset form when resume data changes (e.g., switching between resumes)
  useEffect(() => {
    if (resumeData) {
      reset(resumeData);
    }
  }, [resumeData, reset]);


  const handleChange = async () => {
    try {
      const formData = getValues();
      await saveResumeChange(resumeId, formData);
      updateResumeData(formData);
      setLoading(false);
      toast.success("Auto saved");
    } catch (error) {
      console.error("Auto save failed:", error);
      toast.error("Auto save failed");
    }
  };
  const debouncedSave = useDebouncedCallback(handleChange, 2000);

  useEffect(() => {
    const subscription = watch((data) => {
      if (data && isDirty) {
        updateResumeData(data as ResumeData);
        debouncedSave();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave, updateResumeData, isDirty]);


  const renderSelectedSectionForm = () => {
    switch (selectedSectionId) {
      case "personalInfo":
        return <PersonalInfoForm />;
      case "education":
        return <EducationForm />;
      case "employment":
        return <EmploymentForm />;
      case "skills":
        return <SkillsForm />;
      default:
        return <p className="text-gray-500">Select a part of resume to edit。</p>;
    }
  };

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed);
  }

  const openRightPanel = () => {
    setIsRightPanelCollapsed(false)
  }

  return (
    <FormProvider {...methods}>
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
        <PanelGroup direction="horizontal" className="flex-1 h-full">
          <Panel minSize={25} defaultSize={isRightPanelCollapsed ? 100 : 67} className="h-full overflow-y-auto">
            <div className="flex flex-col gap-4 divide-y h-full overflow-y-auto">
              <ResumeEditor onSelectionClick={openRightPanel} />
            </div>
          </Panel>
          {!isRightPanelCollapsed && (
            <>
              <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 cursor-col-resize relative group">
                <button
                  onClick={toggleRightPanel}
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-l flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Collapse right panel"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </PanelResizeHandle>
              <Panel minSize={20} defaultSize={33} className="h-full overflow-y-auto border-l">
                <div className="right p-6 h-full overflow-y-auto">
                  {renderSelectedSectionForm()}
                </div>
              </Panel>
            </>
          )}
          {isRightPanelCollapsed && (
            <div className="w-1 bg-gray-200 hover:bg-gray-300 relative group">
              <button
                onClick={toggleRightPanel}
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-r flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Expand right panel"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>
          )}
        </PanelGroup>
      </div>
    </FormProvider>
  );
}
