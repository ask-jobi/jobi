"use client"

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { saveResumeChange } from "@/server/resume";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { Download, GripVertical } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

import { PersonalInfoForm } from "./forms/personal-info-form";
import { EducationForm } from "./forms/education-form";
import { EmploymentForm } from "./forms/employment-form";
import { SkillsForm } from "./forms/skills-form";
import { ResumeData } from "@/types/resume";
import { useResume } from "./resume-context";
import ResumeEditor from "./resume-editor";

interface SortableSectionItemProps {
  id: string;
  title: string;
  onClick: (id: string) => void;
  isSelected: boolean;
}

function SortableSectionItem({ id, title, onClick, isSelected }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...listeners}
      className={`mb-2 p-2 rounded-md cursor-grab flex justify-between items-center ${isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
      onClick={() => onClick(id)}
    >
      <span>{title}</span>
      <GripVertical className="h-4 w-4 text-gray-400" />
    </li>
  );
}

export default function ResumePage() {
  const { updateResumeData, setLoading, selectedSectionId, handleSectionClick, resumeData, application } = useResume();
  const resumeId = application.resume.id;
  const methods = useForm<ResumeData>({
    defaultValues: resumeData,
    mode: "onChange"
  });
  const { watch, getValues, setValue } = methods;
  const router = useRouter();

  const [sections, setSections] = useState(() => {
    const educationOrder = watch("educationHistory.order") ?? 0;
    const employmentOrder = watch("employmentHistory.order") ?? 1;
    const skillsOrder = watch("skills.order") ?? 2;

    const initialSections = [
      { id: "personalInfo", title: "Personal Info", order: -1 },
      { id: "education", title: watch("educationHistory.title"), order: educationOrder },
      { id: "employment", title: watch("employmentHistory.title"), order: employmentOrder },
      { id: "skills", title: watch("skills.title"), order: skillsOrder },
    ];
    return initialSections.sort((a, b) => a.order - b.order);
  });

  const [activeId, setActiveId] = useState<string | null>(null);

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
      if (data) {
        updateResumeData(data as ResumeData);
        debouncedSave();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave, updateResumeData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((item) => item.id === active.id);
      const newIndex = sections.findIndex((item) => item.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);

      newSections.forEach((section, index) => {
        if (section.id === "education") {
          setValue("educationHistory.order", index);
        } else if (section.id === "employment") {
          setValue("employmentHistory.order", index);
        } else if (section.id === "skills") {
          setValue("skills.order", index);
        }
        section.order = index;
      });
      setSections(newSections);
    }
    setActiveId(null);
  };

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
        return <p className="text-gray-500">选择一个简历部分来编辑。</p>;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="left w-1/5 p-6 border-r">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                const currentResumeData = getValues();
                sessionStorage.setItem('printResumeData', JSON.stringify(currentResumeData));
                router.push(`/resume-print`);
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={sections.filter(s => s.id !== "personalInfo").map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul>
                <li
                  className={`mb-2 p-2 rounded-md flex justify-between items-center cursor-pointer ${selectedSectionId === "personalInfo" ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                  onClick={() => handleSectionClick("personalInfo")}
                >
                  Personal Info
                </li>
                {sections.filter(s => s.id !== "personalInfo").map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    onClick={handleSectionClick}
                    isSelected={selectedSectionId === section.id}
                  />
                ))}
              </ul>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="p-2 bg-white border rounded-md shadow-md">
                  {sections.find(section => section.id === activeId)?.title || ""}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="w-full p-6 overflow-y-scroll">
          <ResumeEditor />
        </div>

        <div className="right w-1/3 p-6 border-l overflow-y-auto">
          {renderSelectedSectionForm()}
        </div>
      </div>
    </FormProvider>
  );
}
