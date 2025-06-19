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
import Image from "next/image";

import { PersonalInfoForm } from "./forms/personal-info-form";
import { EducationForm } from "./forms/education-form";
import { EmploymentForm } from "./forms/employment-form";
import { SkillsForm } from "./forms/skills-form";
import {AISuggestion, AISuggestionQueue, ResumeData} from "@/types/resume";
import { useResume } from "./resume-context";
import ResumeEditor from "./resume-editor";
import { Separator } from "../ui/separator";
import { TourStep, useTour } from "@/components/tour";
import SuggestionPatch from "@/components/client-components/suggestion-patch";

interface SortableSectionItemProps {
  id: string;
  title: string;
  onClick: (id: string) => void;
  isSelected: boolean;
}

function SortableSectionItem({ id, title, onClick, isSelected }: SortableSectionItemProps) {
  const {
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
  const { setSteps, startTour } = useTour();

  const [sections, setSections] = useState(() => {
    const educationOrder = watch("education.order") ?? 0;
    const employmentOrder = watch("employment.order") ?? 1;
    const skillsOrder = watch("skills.order") ?? 2;

    const initialSections = [
      { id: "personalInfo", title: "Personal Info", order: -1 },
      { id: "education", title: watch("education.title"), order: educationOrder },
      { id: "employment", title: watch("employment.title"), order: employmentOrder },
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
      if (data && methods.formState.isDirty) {
        updateResumeData(data as ResumeData);
        debouncedSave();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSave, updateResumeData, methods.formState.isDirty]);

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
          setValue("education.order", index);
        } else if (section.id === "employment") {
          setValue("employment.order", index);
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

  const handleExport = () => {
    const currentResumeData = getValues();
    sessionStorage.setItem('printResumeData', JSON.stringify(currentResumeData));
    router.push(`/resume-print`);
  }

  const handleFullResumeOptimizing = async () => {
    try {
      // const result = await fetch(`/api/resume/full-suggestion?jobApplicationId=${application.id}`)
      // const suggestions = (await result.json()) as AISuggestionQueue
      // console.log(suggestions)
      setSteps(steps)
      startTour()
    } catch (e: any) {
      toast.error(e.toString())
    }
  }

  const testSection0 = {
    "section": "education",
    "blockIndex": 0,
    "suggestionType": "其他",
    "reason": "该部分内容杂乱无章，建议删除。",
    "originalContent": "## asdasdasd\n\n123\n\nsadjalskdjalksdjkaslda\n\n**asda**\n\n**该星号不会被识别而是直接显**这是因为它没有被识别为强调符号。\n\n*~~lksakjdasd~~*\n\nasdaldjlkasjdlkasd\n\n1. asdasdasdasdsd\n2. asdaskdaskldj\n\n`asdalksdasd`\n\n- > askdhakjsdhakjsdad\n- > asdasddsada\n\n> asdasdkasnhdkjashdkasd",
    "optimizedContent": null,
    "highlight": []
  } as AISuggestion

  const testSection1 = {
    "section": "employment",
    "blockIndex": 0,
    "suggestionType": "其他",
    "reason": "内容过于简单，没有有效信息。",
    "originalContent": "asdaskldja\n\ncccc",
    "optimizedContent": null,
    "highlight": []
  } as AISuggestion

  const steps: TourStep[] = [
    {
      content: () => <SuggestionPatch section={testSection0} getValues={getValues} setValue={setValue}/>,
      selectorId: "education-0",
    },
    {
      content: () => <SuggestionPatch section={testSection1} getValues={getValues} setValue={setValue}/>,
      selectorId: "employment-0",
    }
  ];

  // [
  //   {
  //     "section": "education",
  //     "blockIndex": 0,
  //     "suggestionType": "其他",
  //     "reason": "该部分内容杂乱无章，建议删除。",
  //     "originalContent": "## asdasdasd\n\n123\n\nsadjalskdjalksdjkaslda\n\n**asda**\n\n**该星号不会被识别而是直接显**这是因为它没有被识别为强调符号。\n\n*~~lksakjdasd~~*\n\nasdaldjlkasjdlkasd\n\n1. asdasdasdasdsd\n2. asdaskdaskldj\n\n`asdalksdasd`\n\n- > askdhakjsdhakjsdad\n- > asdasddsada\n\n> asdasdkasnhdkjashdkasd",
  //     "optimizedContent": null,
  //     "highlight": []
  //   },
  //   {
  //     "section": "employment",
  //     "blockIndex": 0,
  //     "suggestionType": "其他",
  //     "reason": "内容过于简单，没有有效信息。",
  //     "originalContent": "asdaskldja\n\ncccc",
  //     "optimizedContent": null,
  //     "highlight": []
  //   },
  //   {
  //     "section": "skills",
  //     "blockIndex": 0,
  //     "suggestionType": "去除重复",
  //     "reason": "技能罗列过于冗余，建议精简。",
  //     "originalContent": "Distributed System",
  //     "optimizedContent": "Distributed Systems, Test-Driven Development, Domain-Driven Design, Reactive Programming, Hexagonal Architecture, MVC, Agile, CI/CD, Clean Code",
  //     "highlight": [
  //       "Distributed Systems",
  //       "Test-Driven Development",
  //       "Domain-Driven Design",
  //       "Reactive Programming",
  //       "Hexagonal Architecture",
  //       "MVC",
  //       "Agile",
  //       "CI/CD",
  //       "Clean Code"
  //     ]
  //   },
  //   {
  //     "section": "skills",
  //     "blockIndex": 2,
  //     "suggestionType": "去除重复",
  //     "reason": "技能罗列过于冗余，建议精简。",
  //     "originalContent": "Domain-driven design",
  //     "optimizedContent": "SpringBoot, SpringWebFlux, Redis, JUnit5, Mockito, MockK, EMQX, MySQL, PostgreSQL, PactFlow",
  //     "highlight": [
  //       "SpringBoot",
  //       "SpringWebFlux",
  //       "Redis",
  //       "JUnit5",
  //       "Mockito",
  //       "MockK",
  //       "EMQX",
  //       "MySQL",
  //       "PostgreSQL",
  //       "PactFlow"
  //     ]
  //   }
  // ]

  return (
    <FormProvider {...methods}>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="left w-1/5 p-6 border-r">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleFullResumeOptimizing}
            >
              <Image src="/gemini-color.svg" alt="Gemini" width={16} height={16} />
              AI Optimize
            </Button>
          </div>
          <Separator className="my-4"/>
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
